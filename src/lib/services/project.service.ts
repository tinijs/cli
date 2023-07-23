import {resolve} from 'path';

import {FileService} from './file.service';

export interface Options {
  out?: string;
  componentPrefix?: string;
  pwa?: PWAPrecaching;
}

interface PWAPrecaching {
  globPatterns?: string[];
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
    out: 'www',
    componentPrefix: 'app',
    pwa: {},
  };

  constructor(private fileService: FileService) {}

  get rcPath() {
    return resolve(this.RC_PATH);
  }

  get packagePath() {
    return resolve(this.PACKAGE_PATH);
  }

  get version() {
    return require('../../../package.json').version as string;
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
    const currentData = await this.fileService.readJson<Options>(this.rcPath);
    const newData = await modifier(currentData);
    await this.fileService.createJson(this.rcPath, newData);
    return this.getOptions();
  }
}
