import {INVALID_SUB_COMMAND} from '../../lib/services/message.service.js';
import {UiUseCommand, UiUseCommandOptions} from './ui-use.command.js';
import {UiBuildCommand} from './ui-build.command.js';
import {UiDevCommand} from './ui-dev.command.js';
import {UiIconCommand, UIIconCommandOptions} from './ui-icon.command.js';

interface CommandOptions extends UiUseCommandOptions, UIIconCommandOptions {}

enum SubCommands {
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
    private uiIconCommand: UiIconCommand
  ) {}

  run(subCommand: string, params: string[], options: CommandOptions) {
    switch (subCommand) {
      case SubCommands.Use:
        this.uiUseCommand.run(params, options);
        break;
      case SubCommands.Build:
        this.uiBuildCommand.run(params[0], params[1]);
        break;
      case SubCommands.Dev:
        this.uiDevCommand.run();
        break;
      case SubCommands.Icon:
        this.uiIconCommand.run(params, options);
        break;
      default:
        console.log(INVALID_SUB_COMMAND(subCommand, SubCommands));
        break;
    }
  }
}
