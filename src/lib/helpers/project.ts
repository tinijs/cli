import {resolve} from 'pathe';
import {loadConfig} from 'c12';
import {PackageJson} from 'type-fest';

import {FileService, requireModule} from './file.service.js';
const cliPackageJson = requireModule('../../../package.json');

export interface ProjectConfig {
  srcDir: string;
  outDir: string;
  stagingDir: string;
  componentPrefix: string;
  skipMinifyHTMLLiterals: boolean;
  precompileGeneric: 'none' | 'lite' | 'full';
}

export function defineTiniConfig(config: Partial<ProjectConfig>) {
  return config;
}

export class ProjectService {
  private readonly DEFAULT_PROJECT_CONFIG: ProjectConfig = {
    srcDir: 'app',
    outDir: 'www',
    stagingDir: '.tini',
    componentPrefix: 'app',
    skipMinifyHTMLLiterals: false,
    precompileGeneric: 'lite',
  };

  readonly uiOutputDirPath = resolve('node_modules/@tinijs/ui');
  readonly cliPackageJson = cliPackageJson;

  get targetEnv() {
    return process.env.TARGET_ENV || 'development';
  }

  constructor(private fileService: FileService) {}

  async loadProjectPackageJson() {
    return this.fileService.readJson<PackageJson>(resolve('package.json'));
  }

  async loadProjectConfig() {
    const loadResult = await loadConfig({
      configFile: 'tini.config',
      rcFile: false,
      defaultConfig: this.DEFAULT_PROJECT_CONFIG,
    });
    return loadResult.config as ProjectConfig;
  }

  async modifyProjectPackageJson(
    modifier: (currentData: PackageJson) => Promise<PackageJson>
  ) {
    const packageJsonPath = resolve('package.json');
    const currentData =
      await this.fileService.readJson<PackageJson>(packageJsonPath);
    const newData = await modifier(currentData);
    return this.fileService.createJson(packageJsonPath, newData);
  }
}
