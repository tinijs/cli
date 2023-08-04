import * as chalk from 'chalk';

export const ERROR = chalk.red('✖ ');
export const WARN = chalk.yellow('⚠ ');
export const INFO = chalk.blue('ℹ ');
export const OK = chalk.green('✔ ');
export function MISSING_ARG(name: string) {
  return `error: missing required argument '${name}'`;
}

export class MessageService {
  constructor() {}
}
