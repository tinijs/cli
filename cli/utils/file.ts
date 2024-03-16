import {resolve} from 'pathe';
import recursiveReaddir from 'recursive-readdir';
import {readFile} from 'node:fs/promises';
import {ensureDir, remove, outputFile, readJson, writeJson} from 'fs-extra/esm';
import {Promisable} from 'type-fest';

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
