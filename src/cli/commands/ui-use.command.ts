import {MISSING_ARG} from '../../lib/services/message.service';

interface CommandOptions {
  icons?: string;
  components?: string;
}

export {CommandOptions as UiUseCommandOptions};

export class UiUseCommand {
  constructor() {}

  run(soul: string, skins: string, options: CommandOptions) {
    if (!soul) {
      return console.log(MISSING_ARG('soul'));
    }
    if (!skins) {
      return console.log(MISSING_ARG('skins'));
    }
  }
}
