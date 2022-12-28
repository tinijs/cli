import {red} from 'chalk';
import {Command} from 'commander';
import {Lib as TiniModule} from '../lib/index';

export class Cli {
  private tiniModule: TiniModule;

  commander = ['tini', 'The CLI for the TiniJS framework.'];

  constructor() {
    this.tiniModule = new TiniModule();
  }

  getApp() {
    const commander = new Command();

    // general
    const [command, description] = this.commander;
    commander
      .version(require('../../package.json').version, '-v, --version')
      .name(`${command}`)
      .usage('[options] [command]')
      .description(description);

    // help
    commander
      .command('help')
      .description('Display help.')
      .action(() => commander.outputHelp());

    // *
    commander
      .command('*')
      .description('Any other command is not supported.')
      .action(cmd => console.error(red(`Unknown command '${cmd.args[0]}'`)));

    return commander;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CommandDef = [string | string[], string, ...Array<[string, string]>];
