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
import {UiCommand} from './commands/ui.command.js';
import {UiUseCommand} from './commands/ui-use.command.js';
import {UiBuildCommand} from './commands/ui-build.command.js';
import {UiDevCommand} from './commands/ui-dev.command.js';
import {UiIconCommand} from './commands/ui-icon.command.js';
import {ModuleCommand} from './commands/module.command.js';
import {ExecCommand} from './commands/exec.command.js';

const {red} = chalk;

export class Cli {
  private tiniModule: TiniModule;
  readonly docsCommand: DocsCommand;
  readonly newCommand: NewCommand;
  readonly generateCommand: GenerateCommand;
  readonly buildCommand: BuildCommand;
  readonly previewCommand: PreviewCommand;
  readonly testCommand: TestCommand;
  readonly devCommand: DevCommand;
  readonly cleanCommand: CleanCommand;
  readonly uiCommand: UiCommand;
  readonly uiUseCommand: UiUseCommand;
  readonly uiBuildCommand: UiBuildCommand;
  readonly uiDevCommand: UiDevCommand;
  readonly uiIconCommand: UiIconCommand;
  readonly moduleCommand: ModuleCommand;
  readonly execCommand: ExecCommand;

  readonly commander = ['tini', 'The CLI for the TiniJS framework.'];

  readonly docsCommandDef: CommandDef = [
    ['docs', 'home'],
    'Open documentation.',
  ];

  /**
   * @param projectName - The project name.
   */
  readonly newCommandDef: CommandDef = [
    ['new <projectName>', 'start'],
    'Create a new project.',
    ['-l, --latest', 'Install the latest template.'],
    ['-s, --source [value]', 'Use a custom template instead the official.'],
    ['-t, --tag [value]', 'Use a custom version of the tempalte.'],
    ['-g, --skip-git', 'Do not initialize a git repository.'],
    ['-u, --skip-ui', 'Do not run: tini ui use.'],
  ];

  /**
   * @param type - The resource type
   * @param dest - The resource destination
   */
  readonly generateCommandDef: CommandDef = [
    ['generate <type> <dest>', 'create', 'g'],
    'Generate a resource.',
    ['-t, --type-prefixed', 'Use the format [name].[type].[ext].'],
    ['-n, --nested', 'Nested under a folder.'],
  ];

  readonly devCommandDef: CommandDef = [
    ['dev', 'serve'],
    'Start the dev server.',
    ['-w, --watch', 'Watch mode only.'],
  ];

  readonly buildCommandDef: CommandDef = [
    'build',
    'Build the app.',
    ['-t, --target [value]', 'Target: production (default), qa1, any, ...'],
  ];

  readonly previewCommandDef: CommandDef = [
    'preview',
    'Preview the app.',
    ['-p, --port [value]', 'Custom port.'],
    ['-h, --host [value]', 'Custom host.'],
    ['-i, --i18n', 'Enable superstatic i18n.'],
  ];

  readonly testCommandDef: CommandDef = ['test', 'Unit test the app.'];

  readonly cleanCommandDef: CommandDef = [
    ['clean', 'c'],
    'Clean Typescript output files.',
    ['-i, --includes [value]', 'Including files, separated by |.'],
    ['-e, --excludes [value]', 'Excluding files, separated by |.'],
  ];

