import {readdir} from 'fs-extra';
import {resolve} from 'path';

import {OK} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
import {UiService, SoulAndSkins} from '../../lib/services/ui.service';

export class UiDevCommand {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private uiService: UiService
  ) {}

  async run() {
    const {stagingPrefix} = await this.projectService.getOptions();
    const souls = (await readdir(resolve(this.uiService.STYLES_DIR))).filter(
      item => !~item.indexOf('.')
    );
    const destPath = resolve(`${stagingPrefix}-ui`);
    // clean dir
    await this.fileService.cleanDir(destPath);
    // copy global files
    await this.uiService.devAndUseCopyGlobalFiles(destPath, true);
    // build skins
    await this.uiService.devAndUseBuildSkins(
      destPath,
      await this.readSoulAndSkinsList(souls),
      true
    );
    // build bases
    const basesPublicPath = await this.uiService.devAndUseBuildBases(
      `${this.uiService.STYLES_DIR}/${souls[0]}/base`,
      destPath,
      souls,
      true
    );
    // build components, blocks
    await this.uiService.devAndUseBuildComponents(
      this.uiService.COMPONENTS_DIR,
      destPath,
      souls,
      true
    );
    await this.uiService.devAndUseBuildComponents(
      this.uiService.BLOCKS_DIR,
      destPath,
      souls,
      true
    );
    await this.uiService.devAndUseBuildComponents(
      `custom-${this.uiService.COMPONENTS_DIR}`,
      destPath,
      souls,
      true
    );
    await this.uiService.devAndUseBuildComponents(
      `custom-${this.uiService.BLOCKS_DIR}`,
      destPath,
      souls,
      true
    );
    // package.json
    await this.fileService.createJson(resolve(destPath, 'package.json'), {
      name: '@tinijs/ui',
      version: '0.0.0'
    });
    // result
    console.log('\n' + OK + 'Build ui package for developing.\n');
  }

  private async readSoulAndSkinsList(souls: string[]) {
    const result: SoulAndSkins[] = [];
    for (let i = 0; i < souls.length; i++) {
      const soul = souls[i];
      const skins = (
        await readdir(resolve(this.uiService.STYLES_DIR, soul, 'skins'))
      )
        .filter(item => item.endsWith('.css'))
        .map(item => item.replace('.css', ''));
      result.push({soul, skins});
    }
    return result;
  }
}
