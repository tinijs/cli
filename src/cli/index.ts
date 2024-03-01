import chalk from 'chalk';
import {Command} from 'commander';

import {Lib as TiniModule} from '../lib/index.js';
import {DocsCommand} from './commands/docs.command.js';
import {NewCommand} from './commands/new.command.js';
import {GenerateCommand} from './commands/generate.command.js';
import {BuildCommand} from './commands/build.command.js';
import {PreviewCommand} from './commands/preview.command.js';
import {TestCommand} from './commands/test.command.js';
import {DevCommand} from './commands/dev.command.js';
import {CleanCommand} from './commands/clean.command.js';
import {PwaCommand} from './commands/pwa.command.js';
import {PwaInitCommand} from './commands/pwa-init.command.js';
import {UiCommand} from './commands/ui.command.js';
import {UiUseCommand} from './commands/ui-use.command.js';
import {UiBuildCommand} from './commands/ui-build.command.js';
import {UiDevCommand} from './commands/ui-dev.command.js';
import {UiIconCommand} from './commands/ui-icon.command.js';
import {ServerCommand} from './commands/server.command.js';
import {ServerAddCommand} from './commands/server-add.command.js';
import {ServerBuildCommand} from './commands/server-build.command.js';

const {red} = chalk;

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
  pwaCommand: PwaCommand;
  pwaInitCommand: PwaInitCommand;
  uiCommand: UiCommand;
  uiUseCommand: UiUseCommand;
  uiBuildCommand: UiBuildCommand;
  uiDevCommand: UiDevCommand;
  uiIconCommand: UiIconCommand;
  serverCommand: ServerCommand;
  serverAddCommand: ServerAddCommand;
  serverBuildCommand: ServerBuildCommand;

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
    ['-u, --skip-ui', 'Do not run tini ui use.'],
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
    ['-p, --port [value]', 'Custom port.'],
    ['-h, --host [value]', 'Custom host.'],
    ['-i, --i18n', 'Enable superstatic i18n.'],
  ];

  testCommandDef: CommandDef = ['test', 'Unit test the app.'];

  cleanCommandDef: CommandDef = [
    ['clean', 'c'],
    'Clean Typescript output files.',
    ['-i, --includes [value]', 'Including files, separated by |.'],
    ['-e, --excludes [value]', 'Excluding files, separated by |.'],
  ];

  pwaCommandDef: CommandDef = [
    'pwa <subCommand>',
    'Working with PWA apps.',
    ['-i, --skip-install', 'Do not install @tinijs/pwa (install manually).'],
    ['-t, --tag [value]', 'Use the custom version of @tinijs/pwa.'],
  ];

  pwaInitCommandDef: CommandDef = ['pwa-init', 'Turn a TiniJS app into a PWA.'];

  uiCommandDef: CommandDef = [
    'ui <subCommand> [params...]',
    'Tools for developing and using Tini UI.',
    ['-b, --build-only', 'Build mode only of the use command.'],
    ['-i, --skip-help', 'Skip instruction of the use command.'],
    ['-h, --hook [path]', 'Path to a hook file.'],
    ['-o, --output [path]', 'Custom output folder.'],
    ['-r, --react', 'Build for React.'],
  ];

  /**
   * @param inputs - List of soul and skins: soul/skin soul/skin-1,skin-2
   */
  uiUseCommandDef: CommandDef = [
    'ui-use <inputs...>',
    'Use souls and skins in a project.',
  ];

  /**
   * @param packageName - The package name.
   * @param soulName? - The soul name.
   */
  uiBuildCommandDef: CommandDef = [
    'ui-build <packageName> [soulName]',
    'Build UI systems.',
  ];

  uiDevCommandDef: CommandDef = ['ui-dev', 'Build the ui-dev package.'];

  /**
   * @param sources - The list of paths to icon files.
   */
  uiIconCommandDef: CommandDef = [
    'ui-icon <sources...>',
    'Build an icons pack.',
  ];

  serverCommandDef: CommandDef = [
    'server <subCommand> [params...]',
    'Manage backend solutions.',
    ['-i, --skip-install', 'Do not install the package (install manually).'],
    ['-t, --tag [value]', 'Use the custom version of the package.'],
  ];

  /**
   * @param packageName - The server package name.
   */
  serverAddCommandDef: CommandDef = [
    'server-add <packageName>',
    'Add a backend solution.',
  ];

  /**
   * @param solutionName - The name of the solution.
   */
  serverBuildCommandDef: CommandDef = [
    'server-build <solutionName>',
    'Build the backend.',
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
      this.tiniModule.fileService,
      this.tiniModule.projectService,
      this.tiniModule.buildService
    );
    this.buildCommand = new BuildCommand(
      this.tiniModule.fileService,
      this.tiniModule.terminalService,
      this.tiniModule.projectService,
      this.tiniModule.buildService
    );
    this.previewCommand = new PreviewCommand(this.tiniModule.projectService);
    this.testCommand = new TestCommand(this.tiniModule.terminalService);
    this.cleanCommand = new CleanCommand(this.tiniModule.fileService);
    this.pwaInitCommand = new PwaInitCommand(
      this.tiniModule.projectService,
      this.tiniModule.pwaService
    );
    this.pwaCommand = new PwaCommand(this.pwaInitCommand);
    this.uiUseCommand = new UiUseCommand(
      this.tiniModule.terminalService,
      this.tiniModule.projectService,
      this.tiniModule.uiService
    );
    this.uiBuildCommand = new UiBuildCommand(
      this.tiniModule.fileService,
      this.tiniModule.projectService,
      this.tiniModule.typescriptService,
      this.tiniModule.buildService,
      this.tiniModule.uiService
    );
    this.uiDevCommand = new UiDevCommand(
      this.tiniModule.fileService,
      this.tiniModule.projectService,
      this.tiniModule.uiService
    );
    this.uiIconCommand = new UiIconCommand(
      this.tiniModule.fileService,
      this.tiniModule.projectService,
      this.tiniModule.typescriptService,
      this.tiniModule.uiService
    );
    this.uiCommand = new UiCommand(
      this.uiUseCommand,
      this.uiBuildCommand,
      this.uiDevCommand,
      this.uiIconCommand
    );
    this.serverAddCommand = new ServerAddCommand(this.tiniModule.serverService);
    this.serverBuildCommand = new ServerBuildCommand(
      this.tiniModule.fileService,
      this.tiniModule.terminalService,
      this.tiniModule.projectService
    );
    this.serverCommand = new ServerCommand(
      this.serverAddCommand,
      this.serverBuildCommand
    );
  }

  getApp() {
    const commander = new Command();

    // general
    const [command, description] = this.commander;
    commander
      .version(this.tiniModule.projectService.version, '-v, --version')
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
        skipUiOpt,
        skipGitOpt,
      ] = this.newCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .option(...latestOpt)
        .option(...tagOpt)
        .option(...skipInstallOpt)
        .option(...skipUiOpt)
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
    const pwa = (() => {
      const [command, description, skipInstallOpt, tagOpt] = this.pwaCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...skipInstallOpt)
        .option(...tagOpt)
        .action((subCommand, options) =>
          this.pwaCommand.run(subCommand, options)
        );
      return {skipInstallOpt, tagOpt};
    })();

    // pwa-init
    (() => {
      const [command, description] = this.pwaInitCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...pwa.skipInstallOpt)
        .option(...pwa.tagOpt)
        .action(options => this.pwaInitCommand.run(options));
    })();

    // ui
    const ui = (() => {
      const [
        command,
        description,
        buildOnlyOpt,
        skipHelpOpt,
        hookOpt,
        outputOpt,
        reactOpt,
      ] = this.uiCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...buildOnlyOpt)
        .option(...skipHelpOpt)
        .option(...hookOpt)
        .option(...outputOpt)
        .option(...reactOpt)
        .action((subCommand, params, options) =>
          this.uiCommand.run(subCommand, params, options)
        );
      return {buildOnlyOpt, skipHelpOpt, hookOpt, outputOpt, reactOpt};
    })();

    // ui-use
    (() => {
      const [command, description] = this.uiUseCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...ui.buildOnlyOpt)
        .option(...ui.skipHelpOpt)
        .action((inputs, options) => this.uiUseCommand.run(inputs, options));
    })();

    // ui-build
    (() => {
      const [command, description] = this.uiBuildCommandDef;
      commander
        .command(command as string)
        .description(description)
        .action((packageName, soulName) =>
          this.uiBuildCommand.run(packageName, soulName)
        );
    })();

    // ui-dev
    (() => {
      const [command, description] = this.uiDevCommandDef;
      commander
        .command(command as string)
        .description(description)
        .action(() => this.uiDevCommand.run());
    })();

    // ui-icon
    (() => {
      const [command, description] = this.uiIconCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...ui.hookOpt)
        .option(...ui.outputOpt)
        .option(...ui.reactOpt)
        .action((src, options) => this.uiIconCommand.run(src, options));
    })();

    // server
    const server = (() => {
      const [command, description, skipInstallOpt, tagOpt] =
        this.serverCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...skipInstallOpt)
        .option(...tagOpt)
        .action((subCommand, params, options) =>
          this.serverCommand.run(subCommand, params, options)
        );
      return {skipInstallOpt, tagOpt};
    })();

    // server-add
    (() => {
      const [command, description] = this.serverAddCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...server.skipInstallOpt)
        .option(...server.tagOpt)
        .action((packageName, options) =>
          this.serverAddCommand.run(packageName, options)
        );
    })();

    // server-build
    (() => {
      const [command, description] = this.serverBuildCommandDef;
      commander
        .command(command as string)
        .description(description)
        .action(solutionName => this.serverBuildCommand.run(solutionName));
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
      .action((options, cmd) =>
        console.error(red(`Unknown command '${cmd.args[0]}'`))
      );

    return commander;
  }
}

type CommandDef = [string | string[], string, ...Array<[string, string]>];
