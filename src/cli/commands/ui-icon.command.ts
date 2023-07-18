import {resolve} from 'path';
import {readFile} from 'fs-extra';
import {capitalCase} from 'change-case';
import * as ora from 'ora';
import {blue} from 'chalk';

import {MISSING_ARG, OK} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
import {TypescriptService} from '../../lib/services/typescript.service';
import {TS_CONFIG} from './ui-build.command';

const TEMPLATE_FILE = 'src/template.ts';
const APP_HTML_FILE = 'src/app.html';
const APP_TS_FILE = 'src/app.ts';

export class UiIconCommand {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private typescriptService: TypescriptService
  ) {}

  async run(packageName: string, src: string) {
    if (!packageName) return console.log(MISSING_ARG('packageName'));
    if (!src) return console.log(MISSING_ARG('src'));
    src = src.replace('_/', './node_modules/').replace('@/', './src/');
    const destPath = resolve('build', packageName);
    const spinner = ora('Building icons!').start();
    // clean
    await this.fileService.cleanDir(destPath);
    // icons
    const indexJson = await this.buildIcons(src, destPath, spinner);
    // package.json
    const {
      description,
      version,
      author = '',
      homepage = '',
      license = '',
      keywords = [],
    } = await this.projectService.getPackageJson();
    await this.fileService.createJson(resolve(destPath, 'package.json'), {
      name: packageName,
      version,
      description,
      author,
      homepage,
      license,
      keywords,
      files: [
        '**/*.ts',
        '**/*.js',
        '**/*.js.map',
        '**/*.svg',
        '**/*.webp',
        '**/*.png',
        '**/*.jpg',
      ],
    });
    // license
    const licensePath = resolve('LICENSE');
    if (await this.fileService.exists(licensePath)) {
      await this.fileService.copyFile(
        licensePath,
        resolve(destPath, 'LICENSE')
      );
    }
    // result
    spinner.succeed(`Built ${indexJson.length} icons successfully!\n`);
  }

  private async buildIcons(src: string, destPath: string, spinner: ora.Ora) {
    const templateContent = await this.fileService.readText(
      resolve(TEMPLATE_FILE)
    );
    const appHtmlContent = await this.fileService.readText(
      resolve(APP_HTML_FILE)
    );
    const appTsContent = await this.fileService.readText(resolve(APP_TS_FILE));
    const paths = (await this.fileService.listDir(resolve(src))).filter(
      path =>
        path.endsWith('.svg') ||
        path.endsWith('.webp') ||
        path.endsWith('.png') ||
        path.endsWith('.jpg')
    );
    // TODO: filter fluent sizes

    /*
     * I. Build icons
     */

    const indexJson: string[] = [];
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      // original names
      const fileName = path.split('/').pop() as string;
      spinner.text = `Building ${blue(fileName)}`;
      const fileNameArr = fileName.split('.');
      const fileExt = fileNameArr.pop() as string;
      // new names
      const fileNameOnly = fileNameArr.join('.').replace(/_|\./g, '-');
      const newFileName = `${fileNameOnly}.${fileExt}`;
      const nameArr = fileNameOnly.split('-');
      const componentNameClass = nameArr
        .map(name => capitalCase(name))
        .join('');
      const componentNameConst = nameArr
        .map(name => name.toUpperCase())
        .join('_');
      const tagName = `ICON_${componentNameConst}`;
      const mimeType = {
        svg: 'image/svg+xml',
        webp: 'image/webp',
        png: 'image/png',
        jpg: 'image/jpeg',
      }[fileExt];

      /*
       * 1. Read content
       */

      const base64Content = await readFile(resolve(path), {encoding: 'base64'});
      let content = templateContent.replace(
        'background-image: url()',
        `background-image: url('data:${mimeType};base64,${base64Content}')`
      );
      content = content.replace(
        "ICON = 'icon'",
        `${tagName} = 'icon-${fileNameOnly}'`
      );
      content = content.replace(
        'IconComponent',
        `Icon${componentNameClass}Component`
      );
      const contentWithDefine =
        "import {customElement} from 'lit/decorators.js';\n" +
        content.replace(
          'export class',
          `@customElement(${tagName})
export class`
        );

      /*
       * 2. Output .ts and copy image file
       */
      await this.fileService.createFile(
        resolve(destPath, `${fileNameOnly}.ts`),
        content
      );
      await this.fileService.createFile(
        resolve(destPath, `${fileNameOnly}.import.ts`),
        contentWithDefine
      );
      await this.fileService.createFile(
        resolve(destPath, `${fileNameOnly}.bundle.ts`),
        contentWithDefine
      );
      // copy image file
      await this.fileService.copyFile(
        resolve(path),
        resolve(destPath, newFileName)
      );

      /*
       * 3. Save for index.json
       */
      indexJson.push(newFileName);
    }

    /*
     * II. Transpile icons
     */

    const outComponentsPaths = (
      await this.fileService.listDir(destPath)
    ).filter(path => path.endsWith('.ts') && !path.endsWith('.bundle.ts'));
    const componentsPathProcessor = (path: string) =>
      path.split('/').pop() as string;
    await this.typescriptService.transpileAndOutputFiles(
      outComponentsPaths,
      TS_CONFIG,
      destPath,
      componentsPathProcessor
    );

    /*
     * III. Preview
     */

    const appTSImports = [] as string[];
    const appTSTags = [] as string[];
    indexJson.forEach(item => {
      const nameArr = item.split('.');
      const ext = nameArr.pop() as string;
      const name = nameArr.join('.');
      const tagName = `icon-${name}`;
      appTSImports.push(`import './${name}.import';`);
      appTSTags.push(`<div class="icon"><${tagName}></${tagName}></div>`);
    });
    const appTSContentWithImports =
      `${appTSImports.join('\n')}\n` +
      appTsContent.replace(
        '<main></main>',
        `<main>${appTSTags.join('')}</main>`
      );
    await this.fileService.createFile(
      resolve(destPath, '___app.ts'),
      appTSContentWithImports
    );
    await this.fileService.createFile(
      resolve(destPath, 'index.html'),
      appHtmlContent
    );

    /*
     * IV. Changelogs
     */

    // TODO: ...

    /*
     * V. Output index.json
     */
    await this.fileService.createJson(
      resolve(destPath, 'index.json'),
      indexJson,
      true
    );

    // result
    return indexJson;
  }
}
