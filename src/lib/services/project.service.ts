import {resolve} from 'path';

import {FileService} from './file.service';

export interface Options {
  srcDir?: string;
  outDir?: string;
  stagingPrefix?: string;
  componentPrefix?: string;
  skipMinifyHTMLLiterals?: boolean;
  precompileGeneric?: 'none' | 'lite' | 'full';
  pwa?: PWAPrecaching;
  ui?: UiConfig;
}

interface PWAPrecaching {
  globPatterns?: string[];
}

interface UiConfig {
  use: string[];
}

export interface PackageJson {
  name: string;
  version: string;
  description: string;
  homepage?: string;
  author?: string;
  license?: string;
  keywords?: string[];
}

export type ProjectOptions = {
  [P in keyof Options]-?: Options[P];
};

export class ProjectService {
  private RC_PATH = 'tini.config.json';
  private PACKAGE_PATH = 'package.json';

  private defaultOptions: ProjectOptions = {
    srcDir: 'app',
    outDir: 'www',
    stagingPrefix: '.tini',
    componentPrefix: 'app',
    skipMinifyHTMLLiterals: false,
    precompileGeneric: 'lite',
    pwa: {},
    ui: {use: ['bootstrap/light']},
  };

  constructor(private fileService: FileService) {}

  get targetEnv() {
    return process.env.TARGET_ENV || 'development';
  }

  get rcPath() {
    return resolve(this.RC_PATH);
  }

  get packagePath() {
    return resolve(this.PACKAGE_PATH);
  }

  get version() {
    return require('../../../package.json').version as string;
  }

  async isTiniConfigExists() {
    return await this.fileService.exists(this.rcPath);
  }

  async isPWAEnabled(appConfig?: ProjectOptions) {
    const {srcDir, pwa} = appConfig || (await this.getOptions());
    const swExists = await this.fileService.exists(resolve(srcDir, 'sw.ts'));
    return swExists && pwa?.globPatterns;
  }

  getPackageJson() {
    return this.fileService.readJson<PackageJson>(this.packagePath);
  }

  async getOptions() {
    // read options
    const options = !(await this.fileService.exists(this.rcPath))
      ? ({} as unknown as Options)
      : await this.fileService.readJson<Options>(this.rcPath);
    // result
    return {...this.defaultOptions, ...options} as ProjectOptions;
  }

  async updateOptions(modifier: (currentData: Options) => Promise<Options>) {
    const currentData = !(await this.fileService.exists(this.rcPath))
      ? ({} as unknown as Options)
      : await this.fileService.readJson<Options>(this.rcPath);
    const newData = await modifier(currentData);
    await this.fileService.createJson(this.rcPath, newData);
    return this.getOptions();
  }
}
