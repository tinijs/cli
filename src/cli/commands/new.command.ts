import {execSync} from 'child_process';
import {resolve} from 'path';
import {green, gray} from 'chalk';

import {OK} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {DownloadService} from '../../lib/services/download.service';
import {ProjectService} from '../../lib/services/project.service';

interface NewCommandOptions {
  skipGit?: boolean;
  skipInstall?: boolean;
}

export class NewCommand {
  constructor(
    private fileService: FileService,
    private downloadService: DownloadService,
    private projectService: ProjectService
  ) {}

  async run(projectName: string, commandOptions: NewCommandOptions) {
    const version = this.projectService.version;
    const resourceUrl = `https://github.com/tinijs/skeleton/archive/refs/tags/${version}.zip`;
    const validProjectName = projectName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, ' ')
      .replace(/ /g, '-');
    const projectPath = resolve(validProjectName);
    // create
    await this.create(resourceUrl, projectPath);
    // listing
    const files = await this.fileService.listDir(projectPath);
    console.log(OK + 'Create a new TiniJS project:', green(validProjectName));
    console.log('From: ' + gray(resourceUrl));
    files.forEach(file =>
      console.log(
        file.replace(projectPath, '').replace(/\\/g, '/').substring(1)
      )
    );
    // install dependencies
    if (!commandOptions.skipInstall) {
      execSync('npm install', {stdio: 'inherit', cwd: projectPath});
    }
    // init git
    if (!commandOptions.skipGit) {
      execSync('git init', {stdio: 'inherit', cwd: projectPath});
    }
  }

  async create(resourceUrl: string, projectPath: string) {
    await this.downloadService.downloadAndUnzip(
      resourceUrl,
      projectPath + '/download.zip'
    );
  }
}
