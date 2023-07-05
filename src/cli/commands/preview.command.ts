import * as chalk from 'chalk';
const superstatic = require('superstatic');

import {INFO} from '../../lib/services/message.service';
import {ProjectService} from '../../lib/services/project.service';

interface CommandOptions {
  port?: string;
  host?: string;
  i18n?: boolean;
}

export class PreviewCommand {
  constructor(private projectService: ProjectService) {}

  async run(commandOptions: CommandOptions) {
    const {out: cwd} = await this.projectService.getOptions();
    // launch server
    const host = commandOptions.host || '0.0.0.0';
    const port = commandOptions.port || 8080;
    const config = {
      cleanUrls: true,
      rewrites: [{source: '**', destination: '/app.html'}],
    } as Record<string, unknown>;
    if (commandOptions.i18n) {
      config.i18n = {root: '/'};
    }
    superstatic
      .server({
        host,
        port,
        cwd,
        config,
        debug: false,
      })
      .listen(() =>
        console.log(
          INFO + 'Preview your app at: ' + chalk.blue(`${host}:${port}`)
        )
      );
  }
}
