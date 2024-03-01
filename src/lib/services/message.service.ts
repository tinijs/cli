import * as chalk from 'chalk';

export const ERROR = chalk.red('✖ ');
export const WARN = chalk.yellow('⚠ ');
export const INFO = chalk.blue('ℹ ');
export const OK = chalk.green('✔ ');

export function MISSING_ARG(name: string) {
  return `error: missing required argument '${name}'`;
}

export function INVALID_SUB_COMMAND(
  subCommand: string,
  availableSubCommands: Record<string, string>
) {
  return (
    '\n' +
    ERROR +
    `Invalid sub-command '${chalk.red(subCommand)}', available: ${Object.values(
      availableSubCommands
    ).join(', ')}.\n`
  );
}

export class MessageService {
  constructor() {}
}
