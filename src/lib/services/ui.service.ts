import {readdir} from 'fs-extra';
import {ModuleKind, ScriptTarget} from 'typescript';
import {resolve} from 'path';
import {camelCase, capitalCase} from 'change-case';

import {FileService} from './file.service';
import {TypescriptService} from './typescript.service';

export interface SoulAndSkins {
  soul: string;
  skins: string[];
}

export class UiService {
  public readonly COMPONENTS_DIR = 'components';
  public readonly BLOCKS_DIR = 'blocks';
  public readonly STYLES_DIR = 'styles';
  public readonly TS_CONFIG = {
    declaration: true,
    sourceMap: true,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
    experimentalDecorators: true,
    useDefineForClassFields: false,
  };

  constructor(
    private fileService: FileService,
    private typescriptService: TypescriptService
  ) {}

  private readonly SIZES = [
    '--size-xxxs',
    '--size-xxs',
    '--size-xs',
    '--size-ss',
    '--size-sm',
    '--size-md',
    '--size-ml',
    '--size-lg',
    '--size-sl',
    '--size-xl',
    '--size-xxl',
    '--size-xxxl',
  ];
  private readonly COLORS = [
    '--color-primary',
    '--color-secondary',
    '--color-tertiary',
    '--color-success',
    '--color-warning',
    '--color-danger',
    '--color-dark',
    '--color-medium',
    '--color-light',
    '--color-background',
    '--color-middleground',
    '--color-foreground',
  ];
  private readonly COMMON_SIZE_FACTORS = [
    0, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1, 1.25, 1.5,
    1.75, 2, 3, 4, 5,
  ];
  private readonly EXTRA_SIZE_FACTORS = [6, 7, 8, 9, 10];

  get skinUtils() {
    const sizeTextUtils = this.sizeUtilGenerator(
      ['--size-text'],
      [...this.COMMON_SIZE_FACTORS, ...this.EXTRA_SIZE_FACTORS]
    );
    const sizeRadiusUtils = this.sizeUtilGenerator(
      ['--size-radius'],
      this.COMMON_SIZE_FACTORS
    );
    const sizeBorderUtils = this.sizeUtilGenerator(
      ['--size-border'],
      this.COMMON_SIZE_FACTORS
    );
    const sizeOutlineUtils = this.sizeUtilGenerator(
      ['--size-outline'],
      this.COMMON_SIZE_FACTORS
    );
    const sizeSpaceUtils = this.sizeUtilGenerator(
      ['--size-space'],
      [...this.COMMON_SIZE_FACTORS, ...this.EXTRA_SIZE_FACTORS]
    );
    const sizeStepsUtils = this.sizeUtilGenerator(
      this.SIZES,
      this.COMMON_SIZE_FACTORS
    );
    const shadeTintColorUtils = this.shadeTintUtilGenerator(
      this.COLORS,
      [90, 80, 70, 60]
    );
    return `
[data-theme] {
  ${sizeTextUtils}
  ${sizeRadiusUtils}
  ${sizeBorderUtils}
  ${sizeOutlineUtils}
  ${sizeSpaceUtils}
  ${sizeStepsUtils}
  ${shadeTintColorUtils}
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -webkit-text-size-adjust: 100%;
  font-family: var(--font-body);
  font-size: var(--size-text);
  background: var(--color-background);
  color: var(--color-foreground);
}
`;
  }

  private sizeUtilGenerator(keys: string[], sizes: number[]) {
    return keys
      .map(key =>
        sizes
          .map(
            size =>
              `${key}-${size
                .toString()
                .replace(/\.|\,/g, '_')}x: calc(var(${key}) * ${size});`
          )
          .join('\n  ')
      )
      .join('\n  ');
  }

  private shadeTintUtilGenerator(liteKeys: string[], shades: number[]) {
    return ['shade', 'tint'].reduce((result, kind) => {
      const group = liteKeys
        .map(liteKey => {
          const key = `${liteKey}-${kind}`;
          return shades
            .map(
              (shade, i) =>
                `${key}-${i + 2}: color-mix(in oklab, var(${key}) ${shade}%, ${
                  kind === 'shade' ? 'black' : 'white'
                });`
            )
            .join('\n  ');
        })
        .join('\n  ');
      result += group + '\n  ';
      return result;
    }, '' as string);
  }

