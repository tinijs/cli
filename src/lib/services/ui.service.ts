export class UiService {
  constructor() {}

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
    '--color-foreground',
  ];
  private readonly COMMON_SIZE_FACTORS = [
    0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.25, 1.5, 1.75, 2,
    3, 4, 5,
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
import {generateColorDynamicAndVaries, generateGradientDynamicAndVaries, generateSizeVaries} from '@tinijs/core';
export const ICON = 'icon';
export class IconComponent extends LitElement {
  static styles = css\`:host{--icon-width:var(--size-md-2x);--icon-height:var(--size-md-2x);--icon-color:none;--icon-image:url('icon.svg');display:inline-block}i{display:flex;align-items:center;justify-content:center;background-image:var(--icon-image);background-repeat:no-repeat;background-size:contain;background-position:center;width:var(--icon-width);height:var(--icon-height)}.recolor{background:var(--icon-color);-webkit-mask-image:var(--icon-image);-webkit-mask-size:var(--icon-width) var(--icon-height);-webkit-mask-repeat:no-repeat;-webkit-mask-position:center;mask-image:var(--icon-image);mask-size:var(--icon-width) var(--icon-height);mask-repeat:no-repeat;mask-position:center}\${generateColorDynamicAndVaries(({name, color}) => \`.\${name} {--icon-color: \${color};}\`)}\${generateGradientDynamicAndVaries(({name, gradient}) => \`.gradient-\${name} {--icon-color: \${gradient};}\`)\}\${generateSizeVaries(size => \`.\${size} {--icon-width: var(--size-\${size}-2x);--icon-height: var(--size-\${size}-2x);}\`)}
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
}
