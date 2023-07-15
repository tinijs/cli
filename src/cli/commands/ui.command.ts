import * as chalk from 'chalk';

import {ERROR} from '../../lib/services/message.service';
import {UiUseCommand, UiUseCommandOptions} from './ui-use.command';
import {UiBuildCommand} from './ui-build.command';

interface CommandOptions extends UiUseCommandOptions {}

export class UiCommand {
  constructor(
    private uiUseCommand: UiUseCommand,
    private uiBuildCommand: UiBuildCommand,
  ) {}

  run(subCommand: string, params: string[], commandOptions: CommandOptions) {
    switch (subCommand) {
      case 'use':
        this.uiUseCommand.run(params[0], params[1], commandOptions);
        break;
      case 'build':
        this.uiBuildCommand.run(params[0], params[1]);
        break;
      default:
        console.log(
          ERROR +
            `Invalid sub-command '${chalk.red(subCommand)}', available: ` +
            `${chalk.green('use')}, ${chalk.green('build')}`
        );
        break;
    }
  }
}
