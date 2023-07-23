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
    const srcPath = resolve(srcDir);
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
      // clean staging dir
      await this.fileService.cleanDir(stagingPath);
      // build all
      const paths = await this.fileService.listDir(srcPath);
      for (let i = 0; i < paths.length; i++) {
        await this.buildService.buildFile(paths[i], stagingPath, srcDir);
      }
      // start dev server
      concurrently(
        [
          {
            command: `parcel "${stagingPath}/index.html" --dist-dir ${outDir} --port 3000 --no-cache --log-level error`,
          },
          {command: 'tini dev --watch'},
        ],
        {
          prefix: 'none',
          killOthers: ['failure', 'success'],
          restartTries: 3,
        }
      );
      // running
      console.log(bold(blueBright('Server running at http://localhost:3000')));
    }
  }
}
