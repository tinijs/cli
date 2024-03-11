import chalk from 'chalk';

import {
  loadModule,} from '../../lib/utils/module.js';
import {success, errorUncleanGit} from '../utils/message.js';
import {
  installPackage,
  copyAssets,
  updateScripts,
  initRun,
} from '../utils/module.js';
import {isGitClean} from '../utils/git.js';

const {blueBright} = chalk;

export interface ModuleCommandOptions {
  tag?: string;
}

export default async function (
  packageName: string,
  commandOptions: ModuleCommandOptions
) {
  if (!isGitClean()) return errorUncleanGit();
  // install packages
  await installPackage(packageName, commandOptions.tag);
  // handle init
  const tiniModule = await loadModule(packageName);
  if (tiniModule?.init) {
    const {copy, scripts, buildCommand, run} = tiniModule.init;
    // copy assets
    if (copy) await copyAssets(packageName, copy);
    // add scripts
    if (scripts) await updateScripts(scripts, buildCommand);
    // run
    if (run) await initRun(run);
  }
  // done
  success(`Add module ${blueBright(packageName)} successfully.`);
}