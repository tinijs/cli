#!/usr/bin/env node
import {SubCommandsDef, defineCommand, runMain} from 'citty';

import {TiniConfig, getTiniApp} from 'tinijs';

import {loadCliPackageJson} from './utils/project.js';
import {resolveCommand, getExpandedCommands} from './utils/cli.js';

async function getCommands({cli}: TiniConfig) {
  const commands: SubCommandsDef = {};
  // built-in commands
  if (cli?.docs !== false)
    commands.docs = () => import('./commands/docs.js').then(resolveCommand);
  if (cli?.new !== false)
    commands.new = () => import('./commands/new.js').then(resolveCommand);
  if (cli?.dev !== false)
    commands.dev = () => import('./commands/dev.js').then(resolveCommand);
  if (cli?.build !== false)
    commands.build = () => import('./commands/build.js').then(resolveCommand);
  if (cli?.preview !== false)
    commands.preview = () =>
      import('./commands/preview.js').then(resolveCommand);
  if (cli?.module !== false)
    commands.module = () => import('./commands/module.js').then(resolveCommand);
  if (cli?.generate !== false)
    commands.generate = () =>
      import('./commands/generate.js').then(resolveCommand);
  if (cli?.clean !== false)
    commands.clean = () => import('./commands/clean.js').then(resolveCommand);
  // expanded commands
  const expandedCommands = await getExpandedCommands();
  for (const [key, value] of Object.entries(expandedCommands)) {
    if (commands[key]) continue;
    commands[key] = value;
  }
  // result
  return commands;
}

async function runApp() {
  const {version, description} = await loadCliPackageJson();
  const tiniApp = await getTiniApp();
  return runMain(
    defineCommand({
      meta: {
        name: 'tini',
        version,
        description,
      },
      setup() {
        tiniApp.hooks.callHook('cli:setup');
      },
      cleanup() {
        tiniApp.hooks.callHook('cli:cleanup');
      },
      subCommands: await getCommands(tiniApp.config),
    })
  );
}

runApp();
