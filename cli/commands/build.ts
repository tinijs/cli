import {resolve} from 'pathe';
import {execaCommand} from 'execa';
import {remove} from 'fs-extra/esm';

import {getTiniApp} from '@tinijs/core';

import {loadPrebuilder, loadBuilder, buildPublic} from '../utils/build.js';
import {defineCliCommand} from '../utils/cli.js';

export const buildCommand = defineCliCommand(
  {
    meta: {
      name: 'build',
      description: 'Build the app.',
    },
    args: {
      target: {
        alias: 't',
        type: 'string',
        description: 'Target: production (default), qa1, any, ...',
      },
    },
  },
  async args => {
    const targetEnv = args.target || 'production';
    process.env.NODE_ENV = targetEnv;
    process.env.TARGET_ENV = targetEnv;
    const tiniApp = await getTiniApp();
    const {config: tiniConfig, hooks} = tiniApp;
    const prebuilder = await loadPrebuilder(tiniApp);
    const builder = await loadBuilder(tiniApp);
    // clean
    await remove(resolve(tiniConfig.outDir));
    // prebuild
    await prebuilder?.build();
    // build
    await hooks.callHook('build:before');
    if (builder.build instanceof Function) {
      await builder.build();
    } else {
      await execaCommand(builder.build.command, {stdio: 'inherit'});
    }
    await buildPublic(tiniConfig);
    await hooks.callHook('build:after');
  }
);

export default buildCommand;
