import {resolve} from 'pathe';
import {CommandDef, ArgsDef, defineCommand, SubCommandsDef} from 'citty';
import {Promisable} from 'type-fest';
import {existsSync} from 'node:fs';

import {TiniConfigCli, getTiniApp} from '@tinijs/core';

import {TINIJS_INSTALL_DIR_PATH} from './project.js';

export const OFFICIAL_EXPANDED_COMMANDS: NonNullable<TiniConfigCli['expand']> =
  [
    resolve(TINIJS_INSTALL_DIR_PATH, 'ui', 'cli', 'expand.js'),
    resolve(TINIJS_INSTALL_DIR_PATH, 'content', 'cli', 'expand.js'),
  ];

export function resolveCommand(m: any) {
  return m.default.def as Promise<CommandDef>;
}

export function defineTiniCommand<
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

export async function getExpandedCommands() {
  const {config: tiniConfig} = await getTiniApp();
  const cliExpand = [
    ...(tiniConfig.cli?.expand || []),
    ...OFFICIAL_EXPANDED_COMMANDS,
  ];
  const expandedCommands: SubCommandsDef = {};
  for (const item of cliExpand) {
    const [filePath] = typeof item === 'string' ? [item] : item;
    const expandFilePath = resolve(filePath);
    if (!existsSync(expandFilePath)) continue;
    const {default: expand} = await import(expandFilePath);
    if (!(expand instanceof Function)) continue;
    const commands = (await expand()) as SubCommandsDef;
    for (const [key, value] of Object.entries(commands)) {
      if (expandedCommands[key]) continue;
      expandedCommands[key] = value;
    }
  }
  return expandedCommands;
}
