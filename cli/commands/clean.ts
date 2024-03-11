import {resolve} from 'pathe';
import {red, gray, green} from 'colorette';
import {consola} from 'consola';
import picomatch from 'picomatch';
import {existsSync} from 'node:fs';

import {errorUncleanGit} from '../utils/message.js';
import {listDir, removeFiles} from '../utils/file.js';
import {isGitClean} from '../utils/git.js';
import {defineTiniCommand} from '../utils/cli.js';

function processInputPaths(input: string) {
  return input
    .split('|')
    .map(path =>
      path.trim().replace('./', '').replace('.\\', '').replace(/\\/g, '/')
    );
}

export const cleanCommand = defineTiniCommand(
  {
    meta: {
      name: 'clean',
      description: 'Clean Typescript output files.',
    },
    args: {
      includes: {
        alias: 'i',
        type: 'string',
        description: 'Including files, separated by "|".',
      },
      excludes: {
        alias: 'e',
        type: 'string',
        description: 'Excluding files, separated by "|".',
      },
    },
  },
  async (args, callbacks) => {
    if (!isGitClean()) return errorUncleanGit();
    const includes = args.includes ? processInputPaths(args.includes) : [];
    const excludes = args.excludes ? processInputPaths(args.excludes) : [];
    // process files
    const removableMatch = picomatch('!**/*.@(d.ts|js|map)'.substring(1));
    const defaultFiles = [
      'public-api.d.ts',
      'public-api.js',
      'public-api.map',
    ].map(path => resolve(path));
    const projectFiles = await listDir(resolve('.'), [
      'node_modules', // modules
      '.*', // dot files
      '.*/**', // dot folders
      'dist',
      'build',
      'public-api.*',
      // defaults
      'package.json',
      'package-lock.json',
      'LICENSE',
      'README.md',
      'tsconfig.json',
    ]);
    const files = [...defaultFiles, ...projectFiles]
      .map(path => path.replace(/\\/g, '/'))
      .filter(path => removableMatch(path) && excludes.indexOf(path) === -1)
      .concat(...includes);
    // show file list & confirm
    callbacks?.onFileList(files);
    let fileNumber = 0;
    if (await callbacks?.onConfirm()) {
      for (let i = 0; i < files.length; i++) {
        const path = resolve(files[i]);
        if (existsSync(path)) {
          await removeFiles([path]);
          fileNumber++;
        }
      }
    }
    // done
    callbacks?.onEnd(fileNumber);
  },
  {
    onFileList: (files: string[]) => {
      consola.log('(IMPORTANT) The list of files to be removed:');
      if (!files.length) {
        consola.log(gray('[0] No file available.'));
      } else {
        files
          .map(path => path.replace(resolve('.'), '').substring(1))
          .sort()
          .forEach((item, i) => consola.log(`[${i + 1}] ` + red(item)));
      }
    },
    onConfirm: async () =>
      consola.prompt('Remove files (please REVIEW the list above)?', {
        type: 'confirm',
        default: false,
      }),
    onEnd: (count: number) => {
      const message = !count ? 'No file removed.' : `Removed ${count} files.`;
      consola.log(green(`\n===> ${message} <===\n`));
    },
  }
);

export default cleanCommand;
