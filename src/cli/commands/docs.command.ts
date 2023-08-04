import {bold, blueBright} from 'chalk';
import * as open from 'open';

import {INFO} from '../../lib/services/message.service';

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
