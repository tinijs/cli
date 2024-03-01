import chalk from 'chalk';

import {ERROR} from '../../lib/services/message.service.js';
import {
  ServerAddCommand,
  ServerAddCommandOptions,
} from './server-add.command.js';
import {ServerBuildCommand} from './server-build.command.js';

const {red, green} = chalk;

type CommandOptions = ServerAddCommandOptions;

export class ServerCommand {
  constructor(
    private serverAddCommand: ServerAddCommand,
    private serverBuildCommand: ServerBuildCommand
  ) {}

  run(subCommand: string, params: string[], commandOptions: CommandOptions) {
    switch (subCommand) {
      case 'add':
        this.serverAddCommand.run(params[0], commandOptions);
        break;
      case 'build':
        this.serverBuildCommand.run(params[0]);
        break;
      default:
        console.log(
          '\n' +
            ERROR +
            `Invalid sub-command '${red(subCommand)}', available: ` +
            `${green('add')}, ${green('build')}.\n`
        );
        break;
    }
  }
}
