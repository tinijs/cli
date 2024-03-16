import {resolve} from 'pathe';
import {CommandDef, ArgsDef, defineCommand, SubCommandsDef} from 'citty';
import {Promisable} from 'type-fest';
import {pathExistsSync} from 'fs-extra/esm';
import {defu} from 'defu';

import {TiniApp, CliExpansionConfig} from '@tinijs/core';

export function resolveCommand(m: any) {
  return m.default.def as Promise<CommandDef>;
}

export function defineCliExpansion<Options extends Record<string, unknown>>(
  config: CliExpansionConfig<Options>
) {
  return config as CliExpansionConfig<Options> & {
    context: {
      options: Options;
      tiniApp: TiniApp;
    };
  };
}

export function defineCliCommand<
  T extends ArgsDef = ArgsDef,
  Callbacks = Record<string, () => Promisable<any>>,
  CustomParsedArgs = Record<
    {
      [K in keyof T]: T[K] extends {
        type: 'positional';
        required?: true;
      }
        ? K
        : never;
    }[keyof T],
    string
  > &
    Partial<
      Record<
        {
          [K in keyof T]: T[K] extends {
            type: 'positional';
            required: false;
          }
            ? K
            : never;
        }[keyof T],
        string
      >
    > &
    Record<
      {
        [K in keyof T]: T[K] extends {
          type: 'string';
          required: true;
        }
          ? K
          : never;
      }[keyof T],
      string
    > &
    Partial<
      Record<
        {
          [K in keyof T]: T[K] extends {
            type: 'string';
            required?: false;
          }
            ? K
            : never;
        }[keyof T],
        string
      >
    > &
    Record<
      {
        [K in keyof T]: T[K] extends {
          type: 'boolean';
          required: true;
        }
          ? K
          : never;
      }[keyof T],
      boolean
    > &
    Partial<
      Record<
        {
          [K in keyof T]: T[K] extends {
            type: 'boolean';
            required?: false;
          }
            ? K
            : never;
        }[keyof T],
        boolean
      >
    >,
>(
  def: CommandDef<T>,
  handler?: (args: CustomParsedArgs, callbacks?: Callbacks) => Promisable<void>,
  callbacks?: Callbacks
) {
  if (handler) {
    def.run = function ({args}) {
      return handler(args as any, callbacks);
    };
  }
  const command = (handler || function () {}) as NonNullable<typeof handler>;
  (command as any).def = defineCommand(def);
  return command;
}

export async function setupCliExpansion<
  Options extends Record<string, unknown> = {},
>(tiniApp: TiniApp) {
  const cliExpand = tiniApp.config.cli?.expand || [];
  const expandedCommands: SubCommandsDef = {};
  for (const item of cliExpand) {
    const [localOrVendor, options = {}] = item instanceof Array ? item : [item];
    // process expanded commands
    const expansionConfig =
      localOrVendor instanceof Object
        ? localOrVendor
        : await loadVendorCliExpansion<Options>(localOrVendor);
    if (expansionConfig) {
      (expansionConfig as any).context = {
        options,
        tiniApp,
      };
    }
    const commands: SubCommandsDef = !expansionConfig
      ? {}
      : await expansionConfig.setup(
          defu(expansionConfig.defaults, options),
          tiniApp
        );
    // merge commands
    for (const [key, value] of Object.entries(commands)) {
      if (expandedCommands[key]) continue;
      expandedCommands[key] = value;
    }
  }
  return expandedCommands;
}

export async function loadVendorCliExpansion<
  Options extends Record<string, unknown> = {},
>(packageName: string) {
  const entryPath = resolve('node_modules', packageName, 'dist', 'cli', 'expand.js');
  if (!pathExistsSync(entryPath)) return null;
  const {default: defaulExport} = await import(entryPath);
  if (!defaulExport?.meta || !defaulExport?.setup) return null;
  return defaulExport as CliExpansionConfig<Options>;
}
