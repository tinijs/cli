import {TerminalService} from '../../lib/services/terminal.service';
import {ProjectService} from '../../lib/services/project.service';

interface Options {
  target?: string;
}

export class BuildCommand {
  constructor(
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  async run(options: Options) {
    const {out} = await this.projectService.getOptions();
    const target = options.target || 'production';
    this.terminalService.exec(
      `cross-env NODE_ENV=${target} parcel build app/index.html --dist-dir ${out} --no-cache`,
      '.',
      'inherit'
    );
  }
}
