import {resolve} from 'pathe';
import axios from 'axios';
import fsExtra from 'fs-extra';
import zipper from 'adm-zip';

const {
  ensureDir,
  copy,
  remove,
  readdir,
  outputFile,
  lstatSync,
  createWriteStream,
} = fsExtra;

export async function downloadAndUnzip(url: string, filePath: string) {
  // copy
  if (!url.startsWith('http')) {
    await copy(resolve(url), filePath);
  }
  // download
  else {
    await downloadBlob(url, filePath);
  }
  // unzip
  await unzip(filePath);
  // remove the zip file
  await remove(filePath);
  // unnest if wrapped
  const {folderPath} = extractFilePath(filePath);
  await unnest(folderPath);
}

export function downloadBlob(url: string, filePath: string): Promise<void> {
  const {folderPath} = extractFilePath(filePath);
  return new Promise((resolve, reject) => {
    ensureDir(folderPath)
      .catch(reject)
      .then(() => {
        axios({
          method: 'GET',
          url,
          responseType: 'stream',
        }).then(downloadResponse => {
          downloadResponse.data.pipe(createWriteStream(filePath));
          downloadResponse.data.on('end', () => resolve());
          downloadResponse.data.on('error', reject);
        }, reject);
      }, reject);
  });
}

export async function downloadText(url: string, filePath: string) {
  const response = await axios({
    method: 'GET',
    url,
    responseType: 'text',
  });
  await outputFile(resolve(filePath), response.data);
}

export function unzip(filePath: string): Promise<void> {
  const {folderPath} = extractFilePath(filePath);
  return new Promise(resolve => {
    setTimeout(() => {
      const zip = new zipper(filePath);
      zip.extractAllTo(folderPath, true);
      resolve();
    }, 1000);
  });
}

export function unnest(dir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    readdir(dir, (err, localPathChildren) => {
      const firstItem = dir + '/' + localPathChildren[0];
      if (
        localPathChildren.length === 1 &&
        lstatSync(firstItem).isDirectory()
      ) {
        // unnest
        copy(firstItem, dir)
          .catch(reject)
          // remove dir
          .then(() => remove(firstItem))
          // done
          .then(() => resolve(), reject);
      }
    });
  });
}

export function extractFilePath(filePath: string) {
  const pathSegments = filePath.split('/');
  const fileFullName = pathSegments.pop() as string;
  const fileName = fileFullName.split('.').shift() as string;
  const folderPath = pathSegments.join('/');
  const folderName = pathSegments.pop();
  return {
    pathSegments,
    folderPath,
    folderName,
    filePath,
    fileName,
    fileFullName,
  };
}
