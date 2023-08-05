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
  private readonly COLOR_OPTIONS = [
    'contrast',
    'shade',
    'shade-2',
    'shade-3',
    'shade-3',
    'shade-5',
    'tint',
    'tint-2',
    'tint-3',
    'tint-4',
    'tint-5',
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
    const rgbaColorUtils = this.rgbaUtilGenerator(
      this.COLORS,
      [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]
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
  ${rgbaColorUtils}
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

  private rgbaUtilGenerator(keys: string[], alphaPercents: number[]) {
    const options = ['', ...this.COLOR_OPTIONS];
    return keys
      .map(key =>
        options
          .map(option =>
            alphaPercents
              .map(alphaPercent => {
                const mainKey = `${key}${!option ? '' : `-${option}`}`;
                return `${mainKey}-rgba-${alphaPercent}: color-mix(in oklab, var(${mainKey}), transparent ${
                  100 - alphaPercent
                }%);`;
              })
              .join('\n  ')
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
