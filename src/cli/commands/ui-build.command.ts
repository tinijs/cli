import {ModuleKind, ScriptTarget} from 'typescript';
import {compileString} from 'sass';
import {resolve} from 'path';
import {camelCase} from 'change-case';
const CleanCSS = require('clean-css');

import {OK} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {ProjectService} from '../../lib/services/project.service';
import {TypescriptService} from '../../lib/services/typescript.service';
import {UiService} from '../../lib/services/ui.service';

export const COMPONENTS_DIR = 'components';
export const STYLES_DIR = 'styles';
export const UI_PACKAGE_NAME = '@tinijs/ui';
export const TS_CONFIG = {
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
    private typescriptService: TypescriptService,
    private uiService: UiService
  ) {}

  async run(packageName: string, soulName?: string) {
    packageName = !packageName
      ? UI_PACKAGE_NAME
      : `${packageName}-${!soulName ? COMPONENTS_DIR : soulName}`;
    const destPath = resolve('build', packageName);
    // clean
    await this.fileService.cleanDir(destPath);
    // build
    if (packageName === UI_PACKAGE_NAME) {
      await this.buildUI();
    } else if (soulName) {
      await this.buildSoul(destPath, soulName);
    } else {
      await this.buildComponents(destPath);
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
        '**/*.ts',
        '**/*.js',
        '**/*.js.map',
        '**/*.scss',
        '**/*.css',
        '**/*.css.map',
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
    console.log(OK + `Build ${packageName} successfully!`);
  }

  private async buildUI() {}

  private buildComponents(destPath: string) {
    return this.fileService.copyDir(
      resolve(COMPONENTS_DIR),
      resolve(destPath, COMPONENTS_DIR)
    );
  }

  private async buildSoul(destPath: string, soulName: string) {
    const paths = await this.fileService.listDir(resolve(STYLES_DIR, soulName));
    const stylesPathProcessor = (path: string) =>
      path.split(`/${STYLES_DIR}/${soulName}/`).pop() as string;

    /*
     * 1. ts
     */

    const tsPaths = paths.filter(path => path.endsWith('.ts'));
    await this.typescriptService.transpileAndOutputFiles(
      tsPaths,
      TS_CONFIG,
      `${destPath}/${STYLES_DIR}`,
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
        resolve(destPath, STYLES_DIR, ...dirPaths)
      );
      // .css
      if (path.endsWith('.css')) {
        await this.fileService.copyFile(
          path,
          resolve(destPath, STYLES_DIR, filePath)
        );
      }
      // .scss
      else {
        // .css & .css.map
        const content = await this.fileService.readText(path);
        const {css, sourceMap} = compileString(content, {
          sourceMap: true,
          loadPaths: [resolve(STYLES_DIR, soulName, ...dirPaths)],
        });
        await this.fileService.createFile(
          resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.css')),
          css +
            '\n' +
            `/*# sourceMappingURL=${fileName.replace('.scss', '.css.map')} */`
        );
        const useSourceMap = (sourceMap || {}) as any;
        useSourceMap.sources = [fileName.replace('.scss', '.css')];
        await this.fileService.createFile(
          resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.css.map')),
          JSON.stringify(useSourceMap)
        );
        // .min.css & .min.css.map
        const {styles: minCss, sourceMap: minSourceMap} = new CleanCSS({
          sourceMap: true,
        }).minify(css);
        await this.fileService.createFile(
          resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.min.css')),
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
            STYLES_DIR,
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
          resolve(destPath, STYLES_DIR, filePath)
        );
      }
    }

    /*
     * 3. components
     */

    const componentPaths = (
      await this.fileService.listDir(resolve(COMPONENTS_DIR))
    ).filter(path => path.endsWith('.ts'));
    const componentsPathProcessor = (path: string) =>
      path.split(`/${COMPONENTS_DIR}/`).pop() as string;
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
        resolve(destPath, STYLES_DIR, ...dirPaths)
      );
      // output .ts
      let code = await this.fileService.readText(path);
      const useBaseMatching = code.match(/\/\* UseBase\(([\s\S]*?)\) \*\//);
      const useBaseContents = (!useBaseMatching ? '' : useBaseMatching[1])
        .split(',')
        .reduce(
          (result, item) => {
            const name = item.trim();
            if (name) {
              result.imports.push(
                `import ${name}Style from '../${STYLES_DIR}/base/${name}';`
              );
              result.styles.push(`${name}Style`);
            }
            return result;
          },
          {
            imports: [] as string[],
            styles: [] as string[],
          }
        );
      if (useBaseMatching) code = code.replace(`${useBaseMatching[0]}\n`, '');
      code = code.replace(
        /(\.\.\/styles\/([\s\S]*?)\/)|(\.\.\/styles\/)/g,
        '../styles/'
      );
      code =
        `
${useBaseContents.imports.join('\n')}
import {${componentName}Style, ${componentName}Script} from '../${STYLES_DIR}/soul/${fileNameOnly}';\n\n` +
        code;
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
        resolve(destPath, COMPONENTS_DIR, filePath),
        code
      );
      await this.fileService.createFile(
        resolve(
          destPath,
          COMPONENTS_DIR,
          filePath.replace('.ts', '.include.ts')
        ),
        codeWithDefine
      );
      await this.fileService.createFile(
        resolve(
          destPath,
          COMPONENTS_DIR,
          filePath.replace('.ts', '.bundle.ts')
        ),
        codeWithDefine
      );
    }

    /*
     * 4. Transpile components
     */
    const outComponentsPaths = (
      await this.fileService.listDir(resolve(destPath, COMPONENTS_DIR))
    ).filter(path => !path.endsWith('.bundle.ts'));
    await this.typescriptService.transpileAndOutputFiles(
      outComponentsPaths,
      TS_CONFIG,
      `${destPath}/${COMPONENTS_DIR}`,
      componentsPathProcessor
    );

    /*
     * 5. Extract base .ts into .css
     */
    const basePaths = (
      await this.fileService.listDir(resolve(STYLES_DIR, soulName, 'base'))
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
        resolve(destPath, STYLES_DIR, 'base', fileName.replace('.ts', '.css')),
        cssContent
      );
    }

    /*
     * 6. Skin utils/shorthands
     */
    await this.fileService.createFile(
      resolve(destPath, STYLES_DIR, 'skin-utils.css'),
      this.uiService.skinUtils
    );
    await this.fileService.createFile(
      resolve(destPath, STYLES_DIR, 'skin-shorthands.css'),
      this.uiService.skinShorthands
    );
  }
}
