import {resolve} from 'pathe';
import {createRequire} from 'module';
import recursiveReaddir from 'recursive-readdir';
import fsExtra from 'fs-extra';
import {Promisable} from 'type-fest';

const {ensureDir, remove, readFile, outputFile, readJson, writeJson} = fsExtra;

export const requireModule = createRequire(import.meta.url);

export function removeFiles(filePaths: string[]) {
  return Promise.all(filePaths.map(filePath => remove(filePath)));
}

export async function cleanDir(dirPath: string) {
  await remove(dirPath);
  return ensureDir(dirPath);
}

export async function listDir(dirPath: string, ignores?: string[]) {
  return recursiveReaddir(dirPath, ignores);
}

export async function modifyTextFile(
  filePath: string,
  modifier: (content: string) => Promisable<string>
) {
  filePath = resolve(filePath);
  const content = await readFile(filePath, 'utf8');
  return outputFile(filePath, await modifier(content));
}

export async function modifyJsonFile<Type>(
  filePath: string,
  modifier: (content: Type) => Promisable<Type>,
  options?: Parameters<typeof writeJson>[2]
) {
  filePath = resolve(filePath);
  const data = (await readJson(filePath)) as Type;
  return writeJson(filePath, await modifier(data), options);
}
