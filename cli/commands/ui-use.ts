import chalk from 'chalk';
import {resolve} from 'pathe';
import {execaCommand} from 'execa';
import ora from 'ora';

import {error} from '../../lib/helpers/message.js';
import {
  SoulAndSkins,
  COMPONENTS_DIR,
  BLOCKS_DIR,
  STYLES_DIR,
  devAndUseBuildBases,
  devAndUseBuildSkins,
  devAndUseCopyGlobalFiles,
  devAndUseBuildComponents,
} from '../../lib/helpers/ui.js';

const {gray, green, blue, blueBright, bold} = chalk;

export interface UiUseCommandOptions {
  buildOnly?: boolean;
  skipHelp?: boolean;
}

const NODE_MODULES_DIR = 'node_modules';
const UI_PACKAGE_NAME = '@tinijs/ui';

export default async function (inputs: string[], options: UiUseCommandOptions) {
  inputs = (inputs || []).filter(item => ~item.indexOf('/'));
  if (!inputs.length) {
    return error(`Invalid inputs, valid format: ${blue('soul/skin-1,skin-2')}`);
  }
  const destPath = resolve(NODE_MODULES_DIR, UI_PACKAGE_NAME);
  const parsedInputs = parseInputs(inputs);
  const souls = parsedInputs.map(({soul}) => soul);

  // install packages (@tinijs/ui postinstall or using --build-only implicitly)
  if (!options.buildOnly) {
    await installPackages(souls);
  }

  // copy global files
  console.log('\n');
  const spinner = ora('Building bases, skins and components ...\n').start();
  await devAndUseCopyGlobalFiles(destPath);
  // build skins
  await devAndUseBuildSkins(destPath, parsedInputs);
  // build bases
  await devAndUseBuildBases(
    `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-${souls[0]}/${STYLES_DIR}/base`,
    destPath,
    souls
  );
  // build components, blocks
  await devAndUseBuildComponents(
    `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-common/${COMPONENTS_DIR}`,
    destPath,
    souls
  );
  await devAndUseBuildComponents(
    `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-common/${BLOCKS_DIR}`,
    destPath,
    souls
  );
  // TODO: support custom components and blocks
  // result
  spinner.succeed(`Build ${green(UI_PACKAGE_NAME)} successfully!`);
  parsedInputs.map(({soul, skins}) =>
    console.log(
      `  + Soul ${bold(blueBright(soul))}, skins: ${blue(skins.join(', '))}`
    )
  );
  if (!options.skipHelp) {
    const firstSoul = parsedInputs[0].soul;
    const firstSkin = parsedInputs[0].skins[0];
    showInstruction(`${firstSoul}/${firstSkin}`);
  }
  console.log('\n');
}

function parseInputs(inputs: string[]): SoulAndSkins[] {
  return inputs.map(item => {
    const [soul, skins] = item.split('/');
    return {
      soul: soul.trim(),
      skins: skins
        .split(',')
        .filter(item => item)
        .map(item => item.trim()),
    };
  });
}

async function installPackages(souls: string[]) {
  const soulPackages = souls
    .map(soul => `${UI_PACKAGE_NAME}-${soul}`)
    .join(' ');
  return execaCommand(
    `npm i ${soulPackages} ${UI_PACKAGE_NAME}-common ${UI_PACKAGE_NAME}`
  );
}

function showInstruction(firstSoulSkin: string) {
  console.log(
    '\nNow you can copy the below code to a global style file:\n' +
      gray("\n    @import '../node_modules/@tinijs/ui/skins.css';\n")
  );
  console.log('To make a theme the default one, edit the body tag:\n');
  console.log(
    '\n    ' + gray(`<body data-theme="${green(firstSoulSkin)}">`) + '\n'
  );
  console.log(
    `For more detail how to import and use Tini UI components. \nPlease visit: ${blue(
      'https://ui.tinijs.dev'
    )}`
  );
}
