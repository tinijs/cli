import {transpileModule, ModuleKind, ScriptTarget} from 'typescript';
import {resolve} from 'path';

import {MISSING_ARG} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
import {TypescriptService} from '../../lib/services/typescript.service';

export class UiBuildCommand {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private typescriptService: TypescriptService,
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
      await this.buildSoul(packageName, soulName, destPath);
    } else {
      await this.buildComponents(packageName, destPath);
    }
  }

  private async buildComponents(packageName: string, destPath: string) {
    // 1. code
    const paths = (
      await this.fileService.listDir(resolve('components'))
    ).filter(path => path.endsWith('.ts'));
    const result = this.typescriptService.transpileFiles(paths, {
      declaration: true,
      sourceMap: true,
      module: ModuleKind.ESNext,
      target: ScriptTarget.ESNext,
      experimentalDecorators: true,
      useDefineForClassFields: false,
    });
    const postProcessor = (content: string) =>
      content.replace(/(\.\.\/styles\/([\s\S]*?)\/)|(\.\.\/styles\/)/g, '@tinijs/ui/styles/')
    for (let i = 0; i < result.length; i++) {
      const {path, jsContent, dtsContent, mapContent} = result[i];
      const [, filePath] = path.split('/components/');
      const fileName = filePath.split('/').pop();
      await this.fileService.createFile(
        resolve(destPath, 'components', filePath.replace('.ts', '.js')),
        postProcessor(jsContent),
      );
      await this.fileService.createFile(
        resolve(destPath, 'components', filePath.replace('.ts', '.d.ts')),
        postProcessor(dtsContent),
      );
      await this.fileService.createFile(
        resolve(destPath, 'components', filePath.replace('.ts', '.js.map')),
        postProcessor(mapContent),
      );
    }
    // 2. package.json
    const {version} = await this.projectService.getPackageJson();
    await this.fileService.createJson(
      resolve(destPath, 'package.json'),
      {
        name: packageName,
        version: version
      }
    );
    // 3. license
    const licensePath = resolve('LICENSE');
    if (await this.fileService.exists(licensePath)) {
      await this.fileService.copyFile(
        licensePath,
        resolve(destPath, 'LICENSE'),
      );
    }
  }

  private async buildSoul(packageName: string, soulName: string, destPath: string) {}
}
