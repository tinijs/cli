import {resolve} from 'pathe';
import {PackageJson} from 'type-fest';

import {FileService, require} from './file.service.js';

const cliPackageJson = require('../../../package.json');

export interface Options {
  srcDir?: string;
  outDir?: string;
  stagingDir?: string;
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
  use?: string[];
  icon?: string[];
}

export type ProjectOptions = {
  [P in keyof Options]-?: Options[P];
};

export class ProjectService {
  private RC_FILE = 'tini.config.json';
  private PACKAGE_FILE = 'package.json';
  private UI_OUTPUT_DIR = 'node_modules/@tinijs/ui';

  private defaultOptions: ProjectOptions = {
    srcDir: 'app',
    outDir: 'www',
    stagingDir: '.tini',
    componentPrefix: 'app',
    skipMinifyHTMLLiterals: false,
    precompileGeneric: 'lite',
    pwa: {},
    ui: {},
  };

  readonly cliPackageJson = cliPackageJson;

  constructor(private fileService: FileService) {}

  get targetEnv() {
    return process.env.TARGET_ENV || 'development';
  }

  get version() {
    return this.cliPackageJson.version;
  }

  get rcFilePath() {
    return resolve(this.RC_FILE);
  }

  get packageFilePath() {
    return resolve(this.PACKAGE_FILE);
  }

  get uiOutputDirPath() {
    return resolve(this.UI_OUTPUT_DIR);
  }

  async isTiniConfigExists() {
    return await this.fileService.exists(this.rcFilePath);
  }

  async isPWAEnabled(appConfig?: ProjectOptions) {
    const {srcDir, pwa} = appConfig || (await this.getOptions());
    const swExists = await this.fileService.exists(resolve(srcDir, 'sw.ts'));
    return swExists && pwa?.globPatterns;
  }

  getPackageJson() {
    return this.fileService.readJson<PackageJson>(this.packageFilePath);
  }

  async updatePackageJson(
    modifier: (currentData: PackageJson) => Promise<PackageJson>
  ) {
    const currentData = await this.fileService.readJson<PackageJson>(
      this.packageFilePath
    );
    const newData = await modifier(currentData);
    await this.fileService.createJson(this.packageFilePath, newData);
    return this.getPackageJson();
  }

  async getOptions() {
    // read options
    const options = !(await this.isTiniConfigExists())
      ? ({} as unknown as Options)
      : await this.fileService.readJson<Options>(this.rcFilePath);
    // result
    return {...this.defaultOptions, ...options} as ProjectOptions;
  }

  async updateOptions(modifier: (currentData: Options) => Promise<Options>) {
    const currentData = !(await this.isTiniConfigExists())
      ? ({} as unknown as Options)
      : await this.fileService.readJson<Options>(this.rcFilePath);
    const newData = await modifier(currentData);
    await this.fileService.createJson(this.rcFilePath, newData);
    return this.getOptions();
  }
}
