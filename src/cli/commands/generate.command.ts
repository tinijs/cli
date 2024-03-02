import chalk from 'chalk';

import {MessageService} from '../../lib/services/message.service.js';
import {FileService} from '../../lib/services/file.service.js';
import {GenerateService} from '../../lib/services/generate.service.js';

const {red, green, yellow} = chalk;

interface GenerateCommandOptions {
  typePrefixed?: boolean;
  nested?: boolean;
}

export class GenerateCommand {
  constructor(
    private messageService: MessageService,
    private fileService: FileService,
    private generateService: GenerateService
  ) {}

  async run(
    type: string,
    dest: string,
    commandOptions: GenerateCommandOptions
  ) {
    const SUPPORTED_TYPES = Object.keys(
      this.generateService.DEFAULT_FOLDERS
    ).map(item => item);
    if (SUPPORTED_TYPES.indexOf(type) === -1) {
      return this.messageService.error(
        `Invalid type "${red(type)}", please try: ${SUPPORTED_TYPES.map(item =>
          green(item)
        ).join(', ')}.`
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
      return this.messageService.error(
        `A ${yellow(type)} already available at ${green(mainPath)}.`
      );
    }
    // save files
    for (let i = 0; i < templates.length; i++) {
      const {path, fullPath, content} = templates[i];
      await this.fileService.createFile(fullPath, content);
      this.messageService.success(`CREATE ${green(path)}.`);
    }
  }
}
