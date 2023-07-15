import {ModuleKind, ScriptTarget} from 'typescript';
import {resolve} from 'path';

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
    paths.push(resolve('styles', 'types.ts'));
    // ts
    const tsPaths = paths.filter(path => path.endsWith('.ts'));
    await this.typescriptService.transpileAndOutputFiles(
      tsPaths,
      TS_CONFIG,
      `${destPath}/styles`,
      path =>
        (path.split('/styles/').pop() as string).replace(`${soulName}/`, ''),
      content => content.replace(/('\.\.\/\.\.\/types')/g, "'../types'")
    );
    // scss
    const scssPaths = paths.filter(path => path.endsWith('.scss'));
    for (let i = 0; i < scssPaths.length; i++) {
      const path = scssPaths[i];
      const filePath = path.split(`/styles/${soulName}/`).pop() as string;
      // dir
      const dirPaths = filePath.split('/');
      dirPaths.pop();
      await this.fileService.createDir(
        resolve(destPath, 'styles', ...dirPaths)
      );
      // file
      await this.fileService.copyFile(
        path,
        resolve(destPath, 'styles', filePath)
      );
    }
  }
}
