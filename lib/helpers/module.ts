import {resolve} from 'pathe';
import {loadConfig} from 'c12';
import fsExtra from 'fs-extra';

import {modifyProjectPackageJson} from '../../lib/helpers/project.js';
import {exec} from '../../lib/helpers/terminal.js';

const {stat, pathExists, copy: copyDir, copyFile} = fsExtra;

export interface ModuleConfig {
  init?: ModuleInit;
  defaults?: Record<string, any>;
  build?: (options: any) => void | Promise<void>;
}

export interface ModuleInit {
  copy?: Record<string, string>;
  scripts?: Record<string, string>;
  buildCommand?: string;
  run?: string | (() => void);
}

export function defineTiniModule(config: ModuleConfig) {
  return config;
}

export function installPackage(packageName: string, tag?: string) {
  return exec(`npm i ${packageName}${!tag ? '' : `@${tag}`}  --loglevel error`);
}

export async function loadModuleConfig(
  packageName: string,
  customDir?: string
) {
  const loadResult = await loadConfig({
    cwd: customDir ? resolve(customDir) : resolve('node_modules', packageName),
    configFile: 'tini.module',
    rcFile: false,
  });
  return loadResult.config as ModuleConfig;
}

export async function copyAssets(
  packageName: string,
  copy: NonNullable<ModuleInit['copy']>
) {
  for (const from in copy) {
    const fromPath = resolve('node_modules', packageName, from);
    const toPath = resolve(copy[from]);
    if ((await pathExists(fromPath)) && !(await pathExists(toPath))) {
      const stats = await stat(fromPath);
      if (stats.isFile()) {
        await copyFile(fromPath, toPath);
      } else if (stats.isDirectory()) {
        await copyDir(fromPath, toPath);
      }
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

export function initRun(run: NonNullable<ModuleInit['run']>) {
  return run instanceof Function
    ? run()
    : exec(run.startsWith('npx ') ? run : `npm run ${run}`);
}
