export class UiService {
  constructor() {}

  get skinUtils() {
    const sizeTextUtils = this.sizeUtilGenerator(
      '--size-text',
      [
        0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.25, 1.5, 1.75, 2,
        2.5, 3, 4, 5, 6, 7, 8, 9, 10,
      ]
    );
    const sizeRadiusUtils = this.sizeUtilGenerator(
      '--size-radius',
      [0.5, 1.5, 2, 2.5, 3]
    );
    const sizeBorderUtils = this.sizeUtilGenerator(
      '--size-border',
      [0.5, 1.5, 2, 2.5, 3]
    );
    const sizeSpaceUtils = this.sizeUtilGenerator(
      '--size-space',
      [0.1, 0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10]
    );
    const rgbaColorUtils = this.rgbaUtilGenerator(
      [
        '--color-primary-rgb',
        '--color-primary-contrast-rgb',
        '--color-secondary-rgb',
        '--color-secondary-contrast-rgb',
        '--color-tertiary-rgb',
        '--color-tertiary-contrast-rgb',
        '--color-success-rgb',
        '--color-success-contrast-rgb',
        '--color-warning-rgb',
        '--color-warning-contrast-rgb',
        '--color-danger-rgb',
        '--color-danger-contrast-rgb',
        '--color-dark-rgb',
        '--color-dark-contrast-rgb',
        '--color-medium-rgb',
        '--color-medium-contrast-rgb',
        '--color-light-rgb',
        '--color-light-contrast-rgb',
        '--color-background-rgb',
        '--color-background-contrast-rgb',
        '--color-foreground-rgb',
        '--color-foreground-contrast-rgb',
      ],
      [0.05, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9]
    );
    return `
[data-theme] {
  ${sizeTextUtils}
  ${sizeRadiusUtils}
  ${sizeBorderUtils}
  ${sizeSpaceUtils}
  ${rgbaColorUtils}
}    
`;
  }

