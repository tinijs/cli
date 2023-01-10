import {green, red} from 'chalk';

import {ERROR} from '../../lib/services/message.service';
import {PwaInitCommand} from './pwa-init.command';

export class PwaCommand {
  constructor(private pwaInitCommand: PwaInitCommand) {}

  run(subCommand: string) {
    switch (subCommand) {
      case 'init':
      case 'i':
        this.pwaInitCommand.run();
        break;
      default:
        console.log(
          ERROR +
            `Invalid sub-command '${red(subCommand)}', available: ` +
            `${green('init')}, `
        );
        break;
    }
  }
}