  get iconTemplate() {
    return `import {LitElement, html, css} from 'lit';
import {property} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {generateColorVaries, generateGradientVaries, generateSizeVaries} from '@tinijs/core';
export const ICON = 'icon';
export class IconComponent extends LitElement {
  static readonly defaultTagName = ICON;
  static styles = css\`:host{--icon-width:var(--size-md-2x);--icon-height:var(--size-md-2x);--icon-color:none;--icon-image:url('icon.svg');display:inline-block}i{display:flex;align-items:center;justify-content:center;background-image:var(--icon-image);background-repeat:no-repeat;background-size:contain;background-position:center;width:var(--icon-width);height:var(--icon-height)}.recolor{background:var(--icon-color);-webkit-mask-image:var(--icon-image);-webkit-mask-size:var(--icon-width) var(--icon-height);-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;mask-image:var(--icon-image);mask-size:var(--icon-width) var(--icon-height);mask-repeat:no-repeat;mask-position:center}\${generateColorVaries(({name, color}) => \`.\${name} {--icon-color: \${color};}\`)}\${generateGradientVaries(({name, gradient}) => \`.gradient-\${name} {--icon-color: \${gradient};}\`)\}\${generateSizeVaries(size => \`.\${size} {--icon-width: var(--size-\${size}-2x);--icon-height: var(--size-\${size}-2x);}\`)}
  \`;
  @property({type: String}) declare readonly size?: string;
  @property({type: String}) declare readonly color?: string;
  protected render() { return html\`<i part="icon" class=\${classMap({ recolor: !!this.color, [this.color as string]: !!this.color, [this.size as string]: !!this.size })}></i>\`; }
}
    `;
  }

