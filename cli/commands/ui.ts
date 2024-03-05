import {errorInvalidSubCommand} from '../../lib/helpers/message.js';
import useSubCommand, {UiUseCommandOptions} from './ui-use.js';
import buildSubCommand from './ui-build.js';
import devSubCommand from './ui-dev.js';
import iconSubCommand, {UIIconCommandOptions} from './ui-icon.js';

interface UiCommandOptions extends UiUseCommandOptions, UIIconCommandOptions {}

enum UiSubCommands {
  Use = 'use',
  Build = 'build',
  Dev = 'dev',
  Icon = 'icon',
}

export default function (
  subCommand: string,
  params: string[],
  options: UiCommandOptions
) {
  switch (subCommand) {
    case UiSubCommands.Use:
      useSubCommand(params, options);
      break;
    case UiSubCommands.Build:
      buildSubCommand(params[0], params[1]);
      break;
    case UiSubCommands.Dev:
      devSubCommand();
      break;
    case UiSubCommands.Icon:
      iconSubCommand(params, options);
      break;
    default:
      errorInvalidSubCommand(subCommand, UiSubCommands);
      break;
  }
}
