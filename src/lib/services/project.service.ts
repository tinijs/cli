import {resolve} from 'path';

import {FileService} from './file.service';

interface Options {
  out?: string;
  componentPrefix?: string;
  url?: string;
  pwa?: boolean;
}

interface PackageJson {
  tinirc?: Options;
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
    url: 'https://tinijs.dev',
    pwa: false,
  };

  constructor(private fileService: FileService) {}

  getPackageJson() {
    const packagePath = resolve(this.PACKAGE_PATH);
    return this.fileService.readJson<PackageJson>(packagePath);
  }

  async getOptions() {
    const rcPath = resolve(this.RC_PATH);
    // read options
    const options = !(await this.fileService.exists(rcPath))
      ? ({} as unknown as Options)
      : await this.fileService.readJson<Options>(rcPath);
    // result
    return {...this.defaultOptions, ...options} as ProjectOptions;
  }
}
