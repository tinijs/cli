import concurrently from 'concurrently';
import {watch} from 'chokidar';
import {resolve} from 'path';
import {bold, blueBright} from 'chalk';

import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
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
    const {srcDir, outDir, stagingPrefix} =
      await this.projectService.getOptions();
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
            command: `npx parcel "${stagingPath}/index.html" --dist-dir ${outDir} --port 3000 --no-cache --log-level none`,
          },
          {command: 'npx tini dev --watch'},
        ],
        {
          prefix: 'none',
          killOthers: ['failure', 'success'],
          restartTries: 3,
        }
      );
      // copy public dir
      this.copyPublic(srcDir, outDir);
      // running
      console.log(
        '\n' + bold(blueBright('Server running at http://localhost:3000'))
      );
    }
  }

  private copyPublic(srcDir: string, outDir: string) {
    setTimeout(async () => {
      if (await this.fileService.exists(resolve(outDir))) {
        await this.buildService.copyPublic(srcDir, outDir);
      } else {
        this.copyPublic(srcDir, outDir);
      }
    }, 2000);
  }
}
