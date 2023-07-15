import {MISSING_ARG} from '../../lib/services/message.service';

export class UiBuildCommand {
  constructor() {}

  run(packageName: string, soulName?: string) {
    if (!packageName) {
      return console.log(MISSING_ARG('packageName'));
    }
  }
}
