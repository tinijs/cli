import chalk from 'chalk';

import {INFO, OK} from '../../lib/services/message.service';
import {PwaService} from '../../lib/services/pwa.service';

export class PwaInitCommand {
  constructor(private pwaService: PwaService) {}

  async run() {
    if (await this.pwaService.assetsExist()) {
      return console.log(INFO + 'PWA assets are already available!');
    }
    // install packages
    this.pwaService.installPackages();
    // copy assets
    await this.pwaService.copyAssets();
    // modify files
    await this.pwaService.modifyFiles();
    // done
    console.log(
      OK +
        'Adding PWA successfully, for more detail: ' +
        chalk.blue('https://tinijs.dev/docs/pwa')
    );
  }
}
