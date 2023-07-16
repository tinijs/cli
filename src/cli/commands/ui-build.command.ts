import {ModuleKind, ScriptTarget} from 'typescript';
import {compileString} from 'sass';
import {resolve} from 'path';
const CleanCSS = require('clean-css');

import {MISSING_ARG} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
import {TypescriptService} from '../../lib/services/typescript.service';

const TS_CONFIG = {
  declaration: true,
  sourceMap: true,
  module: ModuleKind.ESNext,
  target: ScriptTarget.ESNext,
  experimentalDecorators: true,
  useDefineForClassFields: false,
};

export class UiBuildCommand {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private typescriptService: TypescriptService
  ) {}

  async run(packageName: string, soulName?: string) {
    if (!packageName) {
      return console.log(MISSING_ARG('packageName'));
    }
    packageName = `${packageName}-${!soulName ? 'components' : soulName}`;
    const destPath = resolve('build', packageName);
    // clean
    await this.fileService.cleanDir(destPath);
    // build
    if (soulName) {
      await this.buildSoul(destPath, soulName);
    } else {
      await this.buildComponents(destPath);
    }
    // package.json
    const {version} = await this.projectService.getPackageJson();
    await this.fileService.createJson(resolve(destPath, 'package.json'), {
      name: packageName,
      version: version,
    });
    // license
    const licensePath = resolve('LICENSE');
    if (await this.fileService.exists(licensePath)) {
      await this.fileService.copyFile(
        licensePath,
        resolve(destPath, 'LICENSE')
      );
    }
  }

  private async buildComponents(destPath: string) {
    const paths = (
      await this.fileService.listDir(resolve('components'))
    ).filter(path => path.endsWith('.ts'));
    await this.typescriptService.transpileAndOutputFiles(
      paths,
      TS_CONFIG,
      `${destPath}/components`,
      path => path.split('/components/').pop() as string,
      content =>
        content.replace(
          /(\.\.\/styles\/([\s\S]*?)\/)|(\.\.\/styles\/)/g,
          '@tinijs/ui/styles/'
        )
    );
  }

  private async buildSoul(destPath: string, soulName: string) {
    const paths = await this.fileService.listDir(resolve('styles', soulName));
    const filePathProcessor = (path: string) => path.split(`/styles/${soulName}/`).pop() as string
    // ts
    const tsPaths = paths.filter(path => path.endsWith('.ts'));
    await this.typescriptService.transpileAndOutputFiles(
      tsPaths,
      TS_CONFIG,
      `${destPath}/styles`,
      filePathProcessor
    );
    // scss
    const scssPaths = paths.filter(path => path.endsWith('.scss'));
    for (let i = 0; i < scssPaths.length; i++) {
      const path = scssPaths[i];
      const filePath = filePathProcessor(path);
      // dir
      const dirPaths = filePath.split('/');
      dirPaths.pop();
      await this.fileService.createDir(
        resolve(destPath, 'styles', ...dirPaths)
      );
      // .css & .css.map
      const content = await this.fileService.readText(path);
      const {css} = compileString(content, {
        sourceMap: true,
        loadPaths: [resolve('styles', soulName, ...dirPaths)],
      });
      await this.fileService.createFile(
        resolve(destPath, 'styles', filePath.replace('.scss', '.css')),
        css
      );
      // TODO: fix sourceMap
      // await this.fileService.createFile(
      //   resolve(destPath, 'styles', filePath.replace('.scss', '.css.map')),
      //   sourceMap?.mappings || ''
      // );
      // .min.css & .min.css.map
      const {styles} = new CleanCSS({ sourceMap: true }).minify(css);
      await this.fileService.createFile(
        resolve(destPath, 'styles', filePath.replace('.scss', '.min.css')),
        styles
      );
      // TODO: fix sourceMap
      // await this.fileService.createFile(
      //   resolve(destPath, 'styles', filePath.replace('.scss', '.min.css.map')),
      //   minSourceMap?.mappings || ''
      // );
      // .scss
      await this.fileService.copyFile(
        path,
        resolve(destPath, 'styles', filePath)
      );
    }
  }
}
