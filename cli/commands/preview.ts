import chalk from 'chalk';
import superstatic from 'superstatic';

import {info} from '../../lib/helpers/message.js';
import {loadProjectConfig} from '../../lib/helpers/project.js';

const {blueBright, bold} = chalk;

interface PreviewCommandOptions {
  port?: string;
  host?: string;
  i18n?: boolean;
}

export async function previewCommand(commandOptions: PreviewCommandOptions) {
  const {outDir: cwd} = await loadProjectConfig();
  // launch server
  const hostname = commandOptions.host || '0.0.0.0';
  const port = Number(commandOptions.port || 3000);
  const config = {
    cleanUrls: true,
    rewrites: [{source: '**', destination: '/index.html'}],
  } as Record<string, unknown>;
  if (commandOptions.i18n) {
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
