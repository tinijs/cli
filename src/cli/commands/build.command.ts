import {TerminalService} from '../../lib/services/terminal.service';

interface Options {
  target?: string;
}

export class BuildCommand {
  constructor(private terminalService: TerminalService) {}

  async run(options: Options) {
    const target = options.target || 'production';
    this.terminalService.exec(
      `cross-env NODE_ENV=${target} parcel build --no-cache`,
      '.',
      'inherit'
    );
  }
}
