import chalk from 'chalk';
import open from 'open';

import {info} from '../helpers/message.js';

const {blueBright, bold} = chalk;

export default function () {
  const HOME_URL = 'https://tinijs.dev';
  info(`Documetation link: ${bold(blueBright(HOME_URL))}`);
  open(HOME_URL);
}
