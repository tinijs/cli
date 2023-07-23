import {bold, blueBright} from 'chalk';
import * as open from 'open';

import {OK} from '../../lib/services/message.service';

export class DocsCommand {
  constructor() {}

  run() {
    const docsUrl = 'https://tinijs.dev/docs';
    console.log(OK + 'Documetation link: ' + bold(blueBright(docsUrl)));
    open(docsUrl);
  }
}
