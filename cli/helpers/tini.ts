import {createHooks} from 'hookable';
import {defu} from 'defu';
import {resolve} from 'pathe';
import {loadConfig} from 'c12';

import {loadModule} from './module.js';

export interface TiniHooks {
  start?: () => void | Promise<void>;
  'build:before'?: () => void | Promise<void>;
  'build:after'?: () => void | Promise<void>;
  close?: () => void | Promise<void>;
}

export type TiniModules = Array<
  string | [string, any] | ((tiniApp: TiniApp) => void | Promise<void>)
>;

export interface TiniConfig {
  srcDir: string;
  outDir: string;
  stagingDir: string;
  componentPrefix: string;
  skipMinifyHTMLLiterals: boolean;
  precompileGeneric: 'none' | 'lite' | 'full';
  cliExtends: Record<string, string>;
  hooks?: TiniHooks;
  modules?: TiniModules;
}

export const TINIJS_INSTALL_DIR_PATH = resolve('node_modules', '@tinijs');
export const UI_OUTPUT_DIR_PATH = resolve(TINIJS_INSTALL_DIR_PATH, 'ui');

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
      skipMinifyHTMLLiterals: false,
      precompileGeneric: 'lite',
      cliExtends: {
        ui: resolve(TINIJS_INSTALL_DIR_PATH, 'ui', 'cli', 'expand.js'),
        content: resolve(
          TINIJS_INSTALL_DIR_PATH,
          'content',
          'cli',
          'expand.js'
        ),
      },
    },
  });
  return loadResult.config as TiniConfig;
}
