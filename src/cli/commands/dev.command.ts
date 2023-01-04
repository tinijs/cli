import {TerminalService} from '../../lib/services/terminal.service';
import {ProjectService} from '../../lib/services/project.service';

export class DevCommand {
  constructor(
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  async run() {
    const {out} = await this.projectService.getOptions();
    this.terminalService.exec(
      `parcel app/index.html --dist-dir ${out} --port 3000 --no-cache`,
      '.',
      'inherit'
    );
  }
}
