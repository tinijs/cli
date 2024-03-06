import fsExtra from 'fs-extra';
import recursiveReaddir from 'recursive-readdir';
import {createRequire} from 'module';

const {readFile, outputFile, remove, ensureDir} = fsExtra;

export const requireModule = createRequire(import.meta.url);

export function removeFiles(paths: string[]) {
  return Promise.all(paths.map(filePath => remove(filePath)));
}

export async function cleanDir(path: string) {
  await remove(path);
  return ensureDir(path);
}

export async function listDir(path: string, ignores: string[] = []) {
  return recursiveReaddir(path, ignores);
}

export async function modifyContent(
  filePath: string,
  modifier: {[str: string]: string} | ((content: string) => string),
  multipleReplaces = false
) {
  let content = await readFile(filePath, 'utf8');
  if (modifier instanceof Function) {
    content = modifier(content);
  } else {
    Object.keys(modifier).forEach(
      str =>
        (content = content.replace(
          !multipleReplaces ? str : new RegExp(str, 'g'),
          modifier[str]
        ))
    );
  }
  return outputFile(filePath, content);
}
