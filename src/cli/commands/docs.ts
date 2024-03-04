import chalk from 'chalk';
import open from 'open';

import {MessageService} from '../../lib/services/message.service.js';

const {blueBright, bold} = chalk;

export class DocsCommand {
  readonly HOME_URL = 'https://tinijs.dev';

  constructor(private messageService: MessageService) {}

  run() {
    this.messageService.info(
      `Documetation link: ${bold(blueBright(this.HOME_URL))}`
    );
    open(this.HOME_URL);
  }
}
