import {bold, blue, blueBright, green, gray} from 'chalk';
import {resolve} from 'path';
import * as ora from 'ora';

import {ERROR} from '../../lib/services/message.service';
import {TerminalService} from '../../lib/services/terminal.service';
import {ProjectService, Options} from '../../lib/services/project.service';
import {UiService, SoulAndSkins} from '../../lib/services/ui.service';

export {CommandOptions as UiUseCommandOptions};

interface CommandOptions {
  buildOnly?: boolean;
  skipHelp?: boolean;
}

const NODE_MODULES_DIR = 'node_modules';
const UI_PACKAGE_NAME = '@tinijs/ui';

export class UiUseCommand {
  constructor(
    private terminalService: TerminalService,
    private projectService: ProjectService,
    private uiService: UiService
  ) {}

  async run(inputs: string[], options: CommandOptions) {
    const {ui} = await this.projectService.getOptions();
    inputs = inputs?.length ? inputs : ui.use;
    inputs = (inputs || []).filter(item => ~item.indexOf('/'));
    if (!inputs.length) {
      return console.log(
        '\n' +
          ERROR +
          `Invalid inputs, valid format: ${blue('soul/skin-1,skin-2')}\n`
      );
    }
    const destPath = resolve(NODE_MODULES_DIR, UI_PACKAGE_NAME);
    const parsedInputs = this.parseInputs(inputs);
    const souls = parsedInputs.map(({soul}) => soul);

    /*
     * A. manual mode (tini ui use)
     */

    // install packages then run postinstall
    if (!options.buildOnly) {
      // update tini.config.json
      await this.projectService.updateOptions(
        async options => ({...options, ui: {use: inputs}}) as Options
      );
      // install packages
      return this.installPackages(souls);
    }

    /*
     * B. @tinijs/ui postinstall or using --build-only
     */

    // copy global files
    console.log('\n');
    const spinner = ora('Building bases, skins and components ...\n').start();
    await this.uiService.devAndUseCopyGlobalFiles(destPath);
    // build skins
    await this.uiService.devAndUseBuildSkins(destPath, parsedInputs);
    // build bases
    const basesPublicPath = await this.uiService.devAndUseBuildBases(
      `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-${souls[0]}/${this.uiService.STYLES_DIR}/base`,
      destPath,
      souls
    );
    // build components, blocks
    const componentPublicPaths = await this.uiService.devAndUseBuildComponents(
      `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-common/${this.uiService.COMPONENTS_DIR}`,
      destPath,
      souls
    );
    const blockPublicPaths = await this.uiService.devAndUseBuildComponents(
      `${NODE_MODULES_DIR}/${UI_PACKAGE_NAME}-common/${this.uiService.BLOCKS_DIR}`,
      destPath,
      souls
    );
    await this.uiService.savePublicApi(destPath, [
      basesPublicPath,
      ...componentPublicPaths,
      ...blockPublicPaths,
    ]);
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
