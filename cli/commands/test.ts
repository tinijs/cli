import {exec} from '../../lib/helpers/terminal.js';

export function testCommand() {
  exec('echo "TODO: implement the test command"', '.', 'inherit');
}
