import chalk from 'chalk';
import superstatic from 'superstatic';

import {INFO} from '../../lib/services/message.service.js';
import {ProjectService} from '../../lib/services/project.service.js';

const {blueBright, bold} = chalk;

interface CommandOptions {
  port?: string;
  host?: string;
  i18n?: boolean;
}

export class PreviewCommand {
  constructor(private projectService: ProjectService) {}

  async run(commandOptions: CommandOptions) {
    const {outDir: cwd} = await this.projectService.getOptions();
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
        console.log(
          '\n' +
            INFO +
            'Preview your app at: ' +
            bold(blueBright(`${hostname}:${port}`)) +
            '\n'
        )
      );
  }
}
