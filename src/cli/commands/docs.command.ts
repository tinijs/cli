import chalk from 'chalk';
import * as open from 'open';

import {OK} from '../../lib/services/message.service';

export class DocsCommand {
  constructor() {}

  run() {
    const docsUrl = 'https://tinijs.lamnhan.com/docs';
    console.log(OK + 'Documetation link: ' + chalk.blue(docsUrl));
    open(docsUrl);
  }
}
