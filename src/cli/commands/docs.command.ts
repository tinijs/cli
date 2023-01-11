import * as chalk from 'chalk';
import * as open from 'open';

import {OK} from '../../lib/services/message.service';

export class DocsCommand {
  constructor() {}

  run() {
    const docsUrl = 'https://tinijs.dev/docs';
    console.log(OK + 'Documetation link: ' + chalk.blue(docsUrl));
    open(docsUrl);
  }
}
