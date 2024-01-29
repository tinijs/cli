import * as chalk from 'chalk';

import {ERROR} from '../../lib/services/message.service';
import {ServerAddCommand, ServerAddCommandOptions} from './server-add.command';
import {ServerBuildCommand} from './server-build.command';

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
        this.serverBuildCommand.run();
        break;
      default:
        console.log(
          '\n' +
            ERROR +
            `Invalid sub-command '${chalk.red(subCommand)}', available: ` +
            `${chalk.green('add')}, ${chalk.green('build')}.\n`
        );
        break;
    }
  }
}
