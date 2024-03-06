import {resolve} from 'pathe';
import {CommandDef, ArgsDef, defineCommand} from 'citty';
import {Promisable} from 'type-fest';
import fs from 'fs-extra';

import {
  TiniConfigCli,
  CliExpandOptions,
  CliExpandCommandOptions,
  getTiniApp,
} from '../../lib/classes/tini-app.js';
import {
  TINIJS_INSTALL_DIR_PATH,
} from './project.js';

const {exists} = fs;

export const OFFICIAL_EXPANDED_COMMANDS: NonNullable<TiniConfigCli['expand']> = [
  [
    resolve(TINIJS_INSTALL_DIR_PATH, 'ui', 'cli', 'expand.js'),
    {commands: {ui: {}}},
  ],
  [
    resolve(TINIJS_INSTALL_DIR_PATH, 'content', 'cli', 'expand.js'),
    {commands: {content: {}}},
  ],
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
  callbacks: Callbacks,
  handler: (args: CustomParsedArgs, callbacks?: Callbacks) => Promisable<void>
) {
  (handler as any).def = defineCommand({
    ...def,
    run({args}) {
      return handler(args as any, callbacks);
    },
  });
  return handler;
}

export async function getNamedExpandedCommands() {
  const {config: tiniConfig} = await getTiniApp();
  return [
    ...(tiniConfig.cli?.expand || []),
    ...OFFICIAL_EXPANDED_COMMANDS,
  ].reduce(
    (result, item) => {
      const [entryFilePath, expandOptions = {}] =
        typeof item === 'string' ? [item] : item;
      for (const [command, commandOptions] of Object.entries(
        expandOptions.commands || {}
      )) {
        result[command] = {
          entryFilePath,
          expandOptions,
          commandOptions,
        };
      }
      return result;
    },
    {} as Record<
      string,
      {
        entryFilePath: string;
        expandOptions: Omit<CliExpandOptions, 'commands'>;
        commandOptions: CliExpandCommandOptions;
      }
    >
  );
}

export async function getExpandedCommands() {
  const {config: tiniConfig} = await getTiniApp();
  const cliExpand = [
    ...(tiniConfig.cli?.expand || []),
    ...OFFICIAL_EXPANDED_COMMANDS,
  ];
  let expandedCommands = {};
  for (const item of cliExpand) {
    const expandFilePath = resolve(typeof item === 'string' ? item : item[0]);
    if (!(await exists(expandFilePath))) continue;
    const {default: expand} = await import(expandFilePath);
    if (!(expand instanceof Function)) continue;
    const commands = await expand();
    expandedCommands = {...expandedCommands, ...commands};
  }
  return expandedCommands;
}
