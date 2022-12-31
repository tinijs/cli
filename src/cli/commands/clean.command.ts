import {resolve} from 'path';
import {gray, red, green} from 'chalk';
import {prompt} from 'inquirer';
import * as picomatch from 'picomatch';

import {FileService} from '../../lib/services/file.service';
import {BuilderService} from '../../lib/services/builder.service';

interface CleanCommandOptions {
  includes?: string;
  excludes?: string;
}

export class CleanCommand {
  constructor(
    private fileService: FileService,
    private builderService: BuilderService
  ) {}

  async run(commandOptions: CleanCommandOptions) {
    const includes = commandOptions.includes
      ? this.processInputPaths(commandOptions.includes)
      : [];
    const excludes = commandOptions.excludes
      ? this.processInputPaths(commandOptions.excludes)
      : [];
    // process files
    const removableMatch = picomatch(
      this.builderService.PROCESSABLE_PATTERN.substring(1)
    );
    const defaultFiles = [
      'public-api.d.ts',
      'public-api.js',
      'public-api.map',
    ].map(path => resolve(path));
    const projectFiles = await this.builderService.listFiles();
    const files = [...defaultFiles, ...projectFiles]
      .map(path => path.replace(/\\/g, '/'))
      .filter(path => removableMatch(path) && excludes.indexOf(path) === -1)
      .concat(...includes);
    // show file list
    console.log('\n(IMPORTANT) The list of files to be removed:');
    if (!files.length) {
      console.log('[0] No file available.');
    } else {
      files
        .map(path => path.replace(resolve('.'), '').substring(1))
        .sort()
        .forEach((item, i) => console.log(`[${i + 1}] ` + red(item)));
    }
    // question
    const yes = await (async () => {
      const answer = await prompt([
        {
          type: 'input',
          name: 'ok',
          message:
            'Remove files (please REVIEW the list above and git COMMIT first). ' +
            gray('[y/N]'),
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
    console.log(green(`\n===> ${message} <===\n`));
  }

  private processInputPaths(input: string) {
    return input
      .split('|')
      .map(path =>
        path.trim().replace('./', '').replace('.\\', '').replace(/\\/g, '/')
      );
  }
}