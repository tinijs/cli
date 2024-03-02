import {execSync} from 'child_process';
import {resolve} from 'pathe';
import chalk from 'chalk';

import {MessageService} from '../../lib/services/message.service.js';
import {FileService} from '../../lib/services/file.service.js';
import {DownloadService} from '../../lib/services/download.service.js';
import {ProjectService} from '../../lib/services/project.service.js';

const {gray, green, cyan} = chalk;

interface NewCommandOptions {
  latest?: boolean;
  source?: string;
  tag?: string;
  skipUi?: boolean;
  skipGit?: boolean;
}

export class NewCommand {
  constructor(
    private messageService: MessageService,
    private fileService: FileService,
    private downloadService: DownloadService,
    private projectService: ProjectService
  ) {}

  async run(projectName: string, commandOptions: NewCommandOptions) {
    const {version: tiniVersion} = this.projectService.cliPackageJson;
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
    if (await this.fileService.exists(projectPath)) {
      return this.messageService.error(
        `A project with the name "${green(validProjectName)}" is already exist!`
      );
    }
    // create
    await this.create(resourceUrl, projectPath);
    // info
    this.messageService.info(
      `\nCreate a new TiniJS project: ${green(validProjectName)}`,
      true
    );
    this.messageService.info(`From: ${gray(resourceUrl)}\n`, true);
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

  async create(resourceUrl: string, projectPath: string) {
    await this.downloadService.downloadAndUnzip(
      resourceUrl,
      projectPath + '/download.zip'
    );
  }
}
