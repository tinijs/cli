import {resolve} from 'pathe';
import {PackageJson} from 'type-fest';
import fsExtra from 'fs-extra';

import {requireModule, modifyJsonFile} from './file.js';

const {readJson} = fsExtra;

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
