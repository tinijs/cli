import {execaCommand} from 'execa';

export function testCommand() {
  execaCommand('echo "TODO: implement the test command"', {
    cwd: '.',
    stdio: 'inherit',
  });
}
