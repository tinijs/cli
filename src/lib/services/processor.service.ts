import {resolve} from 'path';
import {watch} from 'chokidar';
import {green} from 'chalk';

import {FileService} from './file.service';
import {ProjectService, ProjectOptions} from './project.service';

export class ProcessorService {
  private stageDir = resolve('.tinijs');

  constructor(
    private fileService: FileService,
    private projectService: ProjectService
  ) {}

  async resetOut() {
    const {out} = await this.projectService.getOptions();
    return this.fileService.removeFiles([resolve(out)]);
  }

  async resetStage() {
    await this.fileService.removeFiles([this.stageDir]);
    return this.fileService.createDir(this.stageDir);
  }

  async watch(target: string) {
    const options = await this.projectService.getOptions();
    watch('src', {ignoreInitial: true}).on('all', (event, path) => {
      console.log('[Change] ' + green(path));
      path = resolve(path);
      this.process(path, target, options);
    });
  }

  async processAll(target: string) {
    const options = await this.projectService.getOptions();
    const files = await this.fileService.listDir(resolve(options.source));
    for (let i = 0; i < files.length; i++) {
      await this.process(files[i], target, options);
    }
  }

  async process(path: string, target: string, options?: ProjectOptions) {
    options = options || (await this.projectService.getOptions());
    const srcPath = path.replace(/\\/g, '/');
    const destPath = srcPath.replace(resolve(options.source), this.stageDir);
    if (srcPath.indexOf(`${options.source}/public`) !== -1) return;
    // create the folder
    const destSegments = destPath.split('/');
    destSegments.pop();
    await this.fileService.createDir(destSegments.join('/'));
    // process the file
    const file = srcPath.split('/').pop() || '';
    if (file === 'app.ts') {
      await this.transformApp(srcPath, destPath, target);
    } else if (/\.(page|layout|component)\.ts/.test(file)) {
      await this.transformElement(srcPath, destPath);
    } else {
      await this.copyItem(srcPath, destPath);
    }
  }

  private transformApp(srcPath: string, destPath: string, target: string) {
    // TODO: process me
    return this.copyItem(srcPath, destPath);
  }

  private transformElement(srcPath: string, destPath: string) {
    // TODO: process me
    return this.copyItem(srcPath, destPath);
  }

  private async copyItem(srcPath: string, destPath: string) {
    return this.fileService.copyFile(srcPath, destPath);
  }
}
