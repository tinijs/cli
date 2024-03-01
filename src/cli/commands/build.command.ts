import {remove} from 'fs-extra';
import {resolve} from 'path';

import {FileService} from '../../lib/services/file.service';
import {TerminalService} from '../../lib/services/terminal.service';
import {ProjectService} from '../../lib/services/project.service';
import {BuildService} from '../../lib/services/build.service';

interface CommandOptions {
  target?: string;
}

export class BuildCommand {
  constructor(
    private fileService: FileService,
    private terminalService: TerminalService,
    private projectService: ProjectService,
    private buildService: BuildService
  ) {}

  async run(commandOptions: CommandOptions) {
    const tiniConfig = await this.projectService.getOptions();
    const {srcDir, outDir, stagingDir} = tiniConfig;
    process.env.TARGET_ENV = commandOptions.target || 'production';
    const stagingPath = this.buildService.resolveStagingPath(
      srcDir,
      stagingDir
    );
    // clean target dir
    await remove(resolve(outDir));
    // build staging
    await this.buildService.buildStaging();
    // build target
    this.terminalService.exec(
      `npx cross-env NODE_ENV=${process.env.TARGET_ENV} parcel build "${stagingPath}/index.html" --dist-dir ${outDir} --no-cache`,
      '.',
      'inherit'
    );
    // copy public dir
    await this.buildService.copyPublic(srcDir, outDir);
    // build pwa
    if (await this.projectService.isPWAEnabled(tiniConfig)) {
      await this.buildService.buildPWA(tiniConfig);
    }
  }
}
