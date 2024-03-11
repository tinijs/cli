import {resolve} from 'pathe';
import {PackageJson} from 'type-fest';
import {readJson} from 'fs-extra/esm';

import {requireModule, modifyJsonFile} from './file.js';

export const TINIJS_INSTALL_DIR_PATH = resolve('node_modules', '@tinijs');

export function getTargetEnv() {
  return process.env.TARGET_ENV || 'development';
}

export async function loadCliPackageJson() {
  return requireModule('../../package.json') as PackageJson;
}

export async function loadProjectPackageJson() {
  return readJson(resolve('package.json')) as Promise<PackageJson>;
}

export async function modifyProjectPackageJson(
  modifier: (currentData: PackageJson) => Promise<PackageJson>
) {
  return modifyJsonFile('package.json', modifier, {spaces: 2});
}
