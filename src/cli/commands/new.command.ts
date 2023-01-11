import {execSync} from 'child_process';
import {resolve} from 'path';
import * as chalk from 'chalk';

import {FileService} from '../../lib/services/file.service';
import {DownloadService} from '../../lib/services/download.service';
import {ProjectService} from '../../lib/services/project.service';

interface CommandOptions {
  latest?: boolean;
  skipGit?: boolean;
  skipInstall?: boolean;
}

export class NewCommand {
  constructor(
    private fileService: FileService,
    private downloadService: DownloadService,
    private projectService: ProjectService
  ) {}

  async run(projectName: string, commandOptions: CommandOptions) {
    const version = this.projectService.version;
    const tag = commandOptions.latest ? 'latest' : version;
    const resourceUrl = `https://github.com/tinijs/skeleton/archive/refs/tags/${tag}.zip`;
    const validProjectName = projectName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, ' ')
      .replace(/ /g, '-');
    const projectPath = resolve(validProjectName);
    // exist
    if (await this.fileService.exists(projectPath)) {
      return console.log(
        `A project with the name "${chalk.green(
          validProjectName
        )}" is already exist!`
      );
    }
    // create
    await this.create(resourceUrl, projectPath);
    // listing
    const files = await this.fileService.listDir(projectPath);
    console.log('Create a new TiniJS project:', chalk.green(validProjectName));
    console.log('From: ' + chalk.gray(resourceUrl));
    files.forEach(file =>
      console.log(
        file.replace(projectPath, '').replace(/\\/g, '/').substring(1)
      )
    );
    // install dependencies
    if (!commandOptions.skipInstall) {
      execSync('npm install --loglevel error', {
        stdio: 'inherit',
        cwd: projectPath,
      });
    }
    // init git
    if (!commandOptions.skipGit) {
      console.log('');
      execSync('git init', {stdio: 'inherit', cwd: projectPath});
    }
    // instruction
    console.log(`
${chalk.gray('TiniJS ' + version)}
✨ Thank you for using TiniJS! ✨

What's next?
› ${chalk.cyan('cd ' + validProjectName)}
› Start development: ${chalk.cyan('npm run dev')}
› Build production: ${chalk.cyan('npm run build')}
› For more, please visit: ${chalk.cyan('https://tinijs.dev')}
    `);
  }

  async create(resourceUrl: string, projectPath: string) {
    await this.downloadService.downloadAndUnzip(
      resourceUrl,
      projectPath + '/download.zip'
    );
  }
}
