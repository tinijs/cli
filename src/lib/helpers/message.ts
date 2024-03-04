import chalk from 'chalk';

const {red, green, blue, yellow} = chalk;

export function logMissingArg(name: string) {
  log(`error: missing required argument '${name}'`, true);
}

export function errorInvalidSubCommand(
  subCommand: string,
  availableSubCommands: Record<string, string>
) {
  error(
    `Invalid sub-command '${subCommand}', available: ${Object.values(
      availableSubCommands
    ).join(', ')}.`
  );
}

export function log(message: string, compact = false) {
  message = message.trim();
  if (!compact) message = '\n' + message + '\n';
  console.log(message);
}

export function success(message: string, compact = false) {
  log(green('✔ ') + message, compact);
}

export function info(message: string, compact = false) {
  log(blue('ℹ ') + message, compact);
}

export function warn(message: string, compact = false) {
  log(yellow('⚠ ') + message, compact);
}

export function error(message: string, compact = false) {
  log(red('✖ ') + message, compact);
}
