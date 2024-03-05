#!/usr/bin/env node
import {Command} from 'commander';

import {error} from '../lib/helpers/message.js';
import {CLI_PACKAGE_JSON} from '../lib/helpers/project.js';
import {extendTiniCLI, getExtendableCommands} from '../lib/helpers/extend.js';

import docsCommand from './commands/docs.js';
import newCommand from './commands/new.js';
import generateCommand from './commands/generate.js';
import devCommand from './commands/dev.js';
import buildCommand from './commands/build.js';
import previewCommand from './commands/preview.js';
import testCommand from './commands/test.js';
import cleanCommand from './commands/clean.js';
import moduleCommand from './commands/module.js';

const {version: tiniVersion} = CLI_PACKAGE_JSON;

(async () => {
  const commander = new Command();

  // general
  commander
    .version(tiniVersion as string, '-v, --version')
    .name('tini')
    .usage('[options] [command]')
    .description('The CLI for the TiniJS framework.');

  // docs
  commander
    .command('docs')
    .aliases(['home'])
    .description('Open documentation.')
    .action(docsCommand);

  // new
  commander
    .command('new <projectName>')
    .aliases(['start'])
    .description('Create a new project.')
    .option('-l, --latest', 'Install the latest template.')
    .option(
      '-s, --source [value]',
      'Use a custom template instead the official.'
    )
    .option('-t, --tag [value]', 'Use a custom version of the tempalte.')
    .option('-g, --skip-git', 'Do not initialize a git repository.')
    .option('-u, --skip-ui', 'Do not run: tini ui use.')
    .action(newCommand);

  // generate
  commander
    .command('generate <type> <dest>')
    .aliases(['create', 'g'])
    .description('Generate a resource.')
    .option('-t, --type-prefixed', 'Use the format [name].[type].[ext].')
    .option('-n, --nested', 'Nested under a folder.')
    .action(generateCommand);

  // dev
  commander
    .command('dev')
    .aliases(['serve'])
    .description('Start the dev server.')
    .option('-w, --watch', 'Watch mode only.')
    .action(devCommand);

  // build
  commander
    .command('build')
    .description('Build the app.')
    .option(
      '-t, --target [value]',
      'Target: production (default), qa1, any, ...'
    )
    .action(buildCommand);

  // preview
  commander
    .command('preview')
    .description('Preview the app.')
    .option('-p, --port [value]', 'Custom port.')
    .option('-h, --host [value]', 'Custom host.')
    .option('-i, --i18n', 'Enable superstatic i18n.')
    .action(previewCommand);

  // test
  commander
    .command('test')
    .description('Unit test the app.')
    .action(testCommand);

  // clean
  commander
    .command('clean')
    .aliases(['c'])
    .description('Clean Typescript output files.')
    .option('-i, --includes [value]', 'Including files, separated by |.')
    .option('-e, --excludes [value]', 'Excluding files, separated by |.')
    .action(cleanCommand);

  // module
  commander
    .command('add <packageName>')
    .aliases(['module'])
    .description('Add a module to the current project.')
    .option('-t, --tag [value]', 'Use the custom version of the package.')
    .action(moduleCommand);

  // extended commands
  await extendTiniCLI(commander);

  // help
  commander
    .command('help')
    .description('Display help.')
    .action(() => commander.outputHelp());

  // *
  commander
    .command('*')
    .description('Any other command is not supported.')
    .action(async (options, commander) => {
      const command = commander.args[0];
      const extendableCommands = await getExtendableCommands();
      if (extendableCommands[command]) {
        error(
          `The extended command "${command}" is not found at ${extendableCommands[command]}.`
        );
      } else {
        error(`Unknown command "${command}"`);
      }
    });

  // execute
  commander.parse(process.argv);
})();
