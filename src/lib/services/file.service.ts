import fsExtra from 'fs-extra';
import recursiveReaddir from 'recursive-readdir';
import {createRequire} from 'module';

const {
  pathExists,
  readFile,
  readJson,
  writeJson,
  outputFile,
  remove,
  ensureDir,
  copyFile,
  copy,
} = fsExtra;

export const requireModule = createRequire(import.meta.url);

export class FileService {
  constructor() {}

  exists(path: string) {
    return pathExists(path);
  }

  createDir(path: string) {
    return ensureDir(path);
  }

  readText(filePath: string) {
    return readFile(filePath, 'utf8');
  }

  copyFile(src: string, dest: string) {
    return copyFile(src, dest);
  }

  copyDir(src: string, dest: string) {
    return copy(src, dest);
  }

  createFile(filePath: string, content: string) {
    return outputFile(filePath, content);
  }

  readJson<T>(filePath: string) {
    return readJson(filePath) as Promise<T>;
  }

  createJson<T>(filePath: string, jsonData: T, noSpaces = false) {
    return writeJson(filePath, jsonData, noSpaces ? {} : {spaces: 2});
  }

  removeFiles(paths: string[]) {
    return Promise.all(paths.map(filePath => remove(filePath)));
  }

  async cleanDir(path: string) {
    await remove(path);
    return this.createDir(path);
  }

  async listDir(path: string, ignores: string[] = []) {
    return recursiveReaddir(path, ignores);
  }

  async modifyContent(
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
}
