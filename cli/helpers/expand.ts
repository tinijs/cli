import {Command} from 'commander';
import {resolve} from 'pathe';
import fs from 'fs-extra';

import {getTiniApp} from './tini.js';

const {exists} = fs;

export type TiniCli = Command;

export async function getExpandedCommands() {
  const {config: tiniConfig} = await getTiniApp();
  return tiniConfig.cliExtends;
}

export async function expandCliApp(tiniCli: TiniCli) {
  const expandableCommands = await getExpandedCommands();
  for (const expandFile of Object.values(expandableCommands)) {
    const expandFilePath = resolve(expandFile);
    if (!(await exists(expandFilePath))) continue;
    const {default: expand} = await import(expandFilePath);
    if (!(expand instanceof Function)) continue;
    expand(tiniCli);
  }
}
