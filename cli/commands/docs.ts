import chalk from 'chalk';
import open from 'open';

import {info} from '../../lib/helpers/message.js';

const {blueBright, bold} = chalk;

const HOME_URL = 'https://tinijs.dev';

export function docsCommand() {
  info(`Documetation link: ${bold(blueBright(HOME_URL))}`);
  open(HOME_URL);
}
