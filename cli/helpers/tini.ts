import {createHooks} from 'hookable';
import {defu} from 'defu';
import {resolve} from 'pathe';
import {loadConfig} from 'c12';
import {Promisable} from 'type-fest';

import {loadModule} from './module.js';

export interface TiniConfigHooks {
  start?: () => Promisable<void>;
  close?: () => Promisable<void>;
}

export type TiniConfigModules = Array<
  string | [string, any?] | ((tiniApp: TiniApp) => Promisable<void>)
>;

export interface CliExpandCommandOptions {}

export interface CliExpandOptions {
  commands?: Record<string, CliExpandCommandOptions>;
}

export interface TiniConfigCli {
  generate?: {
    componentPrefix?: string;
    generators?: Record<string, any>;
  };
  expand?: Array<string | [string, CliExpandOptions?]>;
}

export interface TiniConfigPrebuilt {
  stagingDir: string;
  skipMinifyHtmlLiterals: boolean;
  precompileGeneric: 'none' | 'lite' | 'full';
}

export interface TiniConfig {
  srcDir: string;
  outDir: string;
  stagingDir: string;
  componentPrefix: string;
  skipMinifyHtmlLiterals: boolean;
  precompileGeneric: 'none' | 'lite' | 'full';
  expandCli: Array<string | [string, CliExpandOptions?]>;
  cli?: TiniConfigCli;
  hooks?: TiniConfigHooks;
  modules?: TiniConfigModules;
}

export const TINIJS_INSTALL_DIR_PATH = resolve('node_modules', '@tinijs');

export function defineTiniConfig(config: Partial<TiniConfig>) {
  return config;
}

export class TiniApp {
  static instance?: TiniApp;

  constructor(public config: TiniConfig) {}

  private readonly hooks = createHooks();
  readonly hook = this.hooks.hook.bind(this.hooks);
  readonly addHooks = this.hooks.addHooks.bind(this.hooks);
  readonly callHook = this.hooks.callHook.bind(this.hooks);
}

export async function getTiniApp() {
  if (!TiniApp.instance) {
    const tini = new TiniApp(await loadTiniConfig());
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
      tini.addHooks(tini.config.hooks);
    }
    // set the instance
    TiniApp.instance = tini;
  }
  return TiniApp.instance;
}

async function loadTiniConfig() {
  const loadResult = await loadConfig({
    configFile: 'tini.config',
    rcFile: false,
    defaultConfig: {
      srcDir: 'app',
      outDir: 'www',
      stagingDir: '.tini',
      componentPrefix: 'app',
      skipMinifyHtmlLiterals: false,
      precompileGeneric: 'lite',
    },
  });
  return loadResult.config as TiniConfig;
}
