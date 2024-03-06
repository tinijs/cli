import {resolve} from 'pathe';
import {PackageJson} from 'type-fest';
import fsExtra from 'fs-extra';

import {requireModule} from './file.js';

const {readJson, writeJson} = fsExtra;

export const CLI_PACKAGE_JSON = requireModule('../../package.json');

export function getTargetEnv() {
  return process.env.TARGET_ENV || 'development';
}

export async function loadProjectPackageJson() {
  return readJson(resolve('package.json')) as Promise<PackageJson>;
}

export async function modifyProjectPackageJson(
  modifier: (currentData: PackageJson) => Promise<PackageJson>
) {
  const packageJsonPath = resolve('package.json');
  const currentData = (await readJson(packageJsonPath)) as PackageJson;
  const newData = await modifier(currentData);
  return writeJson(packageJsonPath, newData, {spaces: 2});
}
