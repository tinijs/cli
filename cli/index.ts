#!/usr/bin/env node
import {SubCommandsDef, defineCommand, runMain} from 'citty';

import {TiniApp, getTiniApp} from '@tinijs/core';

import {loadCliPackageJson} from './utils/project.js';
import {resolveCommand, setupCliExpansion} from './utils/cli.js';

async function getCommands(tiniApp: TiniApp) {
  const cliConfig = tiniApp.config.cli;
  const commands: SubCommandsDef = {};
  // built-in commands
  if (cliConfig?.docs !== false)
    commands.docs = () => import('./commands/docs.js').then(resolveCommand);
  if (cliConfig?.new !== false)
    commands.new = () => import('./commands/new.js').then(resolveCommand);
  if (cliConfig?.dev !== false)
    commands.dev = () => import('./commands/dev.js').then(resolveCommand);
  if (cliConfig?.build !== false)
    commands.build = () => import('./commands/build.js').then(resolveCommand);
  if (cliConfig?.preview !== false)
    commands.preview = () =>
      import('./commands/preview.js').then(resolveCommand);
  if (cliConfig?.module !== false)
    commands.module = () => import('./commands/module.js').then(resolveCommand);
  if (cliConfig?.generate !== false)
    commands.generate = () =>
      import('./commands/generate.js').then(resolveCommand);
  // expanded commands
  const expandedCommands = await setupCliExpansion(tiniApp);
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
      subCommands: await getCommands(tiniApp),
    })
  );
}

runApp();
