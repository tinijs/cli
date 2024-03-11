import {resolve} from 'pathe';
import {existsSync} from 'node:fs';
import {copy as copyFileOrDir} from 'fs-extra/esm';
import {execaCommand} from 'execa';

import {ModuleInit} from 'tinijs';

import {modifyProjectPackageJson} from './project.js';

export async function installPackage(packageName: string, tag?: string) {
  return execaCommand(
    `npm i ${packageName}${!tag ? '' : `@${tag}`}  --loglevel error`
  );
}

export async function copyAssets(
  packageName: string,
  copy: NonNullable<ModuleInit['copy']>
) {
  for (const from in copy) {
    const fromPath = resolve('node_modules', packageName, from);
    const toPath = resolve(copy[from]);
    if (existsSync(fromPath) && !existsSync(toPath)) {
      await copyFileOrDir(fromPath, toPath);
    }
  }
}

export async function updateScripts(
  scripts: NonNullable<ModuleInit['scripts']>,
  buildCommand?: ModuleInit['buildCommand']
) {
  return modifyProjectPackageJson(async data => {
    const build = [
      (data.scripts as any).build,
      !buildCommand ? undefined : `npm run ${buildCommand}`,
    ]
      .filter(Boolean)
      .join(' && ');
    data.scripts = {
      ...scripts,
      ...data.scripts,
      ...(!build ? {} : {build}),
    };
    return data;
  });
}

export async function initRun(run: NonNullable<ModuleInit['run']>) {
  return run instanceof Function
    ? run()
    : execaCommand(run.startsWith('npx ') ? run : `npm run ${run}`);
}
