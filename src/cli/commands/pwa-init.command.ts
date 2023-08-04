import {bold, blueBright} from 'chalk';

import {INFO, OK} from '../../lib/services/message.service';
import {ProjectService} from '../../lib/services/project.service';
import {PwaService} from '../../lib/services/pwa.service';

export interface CommandOptions {
  tag?: string;
}

export class PwaInitCommand {
  constructor(
    private projectService: ProjectService,
    private pwaService: PwaService
  ) {}

  async run(commandOptions: CommandOptions) {
    if (await this.pwaService.assetsExist()) {
      return console.log('\n' + INFO + 'PWA assets are already available!\n');
    }
    // install packages
    const version = commandOptions.tag || this.projectService.version;
    this.pwaService.installPackages(version);
    // copy assets
    await this.pwaService.copyAssets();
    // modify files
    await this.pwaService.modifyFiles();
    // done
    console.log(
      '\n' +
        OK +
        `Adding @tinijs/pwa@${version} successfully, for more detail: ` +
        bold(blueBright('https://tinijs.dev/docs/pwa')) +
        '\n'
    );
  }
}
