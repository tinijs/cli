import chalk from 'chalk';

import {success} from '../../lib/helpers/message.js';
import {
  installPackage,
  loadModuleConfig,
  copyAssets,
  updateScripts,
  initRun,
} from '../../lib/helpers/module.js';

const {blueBright} = chalk;

export interface ModuleCommandOptions {
  tag?: string;
}

export async function moduleCommand(
  packageName: string,
  commandOptions: ModuleCommandOptions
) {
  // install packages
  installPackage(packageName, commandOptions.tag);
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
      initRun(run);
    }
  }
  // done
  success(`Add module ${blueBright(packageName)} successfully.`);
}
