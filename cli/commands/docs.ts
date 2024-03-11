import {consola} from 'consola';
import chalk from 'chalk';
import open from 'open';

import {defineTiniCommand} from '../utils/cli.js';

const {blueBright, bold} = chalk;

export default defineTiniCommand(
  {
    meta: {
      name: 'docs',
      description: 'Open documentation.',
    },
  },
  {},
  () => {
    const HOME_URL = 'https://tinijs.dev';
    consola.info(`Documetation link: ${bold(blueBright(HOME_URL))}`);
    open(HOME_URL);
  }
);
