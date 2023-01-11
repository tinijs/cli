import * as chalk from 'chalk';
const superstatic = require('superstatic');

import {INFO} from '../../lib/services/message.service';
import {ProjectService} from '../../lib/services/project.service';

interface Options {
  port?: string;
  host?: string;
  i18n?: boolean;
}

export class PreviewCommand {
  constructor(private projectService: ProjectService) {}

  async run(options: Options) {
    const {out: cwd} = await this.projectService.getOptions();
    // launch server
    const host = options.host || '0.0.0.0';
    const port = options.port || 8080;
    const config = {
      cleanUrls: true,
      rewrites: [{source: '**', destination: '/index.html'}],
    } as Record<string, unknown>;
    if (options.i18n) {
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
