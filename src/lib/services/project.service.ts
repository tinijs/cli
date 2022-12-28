import {resolve} from 'path';

import {FileService} from './file.service';

interface Options {
  source?: string;
  out?: string;
  public?: string;
}

interface PackageJson {
  tinirc?: Options;
}

type ProjectOptions = {
  [P in keyof Options]-?: Options[P];
};

export class ProjectService {
  private rcPath = resolve('.tinirc.js');
  private packagePath = resolve('package.json');

  private defaultOptions: ProjectOptions = {
    source: '.tinijs',
    out: 'dist',
    public: 'public',
  };

  constructor(private fileService: FileService) {}

  async getOptions() {
    let options: Options = {};
    if (await this.fileService.exists(this.rcPath)) {
      options = await import(this.rcPath);
    } else {
      const packageJson = this.fileService.readJson(
        this.packagePath
      ) as PackageJson;
      options = packageJson.tinirc || {};
    }
    return {...this.defaultOptions, ...options} as ProjectOptions;
  }
}
