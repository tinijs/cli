import * as chalk from 'chalk';
import {Command} from 'commander';
import {Lib as TiniModule} from '../lib/index';
import {DocsCommand} from './commands/docs.command';
import {NewCommand} from './commands/new.command';
import {GenerateCommand} from './commands/generate.command';
import {BuildCommand} from './commands/build.command';
import {PreviewCommand} from './commands/preview.command';
import {TestCommand} from './commands/test.command';
import {DevCommand} from './commands/dev.command';
import {CleanCommand} from './commands/clean.command';
import {PwaInitCommand} from './commands/pwa-init.command';
import {PwaCommand} from './commands/pwa.command';

export class Cli {
  private tiniModule: TiniModule;
  docsCommand: DocsCommand;
  newCommand: NewCommand;
  generateCommand: GenerateCommand;
  buildCommand: BuildCommand;
  previewCommand: PreviewCommand;
  testCommand: TestCommand;
  devCommand: DevCommand;
  cleanCommand: CleanCommand;
  pwaInitCommand: PwaInitCommand;
  pwaCommand: PwaCommand;

  commander = ['tini', 'The CLI for the TiniJS framework.'];

  docsCommandDef: CommandDef = [['docs', 'home'], 'Open documentation.'];

  /**
   * @param projectName - The project name.
   */
  newCommandDef: CommandDef = [
    ['new <projectName>', 'start'],
    'Create a new project.',
    ['-l, --latest', 'Install the latest @tinijs/skeleton.'],
    ['-t, --tag [value]', 'Use the custom version of the @tinijs/skeleton.'],
    ['-i, --skip-install', 'Do not install dependency packages.'],
    ['-g, --skip-git', 'Do not initialize a git repository.'],
  ];

  /**
   * @param type - The resource type
   * @param dest - The resource destination
   */
  generateCommandDef: CommandDef = [
    ['generate <type> <dest>', 'create', 'g'],
    'Generate a resource.',
    ['-t, --type-prefixed', 'Use the format [name].[type].[ext].'],
    ['-n, --nested', 'Nested under a folder.'],
  ];

  devCommandDef: CommandDef = [['dev', 'serve'], 'Start the dev server.'];

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

  cleanCommandDef: CommandDef = [
    ['clean', 'c'],
    'Clean Typescript output files.',
    ['-i, --includes [value]', 'Including files, separated by |.'],
    ['-e, --excludes [value]', 'Excluding files, separated by |.'],
  ];

  pwaInitCommandDef: CommandDef = [
    'pwa-init',
    'Turn a TiniJS app into a PWA.',
    ['-t, --tag [value]', 'Use the custom version of @tinijs/pwa.'],
  ];

  pwaCommandDef: CommandDef = [
    'pwa <subCommand>',
    'Working with PWA apps.',
    ['-t, --tag [value]', 'Use the custom version of @tinijs/pwa.'],
  ];

  constructor() {
    this.tiniModule = new TiniModule();
    this.docsCommand = new DocsCommand();
    this.newCommand = new NewCommand(
      this.tiniModule.fileService,
      this.tiniModule.downloadService,
      this.tiniModule.projectService
    );
    this.generateCommand = new GenerateCommand(
      this.tiniModule.fileService,
      this.tiniModule.generateService
    );
    this.devCommand = new DevCommand(
      this.tiniModule.terminalService,
      this.tiniModule.projectService
    );
    this.buildCommand = new BuildCommand(
      this.tiniModule.terminalService,
      this.tiniModule.projectService
    );
    this.previewCommand = new PreviewCommand(this.tiniModule.projectService);
    this.testCommand = new TestCommand(this.tiniModule.terminalService);
    this.cleanCommand = new CleanCommand(this.tiniModule.fileService);
    this.pwaInitCommand = new PwaInitCommand(
      this.tiniModule.projectService,
      this.tiniModule.pwaService
    );
    this.pwaCommand = new PwaCommand(this.pwaInitCommand);
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
      const [
        [command, ...aliases],
        description,
        latestOpt,
        tagOpt,
        skipInstallOpt,
        skipGitOpt,
      ] = this.newCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .option(...latestOpt)
        .option(...tagOpt)
        .option(...skipInstallOpt)
        .option(...skipGitOpt)
        .description(description)
        .action((projectName, options) =>
          this.newCommand.run(projectName, options)
        );
    })();

    // generate
    (() => {
      const [[command, ...aliases], description, typePrefixedOpt, nestedOpt] =
        this.generateCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .option(...typePrefixedOpt)
        .option(...nestedOpt)
        .action((type, dest, options) =>
          this.generateCommand.run(type, dest, options)
        );
    })();

    // dev
    (() => {
      const [[command, ...aliases], description] = this.devCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .action(() => this.devCommand.run());
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

    // clean
    (() => {
      const [[command, ...aliases], description, includesOpt, excludesOpt] =
        this.cleanCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .option(...includesOpt)
        .option(...excludesOpt)
        .action(options => this.cleanCommand.run(options));
    })();

    // pwa
    (() => {
      const [command, description, tagOpt] = this.pwaCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...tagOpt)
        .action((subCommand, options) =>
          this.pwaCommand.run(subCommand, options)
        );
    })();

    // pwa-init
    (() => {
      const [command, description, tagOpt] = this.pwaInitCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...tagOpt)
        .action(options => this.pwaInitCommand.run(options));
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
      .action(cmd =>
        console.error(chalk.red(`Unknown command '${cmd.args[0]}'`))
      );

    return commander;
  }
}

type CommandDef = [string | string[], string, ...Array<[string, string]>];
