import {Lib as TiniModule} from '../../lib/index.js';
import {MessageService} from '../../lib/services/message.service.js';
import {ModuleService} from '../../lib/services/module.service.js';

interface ExecCommandOptions {
  dir?: string;
}

export class ExecCommand {
  constructor(
    private tiniModule: TiniModule,
    private messageService: MessageService,
    private moduleService: ModuleService
  ) {}

  async run(
    packageName: string,
    moduleCommand: string,
    commandOptions: ExecCommandOptions,
    commander: any
  ) {
    const moduleCommandOptions = this.parseModuleCommandOptions(commander.args);
    const moduleConfig = await this.moduleService.loadModuleConfig(
      packageName,
      commandOptions.dir
    );
    if (!moduleConfig.exec)
      return this.messageService.error(
        `Module "${packageName}" does not support the exec command.`
      );
    await moduleConfig.exec(
      moduleCommand,
      moduleCommandOptions,
      this.tiniModule
    );
  }

  private parseModuleCommandOptions(args: string[]) {
    const options: Record<string, string | true> = {};
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const potentialValue = args[i + 1];
        const isBooleanValue =
          !potentialValue || potentialValue.startsWith('--');
        options[key] = isBooleanValue ? true : potentialValue;
      }
    }
    return options;
  }
}
