import chalk from 'chalk';
import superstatic from 'superstatic';

import {info} from '../utils/message.js';
import {getTiniApp} from '../../lib/classes/tini-app.js';
import {defineTiniCommand} from '../utils/cli.js';

const {blueBright, bold} = chalk;

export default defineTiniCommand(
  {
    meta: {
      name: 'docs',
      description: 'Open documentation.',
    },
    args: {
      port: {
        alias: 'p',
        type: 'string',
        description: 'Port to use for the server.',
      },
      host: {
        alias: 'h',
        type: 'string',
        description: 'Host to use for the server.',
      },
      i18n: {
        alias: 'i',
        type: 'boolean',
        description: 'Enable superstatic i18n.',
      },
    },
  },
  {},
  async args => {
    const {
      config: {outDir: cwd},
    } = await getTiniApp();
    // launch server
    const hostname = args.host || '0.0.0.0';
    const port = Number(args.port || 3000);
    const config = {
      cleanUrls: true,
      rewrites: [{source: '**', destination: '/index.html'}],
    } as Record<string, unknown>;
    if (args.i18n) {
      config.i18n = {root: '/'};
    }
    superstatic
      .server({
        hostname,
        port,
        cwd,
        config,
        debug: false,
      })
      .listen(() =>
        info(`Preview your app at: ${bold(blueBright(`${hostname}:${port}`))}`)
      );
  }
);
