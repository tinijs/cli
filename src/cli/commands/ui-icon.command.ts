import {resolve, basename} from 'path';
import {readFile} from 'fs-extra';
import {capitalCase} from 'change-case';
import {bold, blueBright} from 'chalk';
import * as ora from 'ora';
import {sanitize} from 'isomorphic-dompurify';
import {optimize} from 'svgo';

import {MISSING_ARG} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
import {TypescriptService} from '../../lib/services/typescript.service';
import {UiService} from '../../lib/services/ui.service';

export interface UIIconCommandOptions {
  output?: string;
  hook?: string;
  react?: boolean;
}

export class UiIconCommand {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private typescriptService: TypescriptService,
    private uiService: UiService
  ) {}

  async run(sources: string[], commandOptions: UIIconCommandOptions) {
    if (!sources) return console.log(MISSING_ARG('sources'));
    const spinner = ora('Build icons ...\n').start();
    // prepare
    sources = sources.map(item =>
      item.replace(/^_\//, './node_modules/').replace(/^@\//, './src/')
    );
    const destDirPath = !commandOptions.output
      ? resolve(this.projectService.uiOutputDirPath, 'icons')
      : resolve(commandOptions.output);
    // clean
    await this.fileService.cleanDir(destDirPath);
    // build icons
    const icons = await this.buildIcons(
      spinner,
      sources,
      destDirPath,
      commandOptions
    );
    // result
    spinner.succeed(`Built ${icons.length} icons successfully!\n`);
  }

  private async buildIcons(
    spinner: ora.Ora,
    sources: string[],
    destDirPath: string,
    commandOptions: UIIconCommandOptions
  ) {
    const {hook: hookFile, react: isReact} = commandOptions;
    const templateCode = this.iconTemplate;
    const previewHtmlCode = this.previewHTMLTemplate;
    const previewTsCode = this.previewTSTemplate;
    let filePaths = await this.readIconFilePaths(sources);

    /*
     * Run hook
     */

    let hookResult:
      | {
          filterPaths?: (paths: string[]) => string[];
          transformName?: (name: string) => string;
        }
      | undefined;
    if (hookFile) {
      const {default: hook} = await import(resolve(hookFile));
      hookResult = hook();
    }
    if (hookResult?.filterPaths) {
      filePaths = hookResult.filterPaths(filePaths);
    }
    const transformFileNameOnly = (originalFileNameOnly: string) => {
      if (hookResult?.transformName) {
        originalFileNameOnly = hookResult.transformName(originalFileNameOnly);
      }
      return originalFileNameOnly.replace(/_|\./g, '-');
    };

    /*
     * Build icons
     */

    const allItems = [] as Array<{
      fileNameOnly: string;
      componentNameClass: string;
      tagName: string;
    }>;
    const countNames = {} as Record<string, number>;
    for (let i = 0; i < filePaths.length; i++) {
      const [path, variantSuffix] = filePaths[i].split('?');
      // original names
      const fileName = path.split('/').pop() as string;
      const fileNameArr = fileName.split('.');
      const originalFileNameOnly = fileNameArr
        .slice(0, fileNameArr.length - 1)
        .join('.');
      spinner.text = `Build ${bold(blueBright(fileName))}\n`;
      // new names
      let fileNameOnly =
        transformFileNameOnly(originalFileNameOnly).toLowerCase();
      if (variantSuffix) {
        fileNameOnly = `${fileNameOnly}-${variantSuffix}`;
      }
      if (!countNames[fileNameOnly]) {
        countNames[fileNameOnly] = 1;
      } else {
        const count = ++countNames[fileNameOnly];
        fileNameOnly = `${fileNameOnly}-${count}`;
      }
      const nameArr = fileNameOnly.split('-');
      const componentNameClass = nameArr
        .map(name => capitalCase(name))
        .join('');
      const className = `Icon${componentNameClass}Component`;
      const tagName = `icon-${fileNameOnly}`;
      const reactTagName = `Icon${componentNameClass}`;

      // output files
      const dataURI = await this.fileToDataURI(path);
      const code = templateCode
        .replace('ICON_SRC', `'${dataURI}'`)
        .replace('defaultTagName = ICON', `defaultTagName = '${tagName}'`)
        .replace('class IconComponent', `class ${className}`);
      const reactCode = `import React from 'react';
import {createComponent} from '@lit/react';
${code}
export const ${reactTagName} = createComponent({
  react: React,
  elementClass: ${className},
  tagName: ${className}.defaultTagName,
});
`;
      await this.fileService.createFile(
        resolve(destDirPath, `${fileNameOnly}.ts`),
        !isReact ? code : reactCode
      );

      // save item for later use
      allItems.push({
        fileNameOnly,
        componentNameClass,
        tagName,
      });
    }

    /*
     * II. Transpile icons
     */

    const componentsPathProcessor = (path: string) =>
      path.split('/').pop() as string;
    await this.typescriptService.transpileAndOutputFiles(
      (await this.fileService.listDir(destDirPath)).filter(path =>
        path.endsWith('.ts')
      ),
      this.uiService.TS_CONFIG,
      destDirPath,
      componentsPathProcessor
    );

    /*
     * III. Preview
     */

    const appTSImports = [] as string[];
    const appTSComponents = [] as string[];
    const appTSTags = [] as string[];
    allItems.forEach(({fileNameOnly, componentNameClass, tagName}) => {
      appTSImports.push(
        `import {${componentNameClass}} from './${fileNameOnly}';`
      );
      appTSComponents.push(componentNameClass);
      appTSTags.push(`<div class="icon"><${tagName}></${tagName}></div>`);
    });
    const appTSCodeWithImports =
      `${appTSImports.join('\n')}\n` +
      previewTsCode
        .replace(
          "@customElement('app-preview')",
          `useComponents([${appTSComponents.join(
            ','
          )}]);\n\n@customElement('app-preview')`
        )
        .replace('<main></main>', `<main>${appTSTags.join('')}</main>`);
    await this.fileService.createFile(
      resolve(destDirPath, '___preview.ts'),
      appTSCodeWithImports
    );
    await this.fileService.createFile(
      resolve(destDirPath, 'index.html'),
      previewHtmlCode
    );

    // result
    return allItems;
  }

  private async readIconFilePaths(sources: string[]) {
    const imageFilter = (path: string) =>
      path.endsWith('.svg') ||
      path.endsWith('.webp') ||
      path.endsWith('.png') ||
      path.endsWith('.jpg');
    // read file paths
    const allFilePaths = [] as string[];
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if (!~source.indexOf(':')) {
        const filePaths = (
          await this.fileService.listDir(resolve(source))
        ).filter(imageFilter);
        allFilePaths.push(...filePaths);
      } else {
        const [dirRoot, suffixes] = source.split(':');
        const suffixArr = suffixes.split(',');
        for (let i = 0; i < suffixArr.length; i++) {
          const includesSuffix = ~suffixArr[i].indexOf('+');
          const [dirName, renameSuffix] = suffixArr[i].split('+');
          const filePaths = (
            await this.fileService.listDir(resolve(dirRoot, dirName))
          ).filter(imageFilter);
          allFilePaths.push(
            ...(!includesSuffix
              ? filePaths
              : filePaths.map(path => `${path}?${renameSuffix || dirName}`))
          );
        }
      }
    }
    // result
    return allFilePaths.sort((a, b) => basename(a).localeCompare(basename(b)));
  }

  private async fileToDataURI(file: string) {
    const path = resolve(file);
    const ext = (file.split('.').pop() as string).toLowerCase();
    const mimeType = {
      svg: 'image/svg+xml',
      webp: 'image/webp',
      png: 'image/png',
      jpg: 'image/jpeg',
    }[ext];
    const isSVG = ext === 'svg';
    // extract content
    let content = '';
    if (!isSVG) {
      content = await readFile(path, {encoding: 'base64'});
    } else {
      const {data: textContent} = optimize(
        sanitize(await this.fileService.readText(path)),
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
      content = textContent
        .replace(/"/g, "'")
        .replace(/%/g, '%25')
        .replace(/#/g, '%23')
        .replace(/</g, '%3C')
        .replace(/>/g, '%3E')
        .replace(/\s+/g, ' ');
    }
    // result
    return `data:${mimeType};base64,${content}`;
  }

  get iconTemplate() {
    return `import {TiniIconComponent} from '@tinijs/ui/components/icon';
export class IconComponent extends TiniIconComponent {
  static readonly defaultTagName = ICON;
  static readonly prebuiltSrc = ICON_SRC;
}`;
  }

  get previewHTMLTemplate() {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tini Icons Preview</title>
    <script type="module" src="___preview.ts"></script>
    <style>
      :root {
        --scale-md-2x: 32px;
      }
      body {
        margin: 0;
        padding: 1rem;
      }
    </style>
  </head>
  <body>
    <app-preview></app-preview>
  </body>
</html>
    `;
  }

  get previewTSTemplate() {
    return `import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {useComponents} from 'tinijs';

@customElement('app-preview')
export class AppPreview extends LitElement {
  static styles = css\`
    main {
      display: grid;
      grid-template-columns: repeat(auto-fill, 3rem);
      gap: .5rem;
    }
    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border: 1px solid #ccc;
      border-radius: 5px;
    }
  \`;

  protected render() {
    return html\`<main></main>\`;
  }
}
    `;
  }
}
