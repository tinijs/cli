import {MessageService} from '../../lib/services/message.service.js';
import {UiUseCommand, UiUseCommandOptions} from './ui-use.command.js';
import {UiBuildCommand} from './ui-build.command.js';
import {UiDevCommand} from './ui-dev.command.js';
import {UiIconCommand, UIIconCommandOptions} from './ui-icon.command.js';

interface UiCommandOptions extends UiUseCommandOptions, UIIconCommandOptions {}

enum UiSubCommands {
  Use = 'use',
  Build = 'build',
  Dev = 'dev',
  Icon = 'icon',
}

export class UiCommand {
  constructor(
    private uiUseCommand: UiUseCommand,
    private uiBuildCommand: UiBuildCommand,
    private uiDevCommand: UiDevCommand,
    private uiIconCommand: UiIconCommand,
    private messageService: MessageService
  ) {}

  run(subCommand: string, params: string[], options: UiCommandOptions) {
    switch (subCommand) {
      case UiSubCommands.Use:
        this.uiUseCommand.run(params, options);
        break;
      case UiSubCommands.Build:
        this.uiBuildCommand.run(params[0], params[1]);
        break;
      case UiSubCommands.Dev:
        this.uiDevCommand.run();
        break;
      case UiSubCommands.Icon:
        this.uiIconCommand.run(params, options);
        break;
      default:
        this.messageService.errorInvalidSubCommand(subCommand, UiSubCommands);
        break;
    }
  }
}
