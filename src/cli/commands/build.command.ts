import {TerminalService} from '../../lib/services/terminal.service';

interface Options {
  target?: string;
}

export class BuildCommand {
  constructor(private terminalService: TerminalService) {}

  async run(options: Options) {
    const target = options.target || 'production';
    process.env.NODE_ENV = target;
    this.terminalService.exec('parcel build', '.', 'inherit');
  }
}
