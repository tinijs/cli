import {Command} from 'commander';
import {resolve} from 'pathe';
import fs from 'fs-extra';

import {
  TiniConfig,
  CliExpandOptions,
  CliExpandCommandOptions,
  TINIJS_INSTALL_DIR_PATH,
  getTiniApp,
} from './tini.js';

const {exists} = fs;

export type TiniCli = Command;

export const OFFICIAL_EXPANDED_COMMANDS: TiniConfig['expandCli'] = [
  [
    resolve(TINIJS_INSTALL_DIR_PATH, 'ui', 'cli', 'expand.js'),
    {commands: {ui: {}}},
  ],
  [
    resolve(TINIJS_INSTALL_DIR_PATH, 'content', 'cli', 'expand.js'),
    {commands: {content: {}}},
  ],
];

export async function getNamedExpandedCommands() {
  const {config: tiniConfig} = await getTiniApp();
  return [
    ...(tiniConfig.expandCli || []),
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

export async function expandCliApp(tiniCli: TiniCli) {
  const {config: tiniConfig} = await getTiniApp();
  const cliExpand = [
    ...(tiniConfig.expandCli || []),
    ...OFFICIAL_EXPANDED_COMMANDS,
  ];
  for (const item of cliExpand) {
    const expandFilePath = resolve(typeof item === 'string' ? item : item[0]);
    if (!(await exists(expandFilePath))) continue;
    const {default: expand} = await import(expandFilePath);
    if (!(expand instanceof Function)) continue;
    expand(tiniCli);
  }
}
