import {red} from 'chalk';
import {Command} from 'commander';
import {Lib as TiniModule} from '../lib/index';
import {DocsCommand} from './commands/docs.command';
import {NewCommand} from './commands/new.command';
import {BuildCommand} from './commands/build.command';
import {PreviewCommand} from './commands/preview.command';
import {TestCommand} from './commands/test.command';
import {DevCommand} from './commands/dev.command';

export class Cli {
  private tiniModule: TiniModule;
  docsCommand: DocsCommand;
  newCommand: NewCommand;
  buildCommand: BuildCommand;
  previewCommand: PreviewCommand;
  testCommand: TestCommand;
  devCommand: DevCommand;

  commander = ['tini', 'The CLI for the TiniJS framework.'];

  docsCommandDef: CommandDef = [['docs', 'home'], 'Open documentation.'];

  /**
   * @param projectName - The project name.
   */
  newCommandDef: CommandDef = [
    ['new <projectName>', 'start'],
    'Create a new project.',
    ['-i, --skip-install', 'Do not install dependency packages.'],
    ['-g, --skip-git', 'Do not initialize a git repository.'],
  ];

  devCommandDef: CommandDef = [
    ['dev', 'serve'],
    'Start the dev server.',
    ['-w, --watch', 'Watch mode only.'],
  ];

  buildCommandDef: CommandDef = [
    'build',
    'Build the app.',
    ['-t, --target [value]', 'Target: production (default), qa1, any, ...'],
  ];

  previewCommandDef: CommandDef = [
    'preview',
    'Preview the app.',
    ['-p, --port [value]', 'Custom port'],
    ['-h, --host [value]', 'Custom host'],
    ['-i, --i18n', 'Enable i18n'],
  ];

  testCommandDef: CommandDef = ['test', 'Unit test the app.'];

  constructor() {
    this.tiniModule = new TiniModule();
    this.docsCommand = new DocsCommand();
    this.newCommand = new NewCommand(
      this.tiniModule.fileService,
      this.tiniModule.downloadService
    );
    this.devCommand = new DevCommand(
      this.tiniModule.terminalService,
      this.tiniModule.processorService
    );
    this.buildCommand = new BuildCommand(
      this.tiniModule.terminalService,
      this.tiniModule.processorService
    );
    this.previewCommand = new PreviewCommand(this.tiniModule.projectService);
    this.testCommand = new TestCommand(this.tiniModule.terminalService);
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

    // docs
    (() => {
      const [[command, ...aliases], description] = this.docsCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .action(() => this.docsCommand.run());
    })();

    // new
    (() => {
      const [[command, ...aliases], description, skipInstallOpt, skipGitOpt] =
        this.newCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .option(...skipInstallOpt)
        .option(...skipGitOpt)
        .description(description)
        .action((projectName, options) =>
          this.newCommand.run(projectName, options)
        );
    })();

    // dev
    (() => {
      const [[command, ...aliases], description, watchOpt] = this.devCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .option(...watchOpt)
        .action(options => this.devCommand.run(options));
    })();

    // build
    (() => {
      const [command, description, targetOpt] = this.buildCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...targetOpt)
        .action(options => this.buildCommand.run(options));
    })();

    // preview
    (() => {
      const [command, description, portOpt, hostOpt, i18nOpt] =
        this.previewCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...portOpt)
        .option(...hostOpt)
        .option(...i18nOpt)
        .action(options => this.previewCommand.run(options));
    })();

    // test
    (() => {
      const [command, description] = this.testCommandDef;
      commander
        .command(command as string)
        .description(description)
        .action(() => this.testCommand.run());
    })();

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

type CommandDef = [string | string[], string, ...Array<[string, string]>];
