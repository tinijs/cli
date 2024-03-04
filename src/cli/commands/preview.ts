import chalk from 'chalk';
import superstatic from 'superstatic';

import {MessageService} from '../../lib/services/message.service.js';
import {ProjectService} from '../../lib/services/project.service.js';

const {blueBright, bold} = chalk;

interface PreviewCommandOptions {
  port?: string;
  host?: string;
  i18n?: boolean;
}

export class PreviewCommand {
  constructor(
    private messageService: MessageService,
    private projectService: ProjectService
  ) {}

  async run(commandOptions: PreviewCommandOptions) {
    const {outDir: cwd} = await this.projectService.loadProjectConfig();
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
        this.messageService.info(
          `Preview your app at: ${bold(blueBright(`${hostname}:${port}`))}`
        )
      );
  }
}