  get iconPreviewHTMLTemplate() {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tini Icons Preview</title>
    <script type="module" src="___preview.app.ts"></script>
    <style>
      :root {
        --size-md-2x: 32px;
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

  get iconPreviewTSTemplate() {
    return `import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';

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

  async savePublicApi(destPath: string, publicPaths: string[]) {
    const tsPath = resolve(destPath, 'public-api.ts');
    // .ts
    await this.fileService.createFile(
      tsPath,
      publicPaths.map(path => `export * from '${path}';`).join('\n')
    );
    // .d.ts, js, js.map
    await this.typescriptService.transpileAndOutputFiles(
      [tsPath],
      this.TS_CONFIG,
      destPath,
      path => path.split('/').pop() as string
    );
  }

  async devAndUseCopyGlobalFiles(destPath: string, isDev = false) {}

  async devAndUseBuildSkins(
    destPath: string,
    soulAndSkinsList: SoulAndSkins[],
    isDev = false
  ) {
    const imports: string[] = [];
    for (let i = 0; i < soulAndSkinsList.length; i++) {
      const {soul, skins} = soulAndSkinsList[i];
      skins.forEach(skin => {
        const importPath = isDev
          ? `../styles/${soul}/skins/${skin}.css`
          : `../ui-${soul}/${this.STYLES_DIR}/skins/${skin}.css`;
        imports.push(`@import '${importPath}';`);
      });
    }
    const content = `${imports.join('\n')}\n${this.skinUtils}`;
    await this.fileService.createFile(resolve(destPath, 'skins.css'), content);
  }

  async devAndUseBuildBases(
    samplingPath: string,
    destPath: string,
    souls: string[],
    isDev = false
  ) {
    const baseNames = (await readdir(resolve(samplingPath)))
      .filter(item => item.endsWith('.ts'))
      .map(item => item.replace(/\.ts|\.d\.ts/g, ''));
    const importArr: string[] = [];
    const exportArr: string[] = [];
    for (let i = 0; i < baseNames.length; i++) {
      const baseName = baseNames[i];
      const baseNameCapital = capitalCase(baseName.replace(/\-|\./g, ' '));
      const baseNameCamel = camelCase(baseNameCapital);
      const baseExports = {} as Record<string, string>;
      for (let j = 0; j < souls.length; j++) {
        const soulName = souls[j];
        const soulNameCamel = camelCase(soulName.replace(/\-|\./g, ' '));
        const importName = `${soulNameCamel}${baseNameCapital}Base`;
        const importPath = isDev
          ? `../${this.STYLES_DIR}/${soulName}/base/${baseName}`
          : `../ui-${soulName}/${this.STYLES_DIR}/base/${baseName}`;
        importArr.push(`import ${importName} from '${importPath}';`);
        baseExports[soulName] = importName;
      }
      exportArr.push(
        `export const ${baseNameCamel}Bases = ${JSON.stringify(
          baseExports
        ).replace(/\"/g, '')};`
      );
    }
    // save bases.ts
    const fileName = 'bases.ts';
    const basesOutPath = resolve(destPath, fileName);
    await this.fileService.createFile(
      basesOutPath,
      `${importArr.join('\n')}\n\n${exportArr.join('\n')}`
    );
    // transpile bases.ts
    await this.typescriptService.transpileAndOutputFiles(
      [basesOutPath],
      this.TS_CONFIG,
      destPath,
      path => path.split('/').pop() as string
    );
    // public path
    return `./${fileName.replace('.ts', '')}`;
  }

  async devAndUseBuildComponents(
    inputDir: string,
    destPath: string,
    souls: string[],
    isDev = false
  ) {
    const publicPaths: string[] = [];

    // check input dir
    const inputPath = resolve(inputDir);
    if (!(await this.fileService.exists(inputPath))) return publicPaths;

    /*
     * A. Build
     */
    const outputDir = isDev ? inputDir : (inputDir.split('/').pop() as string);
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
      const componentName = camelCase(fileNameOnly.replace(/\-/g, ' '));
      const componentNameCapital = capitalCase(componentName);
      // read file
      let code = await this.fileService.readText(path);
      const useBasesMatching = code.match(/\/\* UseBases\(([\s\S]*?)\) \*\//);
      const useComponentsMatching = code.match(
        /\/\* UseComponents\(([\s\S]*?)\) \*\//
      );
      // base imports
      const useBasesContents = (!useBasesMatching ? '' : useBasesMatching[1])
        .split(',')
        .reduce(
          (result, item) => {
            const name = item.trim();
            const nameCapital = capitalCase(name.replace(/\-|\./g, ' '));
            if (name) {
              souls.forEach(soul => {
                const importPath = isDev
                  ? `../../${this.STYLES_DIR}/${soul}/base/${name}`
                  : `../../ui-${soul}/${this.STYLES_DIR}/base/${name}`;
                result.imports.push(
                  `import ${soul}${nameCapital}Base from '${importPath}';`
                );
                result.styling[soul] ||= [];
                result.styling[soul].push(`${soul}${nameCapital}Base`);
              });
            }
            return result;
          },
          {
            imports: [] as string[],
            styling: {} as Record<string, string[]>,
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
      // soul imports
      const soulContents = souls.reduce(
        (result, soul) => {
          const importPath = isDev
            ? `../../${this.STYLES_DIR}/${soul}/soul/${componentName}`
            : `../../ui-${soul}/${this.STYLES_DIR}/soul/${componentName}`;
          result.imports.push(
            `import {${componentName}Style as ${soul}${componentNameCapital}Style, ${componentName}Script as ${soul}${componentNameCapital}Script, ${componentName}Unscript as ${soul}${componentNameCapital}Unscript} from '${importPath}';`
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
      if (useBasesMatching) {
        code = code.replace(`${useBasesMatching[0]}\n`, '');
      }
      if (useComponentsMatching) {
        code = code.replace(`${useComponentsMatching[0]}\n`, '');
      }
      code = code.replace(
        /(\.\.\/styles\/([\s\S]*?)\/)|(\.\.\/styles\/)/g,
        '../'
      );
      // imports
      code =
        `
${useBasesContents.imports.join('\n')}
${useComponentsContents.imports.join('\n')}
${soulContents.imports.join('\n')}
import {Theming${
          !useComponentsMatching ? '' : ', Components'
        }} from '@tinijs/core';\n\n` + code;
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
      const styling = souls.reduce(
        (result, soul) => {
          result[soul] = [
            ...useBasesContents.styling[soul],
            soulContents.styling[soul],
          ];
          return result;
        },
        {} as Record<string, string[]>
      );
      code = code.replace(
        'export class ',
        `@Theming({
  styling: ${JSON.stringify(styling).replace(/\"/g, '')},
  scripting: ${JSON.stringify(soulContents.scripting).replace(/\"/g, '')},
})
export class `
      );
      // save file
      await this.fileService.createFile(
        resolve(destPath, outputDir, filePath),
        code
      );
      // public path
      publicPaths.push(`./${outputDir}/${filePath.replace('.ts', '')}`);
    }

    /*
     * B. Transpile
     */
    if (componentPaths.length) {
      const outComponentsPaths = (
        await this.fileService.listDir(resolve(destPath, outputDir))
      ).filter(path => path.endsWith('.ts') && !path.endsWith('.d.ts'));
      await this.typescriptService.transpileAndOutputFiles(
        outComponentsPaths,
        this.TS_CONFIG,
        `${destPath}/${outputDir}`,
        path => path.split(`/${outputDir}/`).pop() as string
      );
    }

    // result
    return publicPaths;
  }
}
