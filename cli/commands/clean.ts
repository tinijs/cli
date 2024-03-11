import {resolve} from 'pathe';
import chalk from 'chalk';
import picomatch from 'picomatch';
import fsExtra from 'fs-extra';
import {createPromptModule} from 'inquirer';

import {errorUncleanGit} from '../utils/message.js';
import {listDir, removeFiles} from '../utils/file.js';
import {isGitClean} from '../utils/git.js';

const {red, gray, green} = chalk;
const {exists} = fsExtra;

const prompt = createPromptModule();

interface CleanCommandOptions {
  includes?: string;
  excludes?: string;
}

const IGNORED_PATHS = [
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
];

const PROCESSABLE_PATTERN = '!**/*.@(d.ts|js|map)';

export default async function (commandOptions: CleanCommandOptions) {
  if (!isGitClean()) return errorUncleanGit();
  const includes = commandOptions.includes
    ? processInputPaths(commandOptions.includes)
    : [];
  const excludes = commandOptions.excludes
    ? processInputPaths(commandOptions.excludes)
    : [];
  // process files
  const removableMatch = picomatch(PROCESSABLE_PATTERN.substring(1));
  const defaultFiles = [
    'public-api.d.ts',
    'public-api.js',
    'public-api.map',
  ].map(path => resolve(path));
  const projectFiles = await listDir(resolve('.'), IGNORED_PATHS);
  const files = [...defaultFiles, ...projectFiles]
    .map(path => path.replace(/\\/g, '/'))
    .filter(path => removableMatch(path) && excludes.indexOf(path) === -1)
    .concat(...includes);
  // show file list
  console.log('(IMPORTANT) The list of files to be removed:');
  if (!files.length) {
    console.log(gray('[0] No file available.'));
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
      if (await exists(path)) {
        await removeFiles([path]);
        fileNumber++;
      }
    }
    message = `Removed ${fileNumber} files.`;
  } else {
    message = 'No file removed.';
  }
  console.log(green(`\n===> ${message} <===\n`));
}

function processInputPaths(input: string) {
  return input
    .split('|')
    .map(path =>
      path.trim().replace('./', '').replace('.\\', '').replace(/\\/g, '/')
    );
}