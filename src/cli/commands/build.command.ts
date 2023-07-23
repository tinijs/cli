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
    const {srcDir, outDir, stagingPrefix} =
      await this.projectService.getOptions();
    process.env.TARGET_ENV = commandOptions.target || 'production';
    const srcPath = resolve(srcDir);
    const stagingPath = this.buildService.resolveStagingPath(
      srcDir,
      stagingPrefix
    );
    // clean target dir
    await remove(resolve(outDir));
    // build staging
    await this.fileService.cleanDir(stagingPath);
    const paths = await this.fileService.listDir(srcPath);
    for (let i = 0; i < paths.length; i++) {
      await this.buildService.buildFile(paths[i], stagingPath, srcDir);
    }
    // build target
    this.terminalService.exec(
      `cross-env NODE_ENV=${process.env.TARGET_ENV} parcel build "${stagingPath}/index.html" --dist-dir ${outDir} --no-cache`,
      '.',
      'inherit'
    );
  }
}
