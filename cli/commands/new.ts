import {execSync} from 'child_process';
import {resolve} from 'pathe';
import chalk from 'chalk';
import fsExtra from 'fs-extra';

import {info, error} from '../helpers/message.js';
import {downloadAndUnzip} from '../helpers/download.js';
import {CLI_PACKAGE_JSON} from '../helpers/project.js';

const {gray, green, cyan} = chalk;
const {exists} = fsExtra;

interface NewCommandOptions {
  latest?: boolean;
  source?: string;
  tag?: string;
  skipUi?: boolean;
  skipGit?: boolean;
}

export default async function (
  projectName: string,
  commandOptions: NewCommandOptions
) {
  const {version: tiniVersion} = CLI_PACKAGE_JSON;
  const source = commandOptions.source || 'tinijs/skeleton';
  const tag = commandOptions.latest
    ? 'latest'
    : commandOptions.tag || `v${tiniVersion}`;
  const resourceUrl = `https://github.com/${source}/archive/refs/tags/${tag}.zip`;
  const validProjectName = projectName
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-]/g, ' ')
    .replace(/ /g, '-');
  const projectPath = resolve(validProjectName);
  // exist
  if (await exists(projectPath)) {
    return error(
      `A project with the name "${green(validProjectName)}" is already exist!`
    );
  }
  // create
  await downloadAndUnzip(resourceUrl, projectPath + '/download.zip');
  // info
  info(`\nCreate a new TiniJS project: ${green(validProjectName)}`, true);
  info(`From: ${gray(resourceUrl)}\n`, true);
  // install dependencies
  execSync('npm i --loglevel=error', {
    stdio: 'inherit',
    cwd: projectPath,
  });
  // tini ui use
  if (!commandOptions.skipUi) {
    execSync('tini ui use --build-only --skip-help', {
      stdio: 'inherit',
      cwd: projectPath,
    });
  }
  // init git
  if (!commandOptions.skipGit) {
    execSync('git init', {stdio: 'inherit', cwd: projectPath});
  }
  // instruction
  console.log(`
${gray('TiniJS ' + tiniVersion)}
✨ Thank you for using TiniJS! ✨

What's next?
› ${cyan('cd ' + validProjectName)}
› Start development: ${cyan('npm run dev')}
› Build production: ${cyan('npm run build')}
› Preview production: ${cyan('npm run preview')}
› For more, please visit: ${cyan('https://tinijs.dev')}
  `);
}
