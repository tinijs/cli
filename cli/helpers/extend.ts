import {Command} from 'commander';
import {resolve} from 'pathe';
import fs from 'fs-extra';

import {loadProjectConfig} from './project.js';

const {exists} = fs;

export type TiniCLI = Command;

export async function getExtendableCommands() {
  const projectConfig = await loadProjectConfig();
  return projectConfig.cliExtends;
}

export async function extendTiniCLI(tiniCLI: TiniCLI) {
  const extendableCommands = await getExtendableCommands();
  for (const extendFile of Object.values(extendableCommands)) {
    const extendFilePath = resolve(extendFile);
    if (!(await exists(extendFilePath))) continue;
    const {default: extendCLI} = await import(extendFilePath);
    if (!(extendCLI instanceof Function)) continue;
    extendCLI(tiniCLI);
  }
}
