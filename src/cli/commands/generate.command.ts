import chalk from 'chalk';

import {FileService} from '../../lib/services/file.service.js';
import {GenerateService} from '../../lib/services/generate.service.js';

const {red, green, yellow} = chalk;

interface CommandOptions {
  typePrefixed?: boolean;
  nested?: boolean;
}

export class GenerateCommand {
  constructor(
    private fileService: FileService,
    private generateService: GenerateService
  ) {}

  async run(type: string, dest: string, commandOptions: CommandOptions) {
    const SUPPORTED_TYPES = Object.keys(
      this.generateService.DEFAULT_FOLDERS
    ).map(item => item);
    if (SUPPORTED_TYPES.indexOf(type) === -1) {
      return console.log(
        `\nInvalid type "${red(type)}", please try: ` +
          SUPPORTED_TYPES.map(item => green(item)).join(', ') +
          '.\n'
      );
    }
    const templates = await this.generateService.generate(
      type,
      dest,
      commandOptions.typePrefixed,
      commandOptions.nested
    );
    const {path: mainPath, fullPath: mainFullPath} = templates[0];
    if (await this.fileService.exists(mainFullPath)) {
      return console.log(
        `\nA ${yellow(type)} already available at ${green(mainPath)}.\n`
      );
    }
    // save files
    for (let i = 0; i < templates.length; i++) {
      const {path, fullPath, content} = templates[i];
      await this.fileService.createFile(fullPath, content);
      console.log(`\nCREATE ${green(path)}\n`);
    }
  }
}
