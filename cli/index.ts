#!/usr/bin/env node
import {SubCommandsDef, defineCommand, runMain} from 'citty';

import {TiniConfig, getTiniApp} from '../lib/classes/tini-app.js';
import {resolveCommand} from './utils/cli.js';
import {loadCliPackageJson} from './utils/project.js';

function getSubCommands({cli: {docs, preview} = {}}: TiniConfig) {
  const subs: SubCommandsDef =  {};
  if (docs !== false) subs.docs = () => import('./commands/docs.js').then(resolveCommand);
  if (preview !== false) subs.preview = () => import('./commands/preview.js').then(resolveCommand);
  return subs;
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
        // tiniApp.hooks.callHook('cli:setup', tiniApp);
      },
      cleanup() {
        // tiniApp.hooks.callHook('cli:cleanup', tiniApp);
      },
      subCommands: getSubCommands(tiniApp.config),
    })
  );
}

runApp();
