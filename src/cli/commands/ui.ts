import {errorInvalidSubCommand} from '../../lib/helpers/message.js';
import {uiUseCommand, UiUseCommandOptions} from './ui-use.js';
import {uiBuildCommand} from './ui-build.js';
import {uiDevCommand} from './ui-dev.js';
import {uiIconCommand, UIIconCommandOptions} from './ui-icon.js';

interface UiCommandOptions extends UiUseCommandOptions, UIIconCommandOptions {}

enum UiSubCommands {
  Use = 'use',
  Build = 'build',
  Dev = 'dev',
  Icon = 'icon',
}

export function uiCommand(
  subCommand: string,
  params: string[],
  options: UiCommandOptions
) {
  switch (subCommand) {
    case UiSubCommands.Use:
      uiUseCommand(params, options);
      break;
    case UiSubCommands.Build:
      uiBuildCommand(params[0], params[1]);
      break;
    case UiSubCommands.Dev:
      uiDevCommand();
      break;
    case UiSubCommands.Icon:
      uiIconCommand(params, options);
      break;
    default:
      errorInvalidSubCommand(subCommand, UiSubCommands);
      break;
  }
}
