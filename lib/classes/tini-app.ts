import {createHooks} from 'hookable';
import {defu} from 'defu';
import {loadConfig} from 'c12';
import {Promisable} from 'type-fest';

import {loadModule} from '../utils/module.js';

export interface TiniConfigDirs {
  assets?: string;
  components?: string;
  layouts?: string;
  pages?: string;
  services?: string;
  utils?: string;
}

export interface TiniConfigPrebuild {
  skipMinifyHtmlLiterals?: boolean;
  precompileGeneric?: 'none' | 'lite' | 'full';
}

export enum TiniAppBuilders {
  Parcel = 'parcel',
  Vite = 'vite',
  Webpack = 'webpack',
}
export interface TiniConfigBuild {
  builder?: TiniAppBuilders;
}

export interface TiniConfigHooks {
  'cli:setup'?: (tini: TiniApp) => Promise<void> | void;
  'cli:cleanup'?: (tini: TiniApp) => Promise<void> | void;
};

export type TiniConfigModules = Array<
  string | [string, any?] | ((tini: TiniApp) => Promisable<void>)
>;

export interface CliDocsOptions {}
export interface CliPreviewOptions {}
export interface CliGenerateOptions {
  componentPrefix?: string;
  generators?: Record<string, any>;
}
export type CliExpandCommandOptions = {};
export interface CliExpandOptions {
  commands?: Record<string, CliExpandCommandOptions>;
}
export interface TiniConfigCli {
  docs?: false | CliDocsOptions;
  preview?: false | CliPreviewOptions;
  generate?: false | CliGenerateOptions;
  expand?: Array<string | [string, CliExpandOptions?]>;
}

export interface TiniConfig {
  srcDir: string;
  outDir: string;
  tempDir: string;
  dirs?: TiniConfigDirs;
  prebuild?: false | TiniConfigPrebuild;
  build?: TiniConfigBuild;
  hooks?: TiniConfigHooks;
  modules?: TiniConfigModules;
  cli?: TiniConfigCli;
}

async function loadTiniConfig() {
  const loadResult = await loadConfig({
    name: 'tini',
    defaultConfig: {
      srcDir: 'app',
      outDir: 'www',
      tempDir: '.tini'
    },
  });
  return loadResult.config as TiniConfig;
}

export async function getTiniApp() {
  return TiniApp.globalInstance || defineTiniApp();
}

export function defineTiniConfig(config: Partial<TiniConfig>) {
  return config;
}

export async function defineTiniApp(config?: TiniConfig) {
  const tini = new TiniApp(config || await loadTiniConfig());
  // setup modules
  if (tini.config.modules) {
    for (const configModule of tini.config.modules) {
      if (configModule instanceof Function) {
        await configModule(tini);
      } else {
        const [packageName, moduleOptions] = !Array.isArray(configModule)
          ? [configModule]
          : configModule;
        const tiniModule = await loadModule(packageName);
        await tiniModule?.setup?.(
          defu(tiniModule?.defaults, moduleOptions),
          tini
        );
      }
    }
  }
  // add hooks
  if (tini.config.hooks) {
    tini.hooks.addHooks(tini.config.hooks);
  }
  // result
  return tini;
}

export class TiniApp {
  static globalInstance?: TiniApp;

  constructor(public config: TiniConfig) {}

  readonly hooks = createHooks<TiniConfigHooks>()
  readonly hook = this.hooks.hook;
}
