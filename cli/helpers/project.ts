import {resolve} from 'pathe';
import {loadConfig} from 'c12';
import {PackageJson} from 'type-fest';
import fsExtra from 'fs-extra';

import {requireModule} from './file.js';

const {readJson, writeJson} = fsExtra;

export interface ProjectConfig {
  srcDir: string;
  outDir: string;
  stagingDir: string;
  componentPrefix: string;
  skipMinifyHTMLLiterals: boolean;
  precompileGeneric: 'none' | 'lite' | 'full';
  cliExtends: Record<string, string>;
}

export const TINIJS_INSTALL_DIR_PATH = resolve('node_modules', '@tinijs');
export const UI_OUTPUT_DIR_PATH = resolve(TINIJS_INSTALL_DIR_PATH, 'ui');
export const CLI_PACKAGE_JSON = requireModule('../../package.json');

const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  srcDir: 'app',
  outDir: 'www',
  stagingDir: '.tini',
  componentPrefix: 'app',
  skipMinifyHTMLLiterals: false,
  precompileGeneric: 'lite',
  cliExtends: {
    ui: resolve(TINIJS_INSTALL_DIR_PATH, 'ui', 'cli', 'expand.js'),
    content: resolve(TINIJS_INSTALL_DIR_PATH, 'content', 'cli', 'expand.js'),
  },
};

export function defineTiniConfig(config: Partial<ProjectConfig>) {
  return config;
}

export function getTargetEnv() {
  return process.env.TARGET_ENV || 'development';
}

export async function loadProjectPackageJson() {
  return readJson(resolve('package.json')) as Promise<PackageJson>;
}

export async function loadProjectConfig() {
  const loadResult = await loadConfig({
    configFile: 'tini.config',
    rcFile: false,
    defaultConfig: DEFAULT_PROJECT_CONFIG,
  });
  return loadResult.config as ProjectConfig;
}

export async function modifyProjectPackageJson(
  modifier: (currentData: PackageJson) => Promise<PackageJson>
) {
  const packageJsonPath = resolve('package.json');
  const currentData = (await readJson(packageJsonPath)) as PackageJson;
  const newData = await modifier(currentData);
  return writeJson(packageJsonPath, newData, {spaces: 2});
}