  readonly uiCommandDef: CommandDef = [
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
  readonly uiUseCommandDef: CommandDef = [
    'ui-use <inputs...>',
    'Use souls and skins in a project.',
  ];

  /**
   * @param packageName - The package name.
   * @param soulName? - The soul name.
   */
  readonly uiBuildCommandDef: CommandDef = [
    'ui-build <packageName> [soulName]',
    'Build UI systems.',
  ];

  readonly uiDevCommandDef: CommandDef = [
    'ui-dev',
    'Build the ui-dev package.',
  ];

  /**
   * @param sources - The list of paths to icon files.
   */
  readonly uiIconCommandDef: CommandDef = [
    'ui-icon <sources...>',
    'Build an icons pack.',
  ];

  /**
   * @param packageName - The module package name.
   */
  readonly moduleCommandDef: CommandDef = [
    ['add <packageName>', 'module'],
    'Add a module to the current project.',
    ['-t, --tag [value]', 'Use the custom version of the package.'],
  ];

  /**
   * @param packageName - The module package name.
   * @param moduleCommand - The command of the module to be executed.
   */
  execCommandDef: CommandDef = [
    'exec <packageName> <moduleCommand>',
    'Exec a module command.',
    ['-d, --dir [value]', 'Custom root of the module.'],
  ];

  constructor() {
    this.tiniModule = new TiniModule();
    this.docsCommand = new DocsCommand(this.tiniModule.messageService);
    this.newCommand = new NewCommand(
      this.tiniModule.messageService,
      this.tiniModule.fileService,
      this.tiniModule.downloadService,
      this.tiniModule.projectService
    );
    this.generateCommand = new GenerateCommand(
      this.tiniModule.messageService,
      this.tiniModule.fileService,
      this.tiniModule.generateService
    );
    this.devCommand = new DevCommand(
      this.tiniModule.messageService,
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
    this.previewCommand = new PreviewCommand(
      this.tiniModule.messageService,
      this.tiniModule.projectService
    );
    this.testCommand = new TestCommand(this.tiniModule.terminalService);
    this.cleanCommand = new CleanCommand(this.tiniModule.fileService);
    this.uiUseCommand = new UiUseCommand(
      this.tiniModule.messageService,
      this.tiniModule.terminalService,
      this.tiniModule.projectService,
      this.tiniModule.uiService
    );
    this.uiBuildCommand = new UiBuildCommand(
      this.tiniModule.messageService,
      this.tiniModule.fileService,
      this.tiniModule.projectService,
      this.tiniModule.typescriptService,
      this.tiniModule.buildService,
      this.tiniModule.uiService
    );
    this.uiDevCommand = new UiDevCommand(
      this.tiniModule.messageService,
      this.tiniModule.fileService,
      this.tiniModule.projectService,
      this.tiniModule.uiService
    );
    this.uiIconCommand = new UiIconCommand(
      this.tiniModule.messageService,
      this.tiniModule.fileService,
      this.tiniModule.projectService,
      this.tiniModule.typescriptService,
      this.tiniModule.uiService
    );
    this.uiCommand = new UiCommand(
      this.uiUseCommand,
      this.uiBuildCommand,
      this.uiDevCommand,
      this.uiIconCommand,
      this.tiniModule.messageService
    );
    this.moduleCommand = new ModuleCommand(
      this.tiniModule.messageService,
      this.tiniModule.moduleService
    );
    this.execCommand = new ExecCommand(
      this.tiniModule,
      this.tiniModule.messageService,
      this.tiniModule.moduleService
    );
  }

  getApp() {
    const commander = new Command();
    const {version: tiniVersion} =
      this.tiniModule.projectService.cliPackageJson;

    // general
    const [command, description] = this.commander;
    commander
      .version(tiniVersion as string, '-v, --version')
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
        sourceOpt,
        tagOpt,
        skipGitOpt,
        skipUiOpt,
      ] = this.newCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .option(...latestOpt)
        .option(...sourceOpt)
        .option(...tagOpt)
        .option(...skipGitOpt)
        .option(...skipUiOpt)
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

    // module
    (() => {
      const [[command, ...aliases], description, tagOpt] =
        this.moduleCommandDef;
      commander
        .command(command)
        .aliases(aliases)
        .description(description)
        .option(...tagOpt)
        .action((packageName, options) =>
          this.moduleCommand.run(packageName, options)
        );
    })();

    // exec
    (() => {
      const [command, description, dirOpt] = this.execCommandDef;
      commander
        .command(command as string)
        .description(description)
        .option(...dirOpt)
        .action((packageName, moduleCommand, options, commander) =>
          this.execCommand.run(packageName, moduleCommand, options, commander)
        );
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
