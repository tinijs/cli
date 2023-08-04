import * as chalk from 'chalk';

import {ERROR} from '../../lib/services/message.service';
import {
  PwaInitCommand,
  CommandOptions as InitCommandOptions,
} from './pwa-init.command';

type CommandOptions = InitCommandOptions;

export class PwaCommand {
  constructor(private pwaInitCommand: PwaInitCommand) {}

  run(subCommand: string, commandOptions: CommandOptions) {
    switch (subCommand) {
      case 'init':
      case 'i':
        this.pwaInitCommand.run(commandOptions);
        break;
      default:
        console.log(
          '\n' +
            ERROR +
            `Invalid sub-command '${chalk.red(subCommand)}', available: ` +
            `${chalk.green('init')}.\n`
        );
        break;
    }
  }
}
