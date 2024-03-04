import {concurrently} from 'concurrently';
import {watch} from 'chokidar';
import {resolve} from 'pathe';
import chalk from 'chalk';

import {MessageService} from '../../lib/services/message.service.js';
import {FileService} from '../../lib/services/file.service.js';
import {
  ProjectService,
  ProjectConfig,
} from '../../lib/services/project.service.js';
import {BuildService} from '../../lib/services/build.service.js';

const {blueBright, bold} = chalk;

interface DevCommandOptions {
  watch?: boolean;
}

export class DevCommand {
  constructor(
    private messageService: MessageService,
    private fileService: FileService,
    private projectService: ProjectService,
    private buildService: BuildService
  ) {}

  async run(commandOptions: DevCommandOptions) {
    const projectConfig = await this.projectService.loadProjectConfig();
    const {srcDir, outDir, stagingDir} = projectConfig;
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
      this.buildOthers(projectConfig);
      // running
      setTimeout(
        () =>
          this.messageService.log(
            bold(blueBright('Server running at http://localhost:3000'))
          ),
        2000
      );
    }
  }

  private buildOthers(projectConfig: ProjectConfig) {
    setTimeout(async () => {
      const {srcDir, outDir} = projectConfig;
      if (await this.fileService.exists(resolve(outDir))) {
        // copy public dir
        await this.buildService.copyPublic(srcDir, outDir);
      } else {
        this.buildOthers(projectConfig);
      }
    }, 2000);
  }
}
