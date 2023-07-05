import {TerminalService} from '../../lib/services/terminal.service';
import {ProjectService} from '../../lib/services/project.service';

interface CommandOptions {
  target?: string;
}

export class BuildCommand {
  constructor(
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  async run(commandOptions: CommandOptions) {
    const {out} = await this.projectService.getOptions();
    const target = commandOptions.target || 'production';
    this.terminalService.exec(
      `cross-env NODE_ENV=${target} parcel build app/app.html --dist-dir ${out} --no-cache --no-scope-hoist`,
      '.',
      'inherit'
    );
  }
}
