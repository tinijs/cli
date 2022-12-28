import {TerminalService} from '../../lib/services/terminal.service';

export class TestCommand {
  constructor(private terminalService: TerminalService) {}

  run() {
    this.terminalService.exec(
      'echo "// TODO: implement the test command"',
      '.',
      'inherit'
    );
  }
}
