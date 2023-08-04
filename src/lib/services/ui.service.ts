export class UiService {
  constructor() {}

  get skinUtils() {
    const sizeTextUtils = this.sizeUtilGenerator(
      ['--size-text'],
      [
        0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.25, 1.5,
        1.75, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10,
      ]
    );
    const sizeRadiusUtils = this.sizeUtilGenerator(
      ['--size-radius'],
      [0.25, 0.5, 0.75, 1.5, 2, 2.5, 3, 4, 5]
    );
    const sizeBorderUtils = this.sizeUtilGenerator(
      ['--size-border'],
      [0.25, 0.5, 0.75, 1.5, 2, 2.5, 3, 4, 5]
    );
    const sizeOutlineUtils = this.sizeUtilGenerator(
      ['--size-outline'],
      [0.25, 0.5, 0.75, 1.5, 2, 2.5, 3, 4, 5]
    );
    const sizeSpaceUtils = this.sizeUtilGenerator(
      ['--size-space'],
      [0.1, 0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10]
    );
    const sizeStepsUtils = this.sizeUtilGenerator(
      [
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
      ],
      [
        0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.5, 2, 2.5, 3,
        4, 5,
      ]
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
    const shadeTintColorUtils = this.shadeTintUtilGenerator(
      [
        '--color-primary',
        '--color-secondary',
        '--color-tertiary',
        '--color-success',
        '--color-warning',
        '--color-danger',
        '--color-dark',
        '--color-medium',
        '--color-light',
      ],
      [95, 90, 85, 80, 75, 70]
    );
    return `
[data-theme] {
  ${sizeTextUtils}
  ${sizeRadiusUtils}
  ${sizeBorderUtils}
  ${sizeOutlineUtils}
  ${sizeSpaceUtils}
  ${sizeStepsUtils}
  ${rgbaColorUtils}
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

  private rgbaUtilGenerator(keys: string[], alphas: number[]) {
    return keys
      .map(key =>
        alphas
          .map(
            alpha =>
              `${key.replace(
                'rgb',
                `rgba-${alpha * 100}`
              )}: rgba(var(${key}), ${alpha});`
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
}
