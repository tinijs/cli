import chalk from 'chalk';
import {resolve} from 'pathe';
import ora from 'ora';

import {MessageService} from '../../lib/services/message.service.js';
import {TerminalService} from '../../lib/services/terminal.service.js';
import {ProjectService} from '../../lib/services/project.service.js';
import {UiService, SoulAndSkins} from '../../lib/services/ui.service.js';

const {gray, green, blue, blueBright, bold} = chalk;

export interface UiUseCommandOptions {
  buildOnly?: boolean;
  skipHelp?: boolean;
}

const NODE_MODULES_DIR = 'node_modules';
const UI_PACKAGE_NAME = '@tinijs/ui';

export class UiUseCommand {
  constructor(
    private messageService: MessageService,
    private terminalService: TerminalService,
    private projectService: ProjectService,
    private uiService: UiService
  ) {}

  async run(inputs: string[], options: UiUseCommandOptions) {
    inputs = (inputs || []).filter(item => ~item.indexOf('/'));
    if (!inputs.length) {
      return this.messageService.error(
        `Invalid inputs, valid format: ${blue('soul/skin-1,skin-2')}`
      );
    }
    const destPath = resolve(NODE_MODULES_DIR, UI_PACKAGE_NAME);
    const parsedInputs = this.parseInputs(inputs);
    const souls = parsedInputs.map(({soul}) => soul);

    // install packages (@tinijs/ui postinstall or using --build-only implicitly)
    if (!options.buildOnly) {
      this.installPackages(souls);
    }

    // copy global files
    console.log('\n');
    const spinner = ora('Building bases, skins and components ...\n').start();
    await this.uiService.devAndUseCopyGlobalFiles(destPath);
    // build skins
    await this.uiService.devAndUseBuildSkins(destPath, parsedInputs);
    // build bases
    await this.uiService.devAndUseBuildBases(
      `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-${souls[0]}/${this.uiService.STYLES_DIR}/base`,
      destPath,
      souls
    );
    // build components, blocks
    await this.uiService.devAndUseBuildComponents(
      `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-common/${this.uiService.COMPONENTS_DIR}`,
      destPath,
      souls
    );
    await this.uiService.devAndUseBuildComponents(
      `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-common/${this.uiService.BLOCKS_DIR}`,
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
      this.showInstruction(`${firstSoul}/${firstSkin}`);
    }
    console.log('\n');
  }

  private parseInputs(inputs: string[]): SoulAndSkins[] {
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

  private installPackages(souls: string[]) {
    const soulPackages = souls
      .map(soul => `${UI_PACKAGE_NAME}-${soul}`)
      .join(' ');
    this.terminalService.exec(
      `npm i ${soulPackages} ${UI_PACKAGE_NAME}-common ${UI_PACKAGE_NAME}`
    );
  }

  private showInstruction(firstSoulSkin: string) {
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
}
