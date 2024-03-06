import chalk from 'chalk';
import fsExtra from 'fs-extra';

import {error, success} from '../helpers/message.js';
import {DEFAULT_FOLDERS, generate} from '../helpers/generate.js';

const {red, green, yellow} = chalk;
const {pathExists, outputFile} = fsExtra;

interface GenerateCommandOptions {
  typePrefixed?: boolean;
  nested?: boolean;
}

export default async function (
  type: string,
  dest: string,
  commandOptions: GenerateCommandOptions
) {
  const SUPPORTED_TYPES = Object.keys(DEFAULT_FOLDERS).map(item => item);
  if (SUPPORTED_TYPES.indexOf(type) === -1) {
    return error(
      `Invalid type "${red(type)}", please try: ${SUPPORTED_TYPES.map(item =>
        green(item)
      ).join(', ')}.`
    );
  }
  const templates = await generate(
    type,
    dest,
    commandOptions.typePrefixed,
    commandOptions.nested
  );
  const {path: mainPath, fullPath: mainFullPath} = templates[0];
  if (await pathExists(mainFullPath)) {
    return error(`A ${yellow(type)} already available at ${green(mainPath)}.`);
  }
  // save files
  for (let i = 0; i < templates.length; i++) {
    const {path, fullPath, content} = templates[i];
    await outputFile(fullPath, content);
    success(`CREATE ${green(path)}.`);
  }
}
