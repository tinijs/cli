import {TerminalService} from '../../lib/services/terminal.service';

export class DevCommand {
  constructor(private terminalService: TerminalService) {}

  async run() {
    this.terminalService.exec('parcel serve -p 3000', '.', 'inherit');
  }
}