  get skinShorthands() {
    const fontShorthands = this.shorthandGenerator(
      ['f', 'font'],
      [
        ['h', 'head'],
        ['b', 'body'],
        ['q', 'quote'],
        ['c', 'code'],
      ]
    );
    const colorShorthands = this.shorthandGenerator(
      ['c', 'color'],
      [
        ['pr', 'primary'],
        ['pr-x', 'primary-rgb'],
        ['pr-c', 'primary-contrast'],
        ['pr-c-x', 'primary-contrast-rgb'],
        ['pr-s', 'primary-shade'],
        ['pr-t', 'primary-tint'],
        ['se', 'secondary'],
        ['se-x', 'secondary-rgb'],
        ['se-c', 'secondary-contrast'],
        ['se-c-x', 'secondary-contrast-rgb'],
        ['se-s', 'secondary-shade'],
        ['se-t', 'secondary-tint'],
        ['te', 'tertiary'],
        ['te-x', 'tertiary-rgb'],
        ['te-c', 'tertiary-contrast'],
        ['te-c-x', 'tertiary-contrast-rgb'],
        ['te-s', 'tertiary-shade'],
        ['te-t', 'tertiary-tint'],
        ['su', 'success'],
        ['su-x', 'success-rgb'],
        ['su-c', 'success-contrast'],
        ['su-c-x', 'success-contrast-rgb'],
        ['su-s', 'success-shade'],
        ['su-t', 'success-tint'],
        ['wa', 'warning'],
        ['wa-x', 'warning-rgb'],
        ['wa-c', 'warning-contrast'],
        ['wa-c-x', 'warning-contrast-rgb'],
        ['wa-s', 'warning-shade'],
        ['wa-t', 'warning-tint'],
        ['da', 'danger'],
        ['da-x', 'danger-rgb'],
        ['da-c', 'danger-contrast'],
        ['da-c-x', 'danger-contrast-rgb'],
        ['da-s', 'danger-shade'],
        ['da-t', 'danger-tint'],
        ['dk', 'dark'],
        ['dk-x', 'dark-rgb'],
        ['dk-c', 'dark-contrast'],
        ['dk-c-x', 'dark-contrast-rgb'],
        ['dk-s', 'dark-shade'],
        ['dk-t', 'dark-tint'],
        ['me', 'medium'],
        ['me-x', 'medium-rgb'],
        ['me-c', 'medium-contrast'],
        ['me-c-x', 'medium-contrast-rgb'],
        ['me-s', 'medium-shade'],
        ['me-t', 'medium-tint'],
        ['li', 'light'],
        ['li-x', 'light-rgb'],
        ['li-c', 'light-contrast'],
        ['li-c-x', 'light-contrast-rgb'],
        ['li-s', 'light-shade'],
        ['li-t', 'light-tint'],
        ['bg', 'background'],
        ['bg-x', 'background-rgb'],
        ['bg-c', 'background-contrast'],
        ['bg-c-x', 'background-contrast-rgb'],
        ['bg-s', 'background-shade'],
        ['bg-t', 'background-tint'],
        ['fg', 'foreground'],
        ['fg-x', 'foreground-rgb'],
        ['fg-c', 'foreground-contrast'],
        ['fg-c-x', 'foreground-contrast-rgb'],
        ['fg-s', 'foreground-shade'],
        ['fg-t', 'foreground-tint'],
      ]
    );
    const gradientShorthands = this.shorthandGenerator(
      ['g', 'gradient'],
      [
        ['pr', 'primary'],
        ['pr-c', 'primary-contrast'],
        ['pr-s', 'primary-shade'],
        ['pr-t', 'primary-tint'],
        ['se', 'secondary'],
        ['se-c', 'secondary-contrast'],
        ['se-s', 'secondary-shade'],
        ['se-t', 'secondary-tint'],
        ['te', 'tertiary'],
        ['te-c', 'tertiary-contrast'],
        ['te-s', 'tertiary-shade'],
        ['te-t', 'tertiary-tint'],
        ['su', 'success'],
        ['su-c', 'success-contrast'],
        ['su-s', 'success-shade'],
        ['su-t', 'success-tint'],
        ['wa', 'warning'],
        ['wa-c', 'warning-contrast'],
        ['wa-s', 'warning-shade'],
        ['wa-t', 'warning-tint'],
        ['da', 'danger'],
        ['da-c', 'danger-contrast'],
        ['da-s', 'danger-shade'],
        ['da-t', 'danger-tint'],
        ['dk', 'dark'],
        ['dk-c', 'dark-contrast'],
        ['dk-s', 'dark-shade'],
        ['dk-t', 'dark-tint'],
        ['me', 'medium'],
        ['me-c', 'medium-contrast'],
        ['me-s', 'medium-shade'],
        ['me-t', 'medium-tint'],
        ['li', 'light'],
        ['li-c', 'light-contrast'],
        ['li-s', 'light-shade'],
        ['li-t', 'light-tint'],
        ['bg', 'background'],
        ['bg-c', 'background-contrast'],
        ['bg-s', 'background-shade'],
        ['bg-t', 'background-tint'],
        ['fg', 'foreground'],
        ['fg-c', 'foreground-contrast'],
        ['fg-s', 'foreground-shade'],
        ['fg-t', 'foreground-tint'],
      ]
    );
    const sizeShorthands = this.shorthandGenerator(
      ['s', 'size'],
      [
        ['t', 'text'],
        ['r', 'radius'],
        ['b', 'border'],
        ['s', 'radius'],
        ['1', 'xxxs'],
        ['2', 'xxs'],
        ['3', 'xs'],
        ['4', 'sm'],
        ['5', 'ms'],
        ['6', 'md'],
        ['7', 'ml'],
        ['8', 'lg'],
        ['9', 'sl'],
        ['10', 'xl'],
        ['11', 'xxl'],
        ['12', 'xxxl'],
      ]
    );
    const wideShorthands = this.shorthandGenerator(
      ['w', 'wide'],
      [
        ['1', 'xxxs'],
        ['2', 'xxs'],
        ['3', 'xs'],
        ['4', 'sm'],
        ['5', 'ms'],
        ['6', 'md'],
        ['7', 'ml'],
        ['8', 'lg'],
        ['9', 'sl'],
        ['10', 'xl'],
        ['11', 'xxl'],
        ['12', 'xxxl'],
      ]
    );
    const otherShorthands = this.shorthandGenerator(
      ['b', 'box'],
      [['s', 'shadow']]
    );
    return `
[data-theme] {
  ${fontShorthands}
  ${colorShorthands}
  ${gradientShorthands}
  ${sizeShorthands}
  ${wideShorthands}
  ${otherShorthands}
}    
`;
  }

  private sizeUtilGenerator(key: string, sizes: number[]) {
    return sizes
      .map(
        size =>
          `${key}-${size
            .toString()
            .replace(/\.|\,/g, '_')}x: calc(var(${key}) * ${size});`
      )
      .join('\n  ');
  }

  private rgbaUtilGenerator(keys: string[], alphas: number[]) {
    return keys
      .map(key =>
        alphas
          .map(
            alpha =>
              `${key.replace(
                'rgb',
                (alpha * 100).toString()
              )}: rgba(var(${key}), ${alpha});`
          )
          .join('\n  ')
      )
      .join('\n  ');
  }

  private shorthandGenerator(
    prefixing: [string, string],
    items: Array<[string, string]>
  ) {
    const [shortPrefix, originalPrefix] = prefixing;
    return items
      .map(
        ([short, original]) =>
          `--${shortPrefix}-${short}: var(--${originalPrefix}-${original});`
      )
      .join('\n  ');
  }
}
