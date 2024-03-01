import {execSync} from 'child_process';
import {resolve} from 'pathe';
import {green, cyan, gray} from 'chalk';

import {FileService} from '../../lib/services/file.service';
import {DownloadService} from '../../lib/services/download.service';
import {ProjectService} from '../../lib/services/project.service';

interface CommandOptions {
  latest?: boolean;
  tag?: string;
  skipInstall?: boolean;
  skipUi?: boolean;
  skipGit?: boolean;
}

export class NewCommand {
  constructor(
    private fileService: FileService,
    private downloadService: DownloadService,
    private projectService: ProjectService
  ) {}

  async run(projectName: string, commandOptions: CommandOptions) {
    const version = this.projectService.version;
    const tag = commandOptions.latest
      ? 'latest'
      : commandOptions.tag || `v${version}`;
    const resourceUrl = `https://github.com/tinijs/skeleton/archive/refs/tags/${tag}.zip`;
    const validProjectName = projectName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, ' ')
      .replace(/ /g, '-');
    const projectPath = resolve(validProjectName);
    // exist
    if (await this.fileService.exists(projectPath)) {
      return console.log(
        `\nA project with the name "${green(
          validProjectName
        )}" is already exist!\n`
      );
    }
    // create
    await this.create(resourceUrl, projectPath);
    // info
    console.log('Create a new TiniJS project:', green(validProjectName));
    console.log('From: ' + gray(resourceUrl));
    // install dependencies
    if (!commandOptions.skipInstall) {
      execSync('npm i --loglevel=error', {
        stdio: 'inherit',
        cwd: projectPath,
      });
    }
    // tini ui use
    if (!commandOptions.skipUi) {
      execSync('tini ui use --build-only --skip-help', {
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
${gray('TiniJS ' + version)}
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
