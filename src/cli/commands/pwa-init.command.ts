import chalk from 'chalk';

import {INFO, OK} from '../../lib/services/message.service.js';
import {ProjectService} from '../../lib/services/project.service.js';
import {PwaService} from '../../lib/services/pwa.service.js';

const {blueBright, bold} = chalk;

export interface PwaInitCommandOptions {
  skipInstall?: boolean;
  tag?: string;
}

export class PwaInitCommand {
  constructor(
    private projectService: ProjectService,
    private pwaService: PwaService
  ) {}

  async run(commandOptions: PwaInitCommandOptions) {
    if (await this.pwaService.assetsExist()) {
      return console.log('\n' + INFO + 'PWA assets are already available!\n');
    }
    // install packages
    const version = commandOptions.tag || this.projectService.version;
    if (!commandOptions.skipInstall) {
      this.pwaService.installPackages(version);
    }
    // copy assets
    await this.pwaService.copyAssets();
    // modify files
    await this.pwaService.modifyFiles();
    // done
    console.log(
      '\n' +
        OK +
        `Add ${
          commandOptions.skipInstall ? 'PWA' : `@tinijs/pwa@${version}`
        } successfully, for more detail: ` +
        bold(blueBright('https://tinijs.dev/docs/pwa')) +
        '\n'
    );
  }
}
