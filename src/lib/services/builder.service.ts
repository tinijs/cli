import {resolve} from 'path';
import {watch} from 'chokidar';
import {green} from 'chalk';
import {compileStringAsync} from 'sass';
import * as picomatch from 'picomatch';

import {FileService} from './file.service';
import {ProjectService, ProjectOptions} from './project.service';

export class BuilderService {
  private stageDir = resolve('.tinijs');

  private ignoredPaths = [
    'node_modules', // modules
    'public', // handle by: parcel-reporter-static-files-copy
    '.*', // dot files/folders
    'public-api.*', // lib api
    // defaults
    'package.json',
    'package-lock.json',
    'LICENSE',
    'README.md',
    'tsconfig.json',
  ];

  PROCESSABLE_PATTERN =
    '!**/?(app|configs|layouts|pages|components|services)/*.@(d.ts|js|map)';
  private processableMatch = picomatch(this.PROCESSABLE_PATTERN);

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

  async listFiles() {
    const options = await this.projectService.getOptions();
    return await this.fileService.listDir(
      resolve(options.source),
      this.ignoredPaths
    );
  }

  async watch(target: string) {
    const options = await this.projectService.getOptions();
    watch(options.source, {
      ignored: this.ignoredPaths,
      ignoreInitial: true,
    }).on('all', (event, path) => {
      if (!this.processableMatch(path)) return;
      console.log(`[${event}] ` + green(path));
      this.process(resolve(path), target, options);
    });
  }

  async processAll(target: string) {
    const options = await this.projectService.getOptions();
    const files = await this.fileService.listDir(
      resolve(options.source),
      this.ignoredPaths
    );
    for (let i = 0; i < files.length; i++) {
      const path = files[i];
      if (!this.processableMatch(path)) continue;
      await this.process(path, target, options);
    }
  }

  async process(path: string, target: string, options?: ProjectOptions) {
    options = options || (await this.projectService.getOptions());
    const srcPath = path.replace(/\\/g, '/');
    const destPath = srcPath.replace(resolve(options.source), this.stageDir);
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

  private async transformApp(
    srcPath: string,
    destPath: string,
    target: string
  ) {
    if (target === 'development') {
      return this.copyItem(srcPath, destPath);
    }
    let content = await this.fileService.readText(srcPath);
    content = content.replace(
      "import configs from '../configs/development'",
      `import configs from '../configs/${target}'`
    );
    return await this.fileService.createFile(destPath, content);
  }

  private async transformElement(srcPath: string, destPath: string) {
    let content = await this.fileService.readText(srcPath);
    const matchArr = content.match(/(static styles = css`)([\s\S]*?)(`;)/);
    if (!matchArr) {
      return this.copyItem(srcPath, destPath);
    }
    const originalStyles = matchArr[2];
    const {css: compiledStyles} = await compileStringAsync(originalStyles);
    content = content.replace(originalStyles, compiledStyles);
    return await this.fileService.createFile(destPath, content);
  }

  private async copyItem(srcPath: string, destPath: string) {
    return this.fileService.copyFile(srcPath, destPath);
  }
}