import {readdir} from 'fs-extra';
import {resolve} from 'path';
import {camelCase, capitalCase} from 'change-case';

import {OK} from '../../lib/services/message.service';
import {FileService} from '../../lib/services/file.service';

import {COMPONENTS_DIR, STYLES_DIR} from './ui-build.command';

export class UiDevCommand {
  constructor(private fileService: FileService) {}

  async run() {
    const souls = (await readdir(resolve(STYLES_DIR))).filter(
      item => !~item.indexOf('.')
    );
    const destPath = resolve('dev');
    // copy global files
    this.copyGlobalFiles(destPath, souls[0]);
    // build skins
    await this.buildSkin(destPath, souls);
    // build components
    await this.buildComponents(destPath, souls);
    // result
    console.log(OK + 'Build ui package for developing!');
  }

  private async copyGlobalFiles(destPath: string, firstSoul: string) {
    await this.fileService.copyFile(
      resolve(STYLES_DIR, firstSoul, 'types.ts'),
      resolve(destPath, 'types.ts')
    );
  }

  private async buildSkin(destPath: string, souls: string[]) {
    const imports: string[] = [];
    for (let i = 0; i < souls.length; i++) {
      const soul = souls[i];
      const skins = (await readdir(resolve(STYLES_DIR, soul, 'skins'))).filter(
        item => item.endsWith('.scss')
      );
      skins.forEach(skin =>
        imports.push(`@import '../styles/${soul}/skins/${skin}';`)
      );
    }
    await this.fileService.createFile(
      resolve(destPath, 'skins.scss'),
      imports.join('\n')
    );
  }

  private async buildComponents(destPath: string, souls: string[]) {
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
      const componentNameCapital = capitalCase(componentName);
      // read file
      let code = await this.fileService.readText(path);
      const useBaseMatching = code.match(/\/\* UseBase\(([\s\S]*?)\) \*\//);
      // base imports
      const useBaseContents = (!useBaseMatching ? '' : useBaseMatching[1])
        .split(',')
        .reduce(
          (result, item) => {
            const name = item.trim();
            const nameCapital = capitalCase(name);
            if (name) {
              souls.forEach(soul => {
                result.imports.push(
                  `import ${soul}${nameCapital}Style from '../${STYLES_DIR}/${soul}/base/${name}';`
                );
                result.styling[soul] ||= [];
                result.styling[soul].push(`${soul}${nameCapital}Style`);
              });
            }
            return result;
          },
          {
            imports: [] as string[],
            styling: {} as Record<string, string[]>,
          }
        );
      // soul imports
      const soulContents = souls.reduce(
        (result, soul) => {
          result.imports.push(
            `import {${componentName}Style as ${soul}${componentNameCapital}Style, ${componentName}Script as ${soul}${componentNameCapital}Script, ${componentName}Unscript as ${soul}${componentNameCapital}Unscript} from '../${STYLES_DIR}/${soul}/soul/${componentName}';`
          );
          result.styling[soul] = `${soul}${componentNameCapital}Style`;
          result.scripting[soul] = {
            script: `${soul}${componentNameCapital}Script`,
            unscript: `${soul}${componentNameCapital}Unscript`,
          };
          return result;
        },
        {
          imports: [] as string[],
          styling: {} as Record<string, string>,
          scripting: {} as Record<string, any>,
        }
      );
      // build content
      if (useBaseMatching) code = code.replace(`${useBaseMatching[0]}\n`, '');
      code = code.replace(
        /(\.\.\/styles\/([\s\S]*?)\/)|(\.\.\/styles\/)/g,
        './'
      );
      code =
        `${useBaseContents.imports.join('\n')}
${soulContents.imports.join('\n')}
import {Theming} from '../app/vendors/theming';\n\n` + code;
      const styling = souls.reduce((result, soul) => {
        result[soul] = [
          ...useBaseContents.styling[soul],
          soulContents.styling[soul],
        ];
        return result;
      }, {} as Record<string, string[]>);
      code = code.replace(
        'export class ',
        `@Theming({
  styling: ${JSON.stringify(styling).replace(/\"/g, '')},
  scripting: ${JSON.stringify(soulContents.scripting).replace(/\"/g, '')},
})
export class `
      );
      await this.fileService.createFile(resolve(destPath, filePath), code);
    }
  }
}
