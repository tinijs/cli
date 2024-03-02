import {concurrently} from 'concurrently';
import {watch} from 'chokidar';
import {resolve} from 'pathe';
import chalk from 'chalk';

import {FileService} from '../../lib/services/file.service.js';
import {
  ProjectService,
  ProjectOptions,
} from '../../lib/services/project.service.js';
import {BuildService} from '../../lib/services/build.service.js';

const {blueBright, bold} = chalk;

interface CommandOptions {
  watch?: boolean;
}

export class DevCommand {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private buildService: BuildService
  ) {}

  async run(commandOptions: CommandOptions) {
    const tiniConfig = await this.projectService.getOptions();
    const {srcDir, outDir, stagingDir} = tiniConfig;
    const stagingPath = this.buildService.getAppStagingDirPath(stagingDir);
    // watch mode
    if (commandOptions.watch) {
      watch(srcDir, {ignoreInitial: true})
        .on('add', path =>
          this.buildService.buildFile(path, stagingPath, srcDir)
        )
        .on('change', path =>
          this.buildService.buildFile(path, stagingPath, srcDir)
        )
        .on('unlink', path =>
          this.buildService.removeFile(path, stagingPath, srcDir)
        );
    } else {
      // build staging
      await this.buildService.buildStaging();
      // start dev server
      concurrently([
        {
          command: `parcel "${stagingPath}/index.html" --dist-dir ${outDir} --port 3000 --no-cache --log-level none`,
        },
        {command: 'tini dev --watch'},
      ]);
      // other assets
      this.buildOthers(tiniConfig);
      // running
      setTimeout(
        () =>
          console.log(
            '\n' + bold(blueBright('Server running at http://localhost:3000'))
          ),
        2000
      );
    }
  }

  private buildOthers(tiniConfig: ProjectOptions) {
    setTimeout(async () => {
      const {srcDir, outDir} = tiniConfig;
      if (await this.fileService.exists(resolve(outDir))) {
        // copy public dir
        await this.buildService.copyPublic(srcDir, outDir);
      } else {
        this.buildOthers(tiniConfig);
      }
    }, 2000);
  }
}
