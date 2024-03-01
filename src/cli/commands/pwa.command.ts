import chalk from 'chalk';

import {ERROR} from '../../lib/services/message.service.js';
import {PwaInitCommand, PwaInitCommandOptions} from './pwa-init.command.js';

const {red, green} = chalk;

type CommandOptions = PwaInitCommandOptions;

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
            `Invalid sub-command '${red(subCommand)}', available: ` +
            `${green('init')}.\n`
        );
        break;
    }
  }
}
