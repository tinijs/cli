import concurrently from 'concurrently';
import {watch} from 'chokidar';
import {resolve} from 'path';
import {bold, blueBright} from 'chalk';

import {FileService} from '../../lib/services/file.service';
import {
  ProjectService,
  ProjectOptions,
} from '../../lib/services/project.service';
import {BuildService} from '../../lib/services/build.service';

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
    const {srcDir, outDir, stagingPrefix} = tiniConfig;
    const stagingPath = this.buildService.resolveStagingPath(
      srcDir,
      stagingPrefix
    );
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
      concurrently(
        [
          {
            command: `parcel "${stagingPath}/index.html" --dist-dir ${outDir} --port 3000 --no-cache --log-level none`,
          },
          {command: 'tini dev --watch'},
        ],
        {
          prefix: 'none',
          killOthers: ['failure', 'success'],
          restartTries: 3,
        }
      );
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
        // build pwa
        if (await this.projectService.isPWAEnabled(tiniConfig)) {
          await this.buildService.buildPWA(tiniConfig);
        }
      } else {
        this.buildOthers(tiniConfig);
      }
    }, 2000);
  }
}
