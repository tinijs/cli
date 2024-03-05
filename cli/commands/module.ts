import chalk from 'chalk';

import {success, errorUncleanGit} from '../../lib/helpers/message.js';
import {
  installPackage,
  loadModuleConfig,
  copyAssets,
  updateScripts,
  initRun,
} from '../../lib/helpers/module.js';
import {isGitClean} from '../../lib/helpers/git.js';

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
  // load init instruction
  const moduleConfig = await loadModuleConfig(packageName);
  // handle init
  if (moduleConfig.init) {
    const {copy, scripts, buildCommand, run} = moduleConfig.init;
    // copy assets
    if (copy) {
      await copyAssets(packageName, copy);
    }
    // add scripts
    if (scripts) {
      await updateScripts(scripts, buildCommand);
    }
    // run
    if (run) {
      await initRun(run);
    }
  }
  // done
  success(`Add module ${blueBright(packageName)} successfully.`);
}
