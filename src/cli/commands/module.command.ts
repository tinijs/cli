import chalk from 'chalk';

import {OK} from '../../lib/services/message.service.js';
import {ModuleService} from '../../lib/services/module.service.js';

const {blueBright} = chalk;

export interface ModuleCommandOptions {
  tag?: string;
}

export class ModuleCommand {
  constructor(private moduleService: ModuleService) {}

  async run(packageName: string, commandOptions: ModuleCommandOptions) {
    // install packages
    this.moduleService.installPackage(packageName, commandOptions.tag);
    // load init instruction
    const {copy, scripts, buildCommand, run} =
      await this.moduleService.loadInitInstruction(packageName);
    // copy assets
    if (copy) {
      await this.moduleService.copyAssets(packageName, copy);
    }
    // add scripts
    if (scripts) {
      await this.moduleService.updateScripts(scripts, buildCommand);
    }
    // run additional
    if (run) {
      this.moduleService.runAdditional(packageName, run);
    }
    // done
    console.log(
      '\n' + OK + `Add module ${blueBright(packageName)} successfully.\n`
    );
  }
}
