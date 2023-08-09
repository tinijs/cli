import {compileString} from 'sass';
import {resolve} from 'path';
import {camelCase, capitalCase} from 'change-case';
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
        ...(buildType !== 'common' ? [] : ['**/*.ts']),
      ],
      ...(buildType === 'common'
        ? {}
        : {
            main: 'public-api.js',
            types: 'public-api.d.ts',
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
    // skin utils
    await this.fileService.createFile(
      resolve(destPath, 'skin-utils.css'),
      this.uiService.skinUtils
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
    await this.fileService.copyDir(stagingPath, resolve(destPath, APP_DIR));
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
     * 3. Components, Blocks
     */
    const componentPublicPaths = await this.buildSoulComponents(
      this.uiService.COMPONENTS_DIR,
      destPath
    );
    const blockPublicPaths = await this.buildSoulComponents(
      this.uiService.BLOCKS_DIR,
      destPath
    );
    await this.uiService.savePublicApi(destPath, [
      ...componentPublicPaths,
      ...blockPublicPaths,
    ]);

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
     * 5. Skin utils
     */
    await this.fileService.createFile(
      resolve(destPath, 'skin-utils.css'),
      this.uiService.skinUtils
    );
  }

  private async buildSoulComponents(inputDir: string, destPath: string) {
    const publicPaths: string[] = [];

    /*
     * A. Build
     */
    const componentPaths = (
      await this.fileService.listDir(resolve(inputDir))
    ).filter(path => path.endsWith('.ts'));
    const componentsPathProcessor = (path: string) =>
      path.split(`/${inputDir}/`).pop() as string;
    for (let i = 0; i < componentPaths.length; i++) {
      const path = componentPaths[i];
      const filePath = componentsPathProcessor(path);
      const fileName = filePath.split('/').pop() as string;
      const fileNameOnly = fileName.replace('.ts', '');
      const componentName = camelCase(fileNameOnly.replace(/\-/g, ' '));
      const componentNameConst = fileNameOnly.replace(/\-/g, '_').toUpperCase();
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
            const nameCapital = capitalCase(name.replace(/\-|\./g, ' '));
            const nameClass = `Tini${nameCapital}Component`;
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
      // build content
      if (useBaseMatching) {
        code = code.replace(`${useBaseMatching[0]}\n`, '');
      }
      if (useComponentsMatching) {
        code = code.replace(`${useComponentsMatching[0]}\n`, '');
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
        }/soul/${fileNameOnly}';\n\n` + code;
      // inject components
      if (useComponentsMatching) {
        code = code.replace(
          'export class ',
          `@Components(${JSON.stringify(
            useComponentsContents.components
          ).replace(/\"/g, '')})
export class `
        );
      }
      // inject bases
      code = code.replace(
        'extends LitElement {\n',
        `extends LitElement {\n
  static styles = [${useBaseContents.styles.join(', ')}${
    !useBaseMatching ? '' : ','
  }${componentName}Style];

  protected updated() {
    ${componentName}Script(this);
  }\n\n`
      );
      const codeWithDefine =
        "import {customElement} from 'lit/decorators.js';\n" +
        code.replace(
          'export class',
          `@customElement(TINI_${componentNameConst})
export class`
        );
      await this.fileService.createFile(
        resolve(destPath, inputDir, filePath),
        code
      );
      await this.fileService.createFile(
        resolve(destPath, inputDir, filePath.replace('.ts', '.include.ts')),
        codeWithDefine
      );
      await this.fileService.createFile(
        resolve(destPath, inputDir, filePath.replace('.ts', '.bundle.ts')),
        codeWithDefine
      );
      // public path
      publicPaths.push(`./${inputDir}/${filePath.replace('.ts', '')}`);
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

    // result
    return publicPaths;
  }
}
