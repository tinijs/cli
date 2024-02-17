import {blueBright} from 'chalk';

import {ERROR, OK} from '../../lib/services/message.service';
import {ServerService} from '../../lib/services/server.service';

export interface ServerAddCommandOptions {
  skipInstall?: boolean;
  tag?: string;
}

export class ServerAddCommand {
  constructor(private serverService: ServerService) {}

  async run(packageName: string, commandOptions: ServerAddCommandOptions) {
    if (!packageName) {
      return console.log('\n' + ERROR + 'Package name is required.\n');
    }
    // install packages
    if (!commandOptions.skipInstall) {
      this.serverService.installPackage(packageName, commandOptions.tag);
    }
    // load init instruction
    const {copy, scripts, run, buildCommand} =
      await this.serverService.loadInitInstruction(packageName);
    // copy assets
    if (copy) {
      await this.serverService.copyAssets(packageName, copy);
    }
    // add scripts
    if (scripts) {
      await this.serverService.updateScripts(scripts, buildCommand);
    }
    // run additional
    if (run) {
      this.serverService.runAdditional(run);
    }
    // done
    console.log('\n' + OK + ` Server ${blueBright(packageName)} added.\n`);
  }
}
