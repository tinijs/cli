import chalk from 'chalk';

const {red, green, blue, yellow} = chalk;

export class MessageService {
  constructor() {}

  logMissingArg(name: string) {
    this.log(`error: missing required argument '${name}'`, true);
  }

  errorInvalidSubCommand(
    subCommand: string,
    availableSubCommands: Record<string, string>
  ) {
    this.error(
      `Invalid sub-command '${subCommand}', available: ${Object.values(
        availableSubCommands
      ).join(', ')}.`
    );
  }

  log(message: string, compact = false) {
    message = message.trim();
    if (!compact) message = '\n' + message + '\n';
    console.log(message);
  }

  success(message: string, compact = false) {
    this.log(green('✔ ') + message, compact);
  }

  info(message: string, compact = false) {
    this.log(blue('ℹ ') + message, compact);
  }

  warn(message: string, compact = false) {
    this.log(yellow('⚠ ') + message, compact);
  }

  error(message: string, compact = false) {
    this.log(red('✖ ') + message, compact);
  }
}
