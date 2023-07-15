import * as chalk from 'chalk';

export const ANY = chalk.gray('[ANY] ');
export const ERROR = chalk.red('[ERROR] ');
export const WARN = chalk.yellow('[WARN] ');
export const INFO = chalk.blue('[INFO] ');
export const OK = chalk.green('[OK] ');
export function MISSING_ARG(name: string) {
  return `error: missing required argument '${name}'`;
}

export class MessageService {
  constructor() {}
}
