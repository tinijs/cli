import chalk from 'chalk';
import open from 'open';

import {INFO} from '../../lib/services/message.service.js';

const {blueBright, bold} = chalk;

export class DocsCommand {
  constructor() {}

  run() {
    const docsUrl = 'https://tinijs.dev/docs';
    console.log(
      '\n' + INFO + 'Documetation link: ' + bold(blueBright(docsUrl)) + '\n'
    );
    open(docsUrl);
  }
}
