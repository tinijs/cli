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

interface ColorDef {
  base: string;
  contrast: string;
  shade: string;
  tint: string;
}

interface GradientDef extends ColorDef {
  color: string;
}

enum CommonColorsNames {
  Gray = 'gray',
  Zinc = 'zinc',
  Brown = 'brown',
  Amber = 'amber',
  Yellow = 'yellow',
  Orange = 'orange',
  Lime = 'lime',
  Green = 'green',
  Teal = 'teal',
  Cyan = 'cyan',
  Blue = 'blue',
  Navy = 'navy',
  Indigo = 'indigo',
  Violet = 'violet',
  Purple = 'purple',
  Pink = 'pink',
  Red = 'red',
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

  private readonly COMMON_COLORS_MAP = {
    [CommonColorsNames.Gray]: {
      base: '#b5bed9',
      contrast: '#000000',
      shade: '#a3aed0',
      tint: '#c9d0e3',
    },
    [CommonColorsNames.Zinc]: {
      base: '#71717a',
      contrast: '#ffffff',
      shade: '#52525b',
      tint: '#a1a1aa',
    },
    [CommonColorsNames.Brown]: {
      base: '#795c34',
      contrast: '#ffffff',
      shade: '#4b371c',
      tint: '#9a7b4f',
    },
    [CommonColorsNames.Amber]: {
      base: '#fbbf24',
      contrast: '#000000',
      shade: '#f59e0b',
      tint: '#fcd34d',
    },
    [CommonColorsNames.Yellow]: {
      base: '#fbcf33',
      contrast: '#000000',
      shade: '#eab308',
      tint: '#fde047',
    },
    [CommonColorsNames.Orange]: {
      base: '#fb923c',
      contrast: '#ffffff',
      shade: '#f97316',
      tint: '#fdba74',
    },
    [CommonColorsNames.Lime]: {
      base: '#98ec2d',
      contrast: '#000000',
      shade: '#82d616',
      tint: '#bef264',
    },
    [CommonColorsNames.Green]: {
      base: '#4ade80',
      contrast: '#ffffff',
      shade: '#22c55e',
      tint: '#86efac',
    },
    [CommonColorsNames.Teal]: {
      base: '#2dd4bf',
      contrast: '#ffffff',
      shade: '#14b8a6',
      tint: '#5eead4',
    },
    [CommonColorsNames.Cyan]: {
      base: '#21d4fd',
      contrast: '#000000',
      shade: '#17c1e8',
      tint: '#67e8f9',
    },
    [CommonColorsNames.Blue]: {
      base: '#42a5f5',
      contrast: '#ffffff',
      shade: '#2196f3',
      tint: '#64b5f6',
    },
    [CommonColorsNames.Navy]: {
      base: '#1b3bbb',
      contrast: '#ffffff',
      shade: '#24388a',
      tint: '#3652ba',
    },
    [CommonColorsNames.Indigo]: {
      base: '#818cf8',
      contrast: '#ffffff',
      shade: '#6366f1',
      tint: '#a5b4fc',
    },
    [CommonColorsNames.Violet]: {
      base: '#422afb',
      contrast: '#ffffff',
      shade: '#3311db',
      tint: '#7551ff',
    },
    [CommonColorsNames.Purple]: {
      base: '#c084fc',
      contrast: '#ffffff',
      shade: '#a855f7',
      tint: '#d8b4fe',
    },
    [CommonColorsNames.Pink]: {
      base: '#f472b6',
      contrast: '#ffffff',
      shade: '#ff0080',
      tint: '#f9a8d4',
    },
    [CommonColorsNames.Red]: {
      base: '#f87171',
      contrast: '#ffffff',
      shade: '#f53939',
      tint: '#fca5a5',
    },
  } as Record<string, ColorDef>;

