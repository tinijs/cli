import {ModuleKind, ScriptTarget} from 'typescript';
import {compileString} from 'sass';
import {resolve} from 'path';
import {camelCase} from 'change-case';
const CleanCSS = require('clean-css');

import {OK} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';
import {TerminalService} from '../../lib/services/terminal.service';
import {ProjectService} from '../../lib/services/project.service';
import {TypescriptService} from '../../lib/services/typescript.service';

const COMPONENTS_DIR = 'components';
const STYLES_DIR = 'styles';
const UI_PACKAGE_NAME = '@tinijs/ui';

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
     * 2. scss
     */

    const scssPaths = paths.filter(path => path.endsWith('.scss'));
    for (let i = 0; i < scssPaths.length; i++) {
      const path = scssPaths[i];
      const filePath = stylesPathProcessor(path);
      // dir
      const dirPaths = filePath.split('/');
      dirPaths.pop();
      await this.fileService.createDir(
        resolve(destPath, STYLES_DIR, ...dirPaths)
      );
      // .css & .css.map
      const content = await this.fileService.readText(path);
      const {css} = compileString(content, {
        sourceMap: true,
        loadPaths: [resolve(STYLES_DIR, soulName, ...dirPaths)],
      });
      await this.fileService.createFile(
        resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.css')),
        css
      );
      // TODO: fix sourceMap
      // await this.fileService.createFile(
      //   resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.css.map')),
      //   sourceMap?.mappings || ''
      // );
      // .min.css & .min.css.map
      const {styles} = new CleanCSS({sourceMap: true}).minify(css);
      await this.fileService.createFile(
        resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.min.css')),
        styles
      );
      // TODO: fix sourceMap
      // await this.fileService.createFile(
      //   resolve(destPath, STYLES_DIR, filePath.replace('.scss', '.min.css.map')),
      //   minSourceMap?.mappings || ''
      // );
      // .scss
      await this.fileService.copyFile(
        path,
        resolve(destPath, STYLES_DIR, filePath)
      );
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
              result.styles.push(`${name}Style`);
              result.imports.push(
                `import ${name}Style from '../${STYLES_DIR}/base/${name}';`
              );
            }
            return result;
          },
          {
            styles: [] as string[],
            imports: [] as string[],
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
      await this.fileService.createFile(
        resolve(destPath, COMPONENTS_DIR, filePath),
        code
      );
    }

    /*
     * 4. Transpile components
     */
    const outComponentsPaths = await this.fileService.listDir(
      resolve(destPath, COMPONENTS_DIR)
    );
    await this.typescriptService.transpileAndOutputFiles(
      outComponentsPaths,
      TS_CONFIG,
      `${destPath}/${COMPONENTS_DIR}`,
      componentsPathProcessor
    );
  }
}
