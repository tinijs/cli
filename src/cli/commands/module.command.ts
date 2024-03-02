import chalk from 'chalk';

import {MessageService} from '../../lib/services/message.service.js';
import {ModuleService} from '../../lib/services/module.service.js';

const {blueBright} = chalk;

export interface ModuleCommandOptions {
  tag?: string;
}

export class ModuleCommand {
  constructor(
    private messageService: MessageService,
    private moduleService: ModuleService
  ) {}

  async run(packageName: string, commandOptions: ModuleCommandOptions) {
    // install packages
    this.moduleService.installPackage(packageName, commandOptions.tag);
    // load init instruction
    const moduleConfig = await this.moduleService.loadModuleConfig(packageName);
    // handle init
    if (moduleConfig.init) {
      const {copy, scripts, buildCommand, run} = moduleConfig.init;
      // copy assets
      if (copy) {
        await this.moduleService.copyAssets(packageName, copy);
      }
      // add scripts
      if (scripts) {
        await this.moduleService.updateScripts(scripts, buildCommand);
      }
      // run
      if (run) {
        this.moduleService.initRun(run);
      }
    }
    // done
    this.messageService.success(
      `Add module ${blueBright(packageName)} successfully.`
    );
  }
}
