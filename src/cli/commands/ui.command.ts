import * as chalk from 'chalk';

import {ERROR} from '../../lib/services/message.service';
import {UiUseCommand, UiUseCommandOptions} from './ui-use.command';
import {UiBuildCommand} from './ui-build.command';
import {UiDevCommand} from './ui-dev.command';
import {UiIconCommand} from './ui-icon.command';

type CommandOptions = UiUseCommandOptions;

export class UiCommand {
  constructor(
    private uiUseCommand: UiUseCommand,
    private uiBuildCommand: UiBuildCommand,
    private uiDevCommand: UiDevCommand,
    private uiIconCommand: UiIconCommand
  ) {}

  run(subCommand: string, params: string[], options: CommandOptions) {
    switch (subCommand) {
      case 'use':
        this.uiUseCommand.run(params, options);
        break;
      case 'build':
        this.uiBuildCommand.run(params[0], params[1]);
        break;
      case 'dev':
        this.uiDevCommand.run();
        break;
      case 'icon':
        this.uiIconCommand.run(params[0], params[1]);
        break;
      default:
        console.log(
          '\n' +
            ERROR +
            `Invalid sub-command '${chalk.red(subCommand)}', available: ` +
            `${chalk.green('use')}, ${chalk.green('build')}, ${chalk.green(
              'dev'
            )}, ${chalk.green('icon')}.\n`
        );
        break;
    }
  }
}
