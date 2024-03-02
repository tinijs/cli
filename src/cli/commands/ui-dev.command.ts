import fsExtra from 'fs-extra';
import {resolve} from 'pathe';

import {MessageService} from '../../lib/services/message.service.js';
import {FileService} from '../../lib/services/file.service.js';
import {ProjectService} from '../../lib/services/project.service.js';
import {UiService, SoulAndSkins} from '../../lib/services/ui.service.js';

const {readdir} = fsExtra;

export class UiDevCommand {
  constructor(
    private messageService: MessageService,
    private fileService: FileService,
    private projectService: ProjectService,
    private uiService: UiService
  ) {}

  async run() {
    const {stagingDir} = await this.projectService.loadProjectConfig();
    const souls = (await readdir(resolve(this.uiService.STYLES_DIR))).filter(
      item => !~item.indexOf('.')
    );
    const destPath = resolve(stagingDir, 'ui');
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
    await this.uiService.devAndUseBuildBases(
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
      version: '0.0.0',
    });
    // result
    this.messageService.success('Build ui package for developing.');
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
