import {ERROR} from '../../lib/services/message.service';

export interface ServerAddCommandOptions {
  skipInstall?: boolean;
  tag?: string;
}

export class ServerAddCommand {
  constructor() {}

  run(packageName: string, commandOptions: ServerAddCommandOptions) {
    if (!packageName) {
      return console.log('\n' + ERROR + 'Package name is required.\n');
    }
    console.log('ServerAddCommand', packageName);
  }
}
