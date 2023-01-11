import {resolve} from 'path';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as picomatch from 'picomatch';

const prompt = inquirer.createPromptModule();

import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';

interface CleanCommandOptions {
  includes?: string;
  excludes?: string;
}

export class CleanCommand {
  private ignoredPaths = [
    'node_modules', // modules
    '.*', // dot files
    '.*/**', // dot folders
    'dist', // output folder
    'public', // handle by: parcel-reporter-static-files-copy
    'public-api.*', // lib api
    // defaults
    'package.json',
    'package-lock.json',
    'LICENSE',
    'README.md',
    'tsconfig.json',
  ];

  private PROCESSABLE_PATTERN =
    '!**/?(app|configs|layouts|pages|components|services|helpers|consts)/*.@(d.ts|js|map)';

  constructor(
    private fileService: FileService,
    private projectService: ProjectService
  ) {}

  async run(commandOptions: CleanCommandOptions) {
    const includes = commandOptions.includes
      ? this.processInputPaths(commandOptions.includes)
      : [];
    const excludes = commandOptions.excludes
      ? this.processInputPaths(commandOptions.excludes)
      : [];
    // process files
    const removableMatch = picomatch(this.PROCESSABLE_PATTERN.substring(1));
    const defaultFiles = [
      'public-api.d.ts',
      'public-api.js',
      'public-api.map',
    ].map(path => resolve(path));
    const projectFiles = await this.listFiles();
    const files = [...defaultFiles, ...projectFiles]
      .map(path => path.replace(/\\/g, '/'))
      .filter(path => removableMatch(path) && excludes.indexOf(path) === -1)
      .concat(...includes);
    // show file list
    console.log('(IMPORTANT) The list of files to be removed:');
    if (!files.length) {
      console.log(chalk.gray('[0] No file available.'));
    } else {
      files
        .map(path => path.replace(resolve('.'), '').substring(1))
        .sort()
        .forEach((item, i) => console.log(`[${i + 1}] ` + chalk.red(item)));
    }
    // question
    const yes = await (async () => {
      const answer = await prompt([
        {
          type: 'input',
          name: 'ok',
          message:
            'Remove files (please REVIEW the list above and git COMMIT first). ' +
            chalk.gray('[y/N]'),
          default: 'N',
        },
      ]);
      return answer.ok === 'y';
    })();
    let message = '';
    if (yes) {
      let fileNumber = 0;
      for (let i = 0; i < files.length; i++) {
        const path = resolve(files[i]);
        if (await this.fileService.exists(path)) {
          await this.fileService.removeFiles([path]);
          fileNumber++;
        }
      }
      message = `Removed ${fileNumber} files.`;
    } else {
      message = 'No file removed.';
    }
    console.log(chalk.green(`\n===> ${message} <===\n`));
  }

  private processInputPaths(input: string) {
    return input
      .split('|')
      .map(path =>
        path.trim().replace('./', '').replace('.\\', '').replace(/\\/g, '/')
      );
  }

  private async listFiles() {
    return await this.fileService.listDir(resolve('.'), this.ignoredPaths);
  }
}