  private readonly COMMON_GRADIENTS_MAP = {
    'vital-ocean': {
      color: CommonColorsNames.Blue,
      base: 'linear-gradient(90deg, #1CB5E0 0%, #000851 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #0d93b8 0%, #00031e 100%)',
      tint: 'linear-gradient(90deg, #31cdf8 0%, #051181 100%)',
    },
    'kale-salad': {
      color: CommonColorsNames.Teal,
      base: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
      contrast: 'linear-gradient(60deg, #29323c 0%, #485563 100%)',
      shade: 'linear-gradient(90deg, #0098c2 0%, #68c972 100%)',
      tint: 'linear-gradient(90deg, #14c6f7 0%, #a5faae 100%)',
    },
    'disco-club': {
      color: CommonColorsNames.Pink,
      base: 'linear-gradient(90deg, #FC466B 0%, #3F5EFB 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #d43151 0%, #2a46d2 100%)',
      tint: 'linear-gradient(90deg, #fb5a7a 0%, #5570f8 100%)',
    },
    'shady-lane': {
      color: CommonColorsNames.Indigo,
      base: 'linear-gradient(90deg, #3F2B96 0%, #A8C0FF 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #291a6c 0%, #7f97d4 100%)',
      tint: 'linear-gradient(90deg, #5741bb 0%, #bbcdfb 100%)',
    },
    'retro-wagon': {
      color: CommonColorsNames.Lime,
      base: 'linear-gradient(90deg, #FDBB2D 0%, #22C1C3 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #d39819 0%, #119194 100%)',
      tint: 'linear-gradient(90deg, #fac044 0%, #3be3e6 100%)',
    },
    'fresco-crush': {
      color: CommonColorsNames.Brown,
      base: 'linear-gradient(90deg, #FDBB2D 0%, #3A1C71 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #ce9416 0%, #210d47 100%)',
      tint: 'linear-gradient(90deg, #fdc345 0%, #533094 100%)',
    },
    'cucumber-water': {
      color: CommonColorsNames.Gray,
      base: 'linear-gradient(90deg, #e3ffe7 0%, #d9e7ff 100%)',
      contrast: 'linear-gradient(60deg, #29323c 0%, #485563 100%)',
      shade: 'linear-gradient(90deg, #b0d7b6 0%, #a3b5d2 100%)',
      tint: 'linear-gradient(90deg, #f2fbf3 0%, #eaf0fb 100%)',
    },
    'sea-salt': {
      color: CommonColorsNames.Navy,
      base: 'linear-gradient(90deg, #4b6cb7 0%, #182848 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #2f4b8f 0%, #091224 100%)',
      tint: 'linear-gradient(90deg, #698ad6 0%, #304672 100%)',
    },
    'par-four': {
      color: CommonColorsNames.Green,
      base: 'linear-gradient(90deg, #9ebd13 0%, #008552 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #789205 0%, #00472c 100%)',
      tint: 'linear-gradient(90deg, #bbdc28 0%, #0bc57d 100%)',
    },
    'ooey-gooey': {
      color: CommonColorsNames.Blue,
      base: 'linear-gradient(90deg, #0700b8 0%, #00ff88 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #04006e 0%, #00af5e 100%)',
      tint: 'linear-gradient(90deg, #140dec 0%, #17fa90 100%)',
    },
    'bloody-mimosa': {
      color: CommonColorsNames.Red,
      base: 'linear-gradient(90deg, #d53369 0%, #daae51 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #a41b49 0%, #ad8631 100%)',
      tint: 'linear-gradient(90deg, #f85189 0%, #facf72 100%)',
    },
    'lovely-lilly': {
      color: CommonColorsNames.Indigo,
      base: 'linear-gradient(90deg, #efd5ff 0%, #515ada 100%)',
      contrast: 'linear-gradient(60deg, #29323c 0%, #485563 100%)',
      shade: 'linear-gradient(90deg, #c0a1d3 0%, #343cb2 100%)',
      tint: 'linear-gradient(90deg, #f6e8fe 0%, #727af6 100%)',
    },
    'aqua-spray': {
      color: CommonColorsNames.Blue,
      base: 'linear-gradient(90deg, #00d2ff 0%, #3a47d5 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(90deg, #0091b1 0%, #202ba7 100%)',
      tint: 'linear-gradient(90deg, #1ad2fb 0%, #5e6bf9 100%)',
    },
    'mello-yellow': {
      color: CommonColorsNames.Lime,
      base: 'linear-gradient(90deg, #f8ff00 0%, #3ad59f 100%)',
      contrast: 'linear-gradient(60deg, #29323c 0%, #485563 100%)',
      shade: 'linear-gradient(90deg, #a5aa01 0%, #1fa173 100%)',
      tint: 'linear-gradient(90deg, #f7ff1c 0%, #5ffac4 100%)',
    },
    'dusty-cactus': {
      color: CommonColorsNames.Yellow,
      base: 'linear-gradient(90deg, #fcff9e 0%, #c67700 100%)',
      contrast: 'linear-gradient(60deg, #29323c 0%, #485563 100%)',
      shade: 'linear-gradient(90deg, #cbce6d 0%, #774700 100%)',
      tint: 'linear-gradient(90deg, #fdffb8 0%, #fea115 100%)',
    },
    'premium-dark': {
      color: CommonColorsNames.Zinc,
      base: 'linear-gradient(to right, #434343 0%, black 100%)',
      contrast: 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)',
      shade: 'linear-gradient(to right, #272424 0%, black 100%)',
      tint: 'linear-gradient(to right, #767676 0%, #272424 100%)',
    },
    'perfect-white': {
      color: CommonColorsNames.Gray,
      base: 'linear-gradient(-225deg, #E3FDF5 0%, #FFE6FA 100%)',
      contrast: 'linear-gradient(60deg, #29323c 0%, #485563 100%)',
      shade: 'linear-gradient(-225deg, #afd0c6 0%, #d0b2ca 100%)',
      tint: 'linear-gradient(-225deg, #f5fcfa 0%, #fbf5fa 100%)',
    },
  } as Record<string, GradientDef>;

  private readonly SCALES = [
    '--scale-xxxs',
    '--scale-xxs',
    '--scale-xs',
    '--scale-ss',
    '--scale-sm',
    '--scale-md',
    '--scale-ml',
    '--scale-lg',
    '--scale-sl',
    '--scale-xl',
    '--scale-xxl',
    '--scale-xxxl',
  ];

  private readonly FACTORS = [
    0, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1, 1.25, 1.5,
    1.75, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  ];

  private readonly OUTLINES_MAP = {
    zero: 0,
    tiny: 0.25,
    small: 0.5,
    base: 1,
    big: 2,
    huge: 2.5,
    massive: 3,
  } as Record<string, number>;

  private readonly BORDERS_MAP = this.OUTLINES_MAP;

  private readonly RADIUSES_MAP = {
    ...this.OUTLINES_MAP,
    quarter: '25%',
    half: '50%',
    'three-quarters': '75%',
    full: '100%',
    max: '100vmax',
  } as Record<string, string | number>;

  get cssUtils() {
    const commonColorUtils = this.commonColorUtilGenerator();
    const commonGradientUtils = this.commonGradientUtilGenerator();
    const scalesUtils = this.factorUtilGenerator(this.SCALES);
    const sizeTextUtils = this.factorUtilGenerator(['--size-text']);
    const sizeSpaceUtils = this.factorUtilGenerator(['--size-space']);
    const sizeOutlineUtils = this.outlineUtilGenerator();
    const sizeBorderUtils = this.borderUtilGenerator();
    const sizeRadiusUtils = this.radiusUtilGenerator();
    const shadowUtils = '--shadow-none: none;';
    return `
[data-theme] {
  ${commonColorUtils}
  ${commonGradientUtils}
  ${scalesUtils}
  ${sizeTextUtils}
  ${sizeSpaceUtils}
  ${sizeOutlineUtils}
  ${sizeBorderUtils}
  ${sizeRadiusUtils}
  ${shadowUtils}
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

  private factorUtilGenerator(keys: string[]) {
    return keys
      .map(key =>
        this.FACTORS.map(
          factor =>
            `${key}-${factor
              .toString()
              .replace(/\.|\,/g, '_')}x: calc(var(${key}) * ${factor});`
        ).join('\n  ')
      )
      .join('\n  ');
  }

  private borderUtilGenerator() {
    return Object.keys(this.BORDERS_MAP)
      .map(
        name =>
          `--size-border-${name}: calc(var(--size-border) * ${this.BORDERS_MAP[name]});`
      )
      .join('\n  ');
  }

  private outlineUtilGenerator() {
    return Object.keys(this.OUTLINES_MAP)
      .map(
        name =>
          `--size-outline-${name}: calc(var(--size-outline) * ${this.OUTLINES_MAP[name]});`
      )
      .join('\n  ');
  }

  private radiusUtilGenerator() {
    return Object.keys(this.RADIUSES_MAP)
      .map(name => {
        const value =
          typeof this.RADIUSES_MAP[name] === 'string'
            ? (this.RADIUSES_MAP[name] as string)
            : `calc(var(--size-radius) * ${this.RADIUSES_MAP[name]})`;
        return `--size-radius-${name}: ${value};`;
      })
      .join('\n  ');
  }

  private commonColorUtilGenerator() {
    return Object.keys(this.COMMON_COLORS_MAP)
      .map(name => {
        const color = this.COMMON_COLORS_MAP[name];
        return `--color-${name}: ${color.base};
  --color-${name}-contrast: ${color.contrast};
  --color-${name}-shade: ${color.shade};
  --color-${name}-tint: ${color.tint};`;
      })
      .join('\n  ');
  }

  private commonGradientUtilGenerator() {
    return Object.keys(this.COMMON_GRADIENTS_MAP)
      .map(name => {
        const gradient = this.COMMON_GRADIENTS_MAP[name];
        return `--color-${name}: var(--color-${gradient.color});
  --color-${name}-contrast: var(--color-${gradient.color}-contrast);
  --gradient-${name}: ${gradient.base};
  --gradient-${name}-contrast: ${gradient.contrast};
  --gradient-${name}-shade: ${gradient.shade};
  --gradient-${name}-tint: ${gradient.tint};`;
      })
      .join('\n  ');
  }

  get iconTemplate() {
    return `import {html, css, PropertyValues} from 'lit';
import {property} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {styleMap} from 'lit/directives/style-map.js';
import {TiniElement, partMap, PartInfo, VaryGroups, generateColorVaries, generateGradientVaries, generateScaleVaries} from 'tinijs';
export class IconComponent extends TiniElement {
  static readonly defaultTagName = ICON;
  static styles = css\`:host{--icon-width:var(--scale-md-2x);--icon-height:var(--scale-md-2x);--icon-scheme:none;--icon-image:url('icon.svg');display:inline-block}i{display:flex;align-items:center;justify-content:center;background-image:var(--icon-image);background-repeat:no-repeat;background-size:contain;background-position:center;width:var(--icon-width);height:var(--icon-height)}.scheme{background:var(--icon-scheme);-webkit-mask-image:var(--icon-image);-webkit-mask-size:var(--icon-width) var(--icon-height);-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;mask-image:var(--icon-image);mask-size:var(--icon-width) var(--icon-height);mask-repeat:no-repeat;mask-position:center}\${generateColorVaries(({fullName, color}) => \`.\${fullName} {--icon-scheme: \${color};}\`)}\${generateGradientVaries(({fullName, gradient}) => \`.\${fullName} {--icon-scheme: \${gradient};}\`)}\${generateScaleVaries(({name, fullName}) => \`.\${fullName} {--icon-width: var(--scale-\${name}-2x);--icon-height: var(--scale-\${name}-2x);}\`)}\`;
  @property({type: String, reflect: true}) declare scale?: string;
  @property({type: String, reflect: true}) declare scheme?: string;
  willUpdate(changedValues: PropertyValues) { super.willUpdate(changedValues); this.extendRootClassesParts({scheme: !!this.scheme, [\`\${VaryGroups.Scale}-\${this.scale}\`]: !!this.scale, [\`\${VaryGroups.Scheme}-\${this.scheme}\`]: !!this.scheme}); }
  protected render() { return html\`<i part=\${partMap(this.rootClassesParts)} class=\${classMap(this.rootClassesParts)} style=\${styleMap(this.rootStyles)}></i>\`; }
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
    const content = `${imports.join('\n')}\n${this.cssUtils}`;
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
    // check input dir
    const inputPath = resolve(inputDir);
    if (!(await this.fileService.exists(inputPath))) return;

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
        }} from 'tinijs';\n\n` + code;
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
  }
}
