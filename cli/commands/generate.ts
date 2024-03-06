import chalk from 'chalk';
import fsExtra from 'fs-extra';

import {error, success} from '../helpers/message.js';
import {getTiniApp} from '../helpers/tini.js';
import {BUILTIN_GENERATORS, TemplateGenerator} from '../helpers/generate.js';

const {red, green, yellow} = chalk;
const {exists, outputFile} = fsExtra;

interface GenerateCommandOptions {
  dir?: string;
  typePrefixed?: boolean;
  nested?: boolean;
}

export default async function (
  type: string,
  dest: string,
  commandOptions: GenerateCommandOptions
) {
  const {
    config: {srcDir, cli},
  } = await getTiniApp();
  const availableGenerators: Record<string, TemplateGenerator> = {
    ...BUILTIN_GENERATORS,
    ...cli?.generate?.generators,
  };
  const generator = availableGenerators[type];
  if (!generator) {
    return error(
      `Invalid type "${red(type)}", please try: ${Object.keys(
        availableGenerators
      )
        .map(item => green(item))
        .join(', ')}.`
    );
  }
  const templates = await generator({
    type,
    dest,
    srcDir: commandOptions.dir || srcDir,
    typePrefixed: commandOptions.typePrefixed || false,
    nested: commandOptions.nested || false,
    componentPrefix: cli?.generate?.componentPrefix || 'app',
  });
  const {shortPath: mainShortPath, fullPath: mainFullPath} = templates[0];
  if (await exists(mainFullPath)) {
    return error(
      `A ${yellow(type)} already available at ${green(mainShortPath)}.`
    );
  }
  // save files
  for (let i = 0; i < templates.length; i++) {
    const {shortPath, fullPath, content} = templates[i];
    await outputFile(fullPath, content);
    success(`CREATE ${green(shortPath)}.`);
  }
}
