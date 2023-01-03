import {TerminalService} from '../../lib/services/terminal.service';

export class DevCommand {
  constructor(private terminalService: TerminalService) {}

  async run() {
    this.terminalService.exec(
      'parcel serve --no-cache --port 3000',
      '.',
      'inherit'
    );
  }
}
