import chalk from 'chalk';

const {red, green, blue, yellow} = chalk;

export const ERROR = red('✖ ');
export const WARN = yellow('⚠ ');
export const INFO = blue('ℹ ');
export const OK = green('✔ ');

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
    `Invalid sub-command '${red(subCommand)}', available: ${Object.values(
      availableSubCommands
    ).join(', ')}.\n`
  );
}

export class MessageService {
  constructor() {}
}
