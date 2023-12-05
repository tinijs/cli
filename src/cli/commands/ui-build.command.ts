import {compileString} from 'sass';
import {resolve} from 'path';
import {camelCase, pascalCase} from 'change-case';
const CleanCSS = require('clean-css');
import {bold, blueBright} from 'chalk';

import {OK} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
import {TypescriptService} from '../../lib/services/typescript.service';
import {BuildService} from '../../lib/services/build.service';
import {UiService} from '../../lib/services/ui.service';

export const APP_DIR = 'app';
export const UI_PACKAGE_NAME = '@tinijs/ui';

export class UiBuildCommand {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService,
    private typescriptService: TypescriptService,
    private buildService: BuildService,
    private uiService: UiService
  ) {}

  async run(packageName: string, soulName?: string) {
    packageName = !packageName
      ? UI_PACKAGE_NAME
      : `${packageName}-${!soulName ? 'common' : soulName}`;
    const destPath = resolve('build', packageName);
    // clean
    await this.fileService.cleanDir(destPath);
    // build
    let buildType = 'common';
    if (packageName === UI_PACKAGE_NAME) {
      buildType = 'bare';
      await this.buildBare(destPath);
    } else if (soulName) {
      buildType = 'soul';
      await this.buildSoul(destPath, soulName);
    } else {
      await this.buildCommon(destPath);
    }
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
        '**/*.d.ts',
        '**/*.js',
        '**/*.js.map',
        '**/*.scss',
        '**/*.css',
        '**/*.css.map',
        ...(buildType !== 'common'
          ? []
          : [
              '**/*.ts',
              '!app/**/*.ts',
              'app/**/*.d.ts',
              '**/*.ico',
              '**/*.svg',
              '**/*.webp',
              '**/*.jpg',
              '**/*.png',
              '**/*.woff',
              '**/*.woff2',
              '**/*.html',
              '**/*.md',
              '**/*.txt',
            ]),
      ],
      ...(buildType !== 'bare'
        ? {}
        : {
            scripts: {
              postinstall: 'cd ../../../ && tini ui use --build-only',
            },
          }),
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
    console.log(
      '\n' + OK + `Build ${bold(blueBright(packageName))} successfully!\n`
    );
  }

  private async buildBare(destPath: string) {
    // utilities
    await this.fileService.createFile(
      resolve(destPath, 'utilities.css'),
      this.uiService.cssUtils
    );
  }

  private async buildCommon(destPath: string) {
    // components
    await this.fileService.copyDir(
      resolve(this.uiService.COMPONENTS_DIR),
      resolve(destPath, this.uiService.COMPONENTS_DIR)
    );
    // blocks
    await this.fileService.copyDir(
      resolve(this.uiService.BLOCKS_DIR),
      resolve(destPath, this.uiService.BLOCKS_DIR)
    );
    // app
    const stagingPath = await this.buildService.buildStaging();
    const appOutPath = resolve(destPath, APP_DIR);
    await this.fileService.copyDir(stagingPath, appOutPath);
    const appTSPaths = (await this.fileService.listDir(appOutPath)).filter(
      path => path.endsWith('.ts')
    );
    await this.typescriptService.transpileAndOutputFiles(
      appTSPaths,
      this.uiService.TS_CONFIG,
      appOutPath,
      path => path.replace(`${appOutPath}/`, '')
    );
  }

  private async buildSoul(destPath: string, soulName: string) {
    const paths = await this.fileService.listDir(
      resolve(this.uiService.STYLES_DIR, soulName)
    );
    const stylesPathProcessor = (path: string) =>
      path.split(`/${this.uiService.STYLES_DIR}/${soulName}/`).pop() as string;

    /*
     * 1. ts
     */

    const tsPaths = paths.filter(path => path.endsWith('.ts'));
    await this.typescriptService.transpileAndOutputFiles(
      tsPaths,
      this.uiService.TS_CONFIG,
      `${destPath}/${this.uiService.STYLES_DIR}`,
      stylesPathProcessor
    );

    /*
     * 2. css/scss
     */

    const scssPaths = paths.filter(
      path => path.endsWith('.css') || path.endsWith('.scss')
    );
    for (let i = 0; i < scssPaths.length; i++) {
      const path = scssPaths[i];
      const filePath = stylesPathProcessor(path);
      const fileName = filePath.split('/').pop() as string;
      // dir
      const dirPaths = filePath.split('/');
      dirPaths.pop();
      await this.fileService.createDir(
        resolve(destPath, this.uiService.STYLES_DIR, ...dirPaths)
      );
      // .css
      if (path.endsWith('.css')) {
        await this.fileService.copyFile(
          path,
          resolve(destPath, this.uiService.STYLES_DIR, filePath)
        );
      }
      // .scss
      else {
        // .css & .css.map
        const content = await this.fileService.readText(path);
        const {css, sourceMap} = compileString(content, {
          sourceMap: true,
          loadPaths: [
            resolve(this.uiService.STYLES_DIR, soulName, ...dirPaths),
          ],
        });
        await this.fileService.createFile(
          resolve(
            destPath,
            this.uiService.STYLES_DIR,
            filePath.replace('.scss', '.css')
          ),
          css +
            '\n' +
            `/*# sourceMappingURL=${fileName.replace('.scss', '.css.map')} */`
        );
        const useSourceMap = (sourceMap || {}) as any;
        useSourceMap.sources = [fileName.replace('.scss', '.css')];
        await this.fileService.createFile(
          resolve(
            destPath,
            this.uiService.STYLES_DIR,
            filePath.replace('.scss', '.css.map')
          ),
          JSON.stringify(useSourceMap)
        );
        // .min.css & .min.css.map
        const {styles: minCss, sourceMap: minSourceMap} = new CleanCSS({
          sourceMap: true,
        }).minify(css);
        await this.fileService.createFile(
          resolve(
            destPath,
            this.uiService.STYLES_DIR,
            filePath.replace('.scss', '.min.css')
          ),
          minCss +
            '\n' +
            `/*# sourceMappingURL=${fileName.replace(
              '.scss',
              '.min.css.map'
            )} */`
        );
        await this.fileService.createFile(
          resolve(
            destPath,
            this.uiService.STYLES_DIR,
            filePath.replace('.scss', '.min.css.map')
          ),
          (minSourceMap?.toString() || '').replace(
            '"$stdin"',
            `"${fileName.replace('.scss', '.css.min')}"`
          )
        );
        // .scss
        await this.fileService.copyFile(
          path,
          resolve(destPath, this.uiService.STYLES_DIR, filePath)
        );
      }
    }

    /*
     * 3. components/custom-components, blocks/custom-blocks
     */
    await this.buildSoulComponents(this.uiService.COMPONENTS_DIR, destPath);
    await this.buildSoulComponents(this.uiService.BLOCKS_DIR, destPath);
    await this.buildSoulComponents(
      `custom-${this.uiService.COMPONENTS_DIR}`,
      destPath
    );
    await this.buildSoulComponents(
      `custom-${this.uiService.BLOCKS_DIR}`,
      destPath
    );

    /*
     * 4. Extract base .ts into .css
     */
    const basePaths = (
      await this.fileService.listDir(
        resolve(this.uiService.STYLES_DIR, soulName, 'base')
      )
    ).filter(path => path.endsWith('.ts'));
    for (let i = 0; i < basePaths.length; i++) {
      const path = basePaths[i];
      const pathArr = path.split('/');
      const fileName = pathArr.pop() as string;
      const tsContent = await this.fileService.readText(path);
      const cssContentMatching = tsContent.match(
        /(export default css`)([\s\S]*?)(`;)/
      );
      if (!cssContentMatching) continue;
      const cssContent = cssContentMatching[2];
      await this.fileService.createFile(
        resolve(
          destPath,
          this.uiService.STYLES_DIR,
          'base',
          fileName.replace('.ts', '.css')
        ),
        cssContent
      );
    }

    /*
     * 5. Utilities
     */
    await this.fileService.createFile(
      resolve(destPath, 'utilities.css'),
      this.uiService.cssUtils
    );
  }

  private async buildSoulComponents(inputDir: string, destPath: string) {
    // check input dir
    const inputPath = resolve(inputDir);
    if (!(await this.fileService.exists(inputPath))) return;

    /*
     * A. Build
     */
    const componentPaths = (await this.fileService.listDir(inputPath)).filter(
      path => path.endsWith('.ts')
    );
    const componentsPathProcessor = (path: string) =>
      path.split(`/${inputDir}/`).pop() as string;
    for (let i = 0; i < componentPaths.length; i++) {
      const path = componentPaths[i];
      const filePath = componentsPathProcessor(path);
      const fileName = filePath.split('/').pop() as string;
      const fileNameOnly = fileName.replace('.ts', '');
      const componentName = camelCase(fileNameOnly.replace(/-|\./g, ' '));
      const componentNameClass = pascalCase(componentName);
      const className = `Tini${componentNameClass}Component`;
      const tagName = `tini-${fileNameOnly}`;
      const reactTagName = `Tini${componentNameClass}`;
      // dir
      const dirPaths = filePath.split('/');
      dirPaths.pop();
      await this.fileService.createDir(
        resolve(destPath, inputDir, ...dirPaths)
      );
      // output .ts
      let code = await this.fileService.readText(path);
      const useBaseMatching = code.match(/\/\* UseBases\(([\s\S]*?)\) \*\//);
      const useComponentsMatching = code.match(
        /\/\* UseComponents\(([\s\S]*?)\) \*\//
      );
      const reactEventsMatching = code.match(
        /\/\* ReactEvents\(([\s\S]*?)\) \*\//
      );
      // base imports
      const useBaseContents = (!useBaseMatching ? '' : useBaseMatching[1])
        .split(',')
        .reduce(
          (result, item) => {
            const name = item.trim();
            if (name) {
              result.imports.push(
                `import ${name}Base from '../${this.uiService.STYLES_DIR}/base/${name}';`
              );
              result.styles.push(`${name}Base`);
            }
            return result;
          },
          {
            imports: [] as string[],
            styles: [] as string[],
          }
        );
      // component imports
      const useComponentsContents = (
        !useComponentsMatching ? '' : useComponentsMatching[1]
      )
        .split(',')
        .reduce(
          (result, item) => {
            const name = item.trim();
            const namePascal = pascalCase(name.replace(/-|\./g, ' '));
            const nameClass = `Tini${namePascal}Component`;
            if (name) {
              result.imports.push(`import {${nameClass}} from './${name}';`);
              result.components.push(nameClass);
            }
            return result;
          },
          {
            imports: [] as string[],
            components: [] as string[],
          }
        );
      // react events
      const reactEventsContents = (
        !reactEventsMatching ? '' : reactEventsMatching[1]
      )
        .split(',')
        .reduce(
          (result, item) => {
            const value = item.trim();
            if (value) {
              const [originalName, reactName] = value.split(':');
              result.events[reactName] = originalName;
            }
            return result;
          },
          {
            events: {} as Record<string, string>,
          }
        );
      // build content
      if (useBaseMatching) {
        code = code.replace(`${useBaseMatching[0]}\n`, '');
      }
      if (useComponentsMatching) {
        code = code.replace(`${useComponentsMatching[0]}\n`, '');
      }
      if (reactEventsMatching) {
        code = code.replace(`${reactEventsMatching[0]}\n`, '');
      }
      code = code.replace(
        /(\.\.\/styles\/([\s\S]*?)\/)|(\.\.\/styles\/)/g,
        '../styles/'
      );
      code =
        `
${useBaseContents.imports.join('\n')}
${useComponentsContents.imports.join('\n')}
import {${componentName}Style, ${componentName}Script} from '../${
          this.uiService.STYLES_DIR
        }/soul/${fileNameOnly}';
${!useComponentsMatching ? '' : "import {Components} from 'tinijs';"}\n\n` +
        code;
      // inject components
      if (useComponentsMatching) {
        code = code.replace(
          'export class ',
          `@Components(${JSON.stringify(
            useComponentsContents.components
          ).replace(/"/g, '')})
export class `
        );
      }
      // inject bases
      const updatedMethodStr = 'updated() {';
      const hasUpdatedMethod = ~code.indexOf(updatedMethodStr);
      const scriptingCode = `if (${componentName}Script) ${componentName}Script(this);`;
      const newUpdatedMethod = `protected ${updatedMethodStr}\n    ${scriptingCode}\n  }\n\n`;
      code = code.replace(
        'extends TiniElement {\n',
        `extends TiniElement {\n
  static styles = [${useBaseContents.styles.join(', ')}${
    !useBaseMatching ? '' : ','
  }${componentName}Style];

  ${hasUpdatedMethod ? '' : newUpdatedMethod}`
      );
      if (hasUpdatedMethod) {
        code = code.replace(
          updatedMethodStr,
          updatedMethodStr + '\n    ' + scriptingCode + '\n'
        );
      }
      const reactCode = `import React from 'react';
import {createComponent} from '@lit/react';
import {${className}} from './${fileNameOnly}';
export {${className}};
export const ${reactTagName} = createComponent({
  react: React,
  elementClass: ${className},
  tagName: ${className}.defaultTagName,${
    !Object.keys(reactEventsContents.events).length
      ? ''
      : `\n  events: ${JSON.stringify(reactEventsContents.events)}`
  }
});\n`;
      const bundleCode = `import {customElement} from 'lit/decorators.js';
import {${className} as _${className}} from './${fileNameOnly}';
@customElement('${tagName}')
export class ${className} extends _${className} {}
`;
      await this.fileService.createFile(
        resolve(destPath, inputDir, filePath),
        code
      );
      await this.fileService.createFile(
        resolve(destPath, inputDir, filePath.replace('.ts', '.react.ts')),
        reactCode
      );
      await this.fileService.createFile(
        resolve(destPath, inputDir, filePath.replace('.ts', '.bundle.ts')),
        bundleCode
      );
    }

    /*
     * B. Transpile
     */
    if (componentPaths.length) {
      const outComponentsPaths = (
        await this.fileService.listDir(resolve(destPath, inputDir))
      ).filter(path => !path.endsWith('.bundle.ts'));
      await this.typescriptService.transpileAndOutputFiles(
        outComponentsPaths,
        this.uiService.TS_CONFIG,
        `${destPath}/${inputDir}`,
        componentsPathProcessor
      );
    }
  }
}
