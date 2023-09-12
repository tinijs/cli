import {resolve} from 'path';
import {readFile} from 'fs-extra';
import {capitalCase} from 'change-case';
import {bold, blueBright} from 'chalk';
import {createHash} from 'crypto';
import * as ora from 'ora';
import {sanitize} from 'isomorphic-dompurify';
import {optimize} from 'svgo';

import {MISSING_ARG} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
import {TypescriptService} from '../../lib/services/typescript.service';
import {UiService} from '../../lib/services/ui.service';

const CHANGELOGS_DIR = 'changelogs';

export class UiIconCommand {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private typescriptService: TypescriptService,
    private uiService: UiService
  ) {}

  async run(packageName: string, src: string) {
    if (!packageName) return console.log(MISSING_ARG('packageName'));
    if (!src) return console.log(MISSING_ARG('src'));
    const spinner = ora('Build icons ...\n').start();
    // prepare
    src = src.replace(/^_\//, './node_modules/').replace(/^@\//, './src/');
    const destPath = resolve('build', packageName);
    const {
      description,
      version,
      author = '',
      homepage = '',
      license = '',
      keywords = [],
    } = await this.projectService.getPackageJson();
    // clean
    await this.fileService.cleanDir(destPath);
    // build icons
    const indexJson = await this.buildIcons(src, destPath, {
      packageName,
      version,
      spinner,
    });
    // package.json
    await this.fileService.createJson(resolve(destPath, 'package.json'), {
      name: packageName,
      version,
      description,
      author,
      homepage,
      license,
      keywords,
      files: [
        '*.svg',
        '*.webp',
        '*.png',
        '*.jpg',
        '*.js',
        '*.d.ts',
        'index.json',
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
    // README.md
    const readmePath = resolve('README.md');
    if (await this.fileService.exists(readmePath)) {
      await this.fileService.copyFile(
        readmePath,
        resolve(destPath, 'README.md')
      );
    }
    // result
    spinner.succeed(`Built ${indexJson.items.length} icons successfully!\n`);
  }

  private async buildIcons(
    src: string,
    destPath: string,
    {
      packageName,
      version,
      spinner,
    }: {packageName: string; version: string; spinner: ora.Ora}
  ) {
    // icon template
    const templateContent = this.uiService.iconTemplate;
    // preview app
    const appHtmlContent = this.uiService.iconPreviewHTMLTemplate;
    const appTsContent = this.uiService.iconPreviewTSTemplate;
    // retrieve history
    const changelogDirPath = resolve(CHANGELOGS_DIR, packageName);
    const historyFilePath = `${changelogDirPath}/history.json`;
    const history = !(await this.fileService.exists(historyFilePath))
      ? {version, records: {}}
      : ((await this.fileService.readJson(historyFilePath)) as {
          version: string;
          records: Record<
            string,
            {tag: string; digest: string; type?: 'add' | 'remove' | 'modify'}
          >;
        });
    if (history.version === version) {
      history.records = {};
    } else {
      history.version = version;
      Object.keys(history.records).forEach(
        key => (history.records[key].type = 'remove')
      );
    }
    // read src
    let paths = (await this.fileService.listDir(resolve(src))).filter(
      path =>
        path.endsWith('.svg') ||
        path.endsWith('.webp') ||
        path.endsWith('.png') ||
        path.endsWith('.jpg')
    );

    /*
     * 0. Built-in src filters
     */

    let buildFileNameOnly = (originalFileNameOnly: string) =>
      originalFileNameOnly.replace(/_|\./g, '-');

    // fluent
    if (packageName === '@tinijs/fluent-icons') {
      paths = paths.filter(path => path.includes('_24_'));
      buildFileNameOnly = (originalFileNameOnly: string) =>
        originalFileNameOnly.replace(/_24_|_|\./g, '-');
    }

    /*
     * I. Build icons
     */

    const indexJson = {
      version,
      items: [] as Array<[string, string]>,
    };
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      // original names
      const fileName = path.split('/').pop() as string;
      const fileNameArr = fileName.split('.');
      const fileExt = (fileNameArr.pop() as string).toLowerCase();
      const originalFileNameOnly = fileNameArr.join('.');
      spinner.text = `Build ${bold(blueBright(fileName))}\n`;
      // new names
      const fileNameOnly =
        buildFileNameOnly(originalFileNameOnly).toLowerCase();
      const newFileName = `${fileNameOnly}.${fileExt}`;
      const nameArr = fileNameOnly.split('-');
      const componentNameClass = nameArr
        .map(name => capitalCase(name))
        .join('');
      const tagName = `icon-${fileNameOnly}`;

      /*
       * 1. Read content
       */

      const {base64Content, base64Digest, URIHead, dataURI} =
        await this.extractBase64Data(path);
      let content = templateContent.replace(
        "--icon-image:url('icon.svg')",
        `--icon-image:url('${dataURI}')`
      );
      content = content.replace(
        'defaultTagName = ICON',
        `defaultTagName = '${tagName}'`
      );
      content = content.replace(
        'class IconComponent',
        `class Icon${componentNameClass}Component`
      );
      const contentWithReactWrapper =
        this.uiService.buildIconContentWithReactWrapper(
          content,
          componentNameClass
        );
      const contentWithDefine =
        "import {customElement} from 'lit/decorators.js';\n" +
        content.replace(
          'export class ',
          `@customElement('${tagName}')
export class `
        );

      /*
       * 2. Output .ts and copy image file
       */
      await this.fileService.createFile(
        resolve(destPath, `${fileNameOnly}.ts`),
        contentWithReactWrapper
      );
      await this.fileService.createFile(
        resolve(destPath, `${fileNameOnly}.include.ts`),
        contentWithDefine
      );
      await this.fileService.createFile(
        resolve(destPath, `${fileNameOnly}.bundle.ts`),
        contentWithDefine
      );
      await this.fileService.createFile(
        resolve(destPath, `${fileNameOnly}.source.ts`),
        fileExt !== 'svg'
          ? `export const dataURI = '${dataURI}';`
          : `export const base64 = '${base64Content}';
export const code = atob(base64);
export const URIHead = '${URIHead}';
export const dataURI = URIHead + base64;
`
      );
      // copy image file
      await this.fileService.copyFile(
        resolve(path),
        resolve(destPath, newFileName)
      );

      /*
       * 3. Metas: history, index.json
       */
      // history
      const {digest: lastestDigest} = history.records[fileName] || {};
      if (!lastestDigest) {
        history.records[fileName] = {
          tag: tagName,
          digest: base64Digest,
          type: 'add',
        };
      } else if (base64Digest !== lastestDigest) {
        history.records[fileName] = {
          tag: tagName,
          digest: base64Digest,
          type: 'modify',
        };
      } else {
        history.records[fileName].type = undefined;
      }
      // index.json
      indexJson.items.push([newFileName, base64Content]);
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
      this.uiService.TS_CONFIG,
      destPath,
      componentsPathProcessor
    );

    /*
     * III. Preview
     */

    const appTSImports = [] as string[];
    const appTSTags = [] as string[];
    indexJson.items.forEach(item => {
      const nameArr = item[0].split('.');
      const ext = nameArr.pop() as string;
      const name = nameArr.join('.');
      const tag = `icon-${name}`;
      appTSImports.push(`import './${name}.include';`);
      appTSTags.push(`<div class="icon"><${tag}></${tag}></div>`);
    });
    const appTSContentWithImports =
      `${appTSImports.join('\n')}\n` +
      appTsContent.replace(
        '<main></main>',
        `<main>${appTSTags.join('')}</main>`
      );
    await this.fileService.createFile(
      resolve(destPath, '___preview.app.ts'),
      appTSContentWithImports
    );
    await this.fileService.createFile(
      resolve(destPath, 'index.html'),
      appHtmlContent
    );

    /*
     * IV. Changelogs
     */
    const addedTags: string[] = [];
    const removedTags: string[] = [];
    const modifiedTags: string[] = [];
    Object.keys(history.records).forEach(key => {
      const {tag, type} = history.records[key];
      if (type === 'add') addedTags.push(tag);
      else if (type === 'remove') removedTags.push(tag);
      else if (type === 'modify') modifiedTags.push(tag);
    });
    await this.fileService.createDir(changelogDirPath);
    await this.fileService.createJson(historyFilePath, history);
    await this.fileService.createFile(
      resolve(changelogDirPath, `changelog-v${version}.md`),
      `# Changelog v${version}\n\n` +
        `- Package: \`${packageName}\`\n` +
        `- Build time: **${new Date()}**\n\n` +
        (modifiedTags.length
          ? `## Modified\n${modifiedTags
              .map(tag => `- \`${tag}\``)
              .join('\n')}\n\n`
          : '') +
        (addedTags.length
          ? `## Added\n${addedTags.map(tag => `- \`${tag}\``).join('\n')}\n\n`
          : '') +
        (removedTags.length
          ? `## Removed\n${removedTags
              .map(tag => `- \`${tag}\``)
              .join('\n')}\n\n`
          : '')
    );

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

  private async extractBase64Data(path: string) {
    const ext = (path.split('.').pop() as string).toLowerCase();
    const mimeType = {
      svg: 'image/svg+xml',
      webp: 'image/webp',
      png: 'image/png',
      jpg: 'image/jpeg',
    }[ext];
    // extract data
    let base64Content = '';
    if (ext !== 'svg') {
      base64Content = await readFile(resolve(path), {encoding: 'base64'});
    } else {
      const {data: textContent} = optimize(
        sanitize(await this.fileService.readText(resolve(path))),
        {
          multipass: true,
          plugins: [
            'preset-default',
            'removeDimensions',
            'removeOffCanvasPaths',
            'removeScriptElement',
            'sortAttrs',
            {
              name: 'removeAttrs',
              params: {attrs: ['data-*', 'data.*']},
            },
            {
              name: 'convertStyleToAttrs',
              params: {keepImportant: true},
            },
          ],
        }
      );
      base64Content = Buffer.from(textContent).toString('base64');
    }
    const base64Digest = createHash('sha256')
      .update(base64Content)
      .digest('hex');
    const URIHead = `data:${mimeType};base64,`;
    const dataURI = `${URIHead}${base64Content}`;
    // result
    return {
      mimeType,
      base64Content,
      base64Digest,
      URIHead,
      dataURI,
    };
  }
}
