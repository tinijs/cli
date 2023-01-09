import {resolve} from 'path';
import {yellow, green, red} from 'chalk';

import {FileService} from '../../lib/services/file.service';
import {GenerateService} from '../../lib/services/generate.service';

interface GenerateCommandOptions {
  typePrefixed?: boolean;
  nested?: boolean;
}

export class GenerateCommand {
  constructor(
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
      return console.log(
        `Invalid type "${red(type)}", please try: ` +
          SUPPORTED_TYPES.map(item => green(item)).join(', ')
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
        `A ${yellow(type)} already available at ` + green(mainPath)
      );
    }
    // save files
    for (let i = 0; i < templates.length; i++) {
      const {path, fullPath, content} = templates[i];
      await this.fileService.createFile(fullPath, content);
      console.log('CREATE ' + green(path));
    }
    // modify
    await this.modify(mainPath);
    //result
    console.log('MODIFY public-api.ts');
  }

  private async modify(exportPath: string) {
    await this.fileService.changeContent(
      resolve('public-api.ts'),
      content => content + `export * from '${exportPath.replace('.ts', '')}';\n`
    );
  }
}
