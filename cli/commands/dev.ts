import {concurrently} from 'concurrently';
import {watch} from 'chokidar';
import {resolve} from 'pathe';
import {consola} from 'consola';
import {execaCommand} from 'execa';
import {blueBright} from 'colorette';
import {existsSync} from 'node:fs';
import {remove} from 'fs-extra/esm';

import {TiniConfig, getTiniApp} from '@tinijs/core';

import {loadPrebuilder, loadBuilder, buildPublic} from '../utils/build.js';
import {defineTiniCommand} from '../utils/cli.js';

function checkAndbuildPublic(tiniConfig: TiniConfig) {
  setTimeout(async () => {
    if (existsSync(resolve(tiniConfig.outDir))) {
      await buildPublic(tiniConfig);
    } else {
      checkAndbuildPublic(tiniConfig);
    }
  }, 2000);
}

export const devCommand = defineTiniCommand(
  {
    meta: {
      name: 'dev',
      description: 'Start the dev server.',
    },
    args: {
      watch: {
        alias: 'w',
        type: 'boolean',
        description: 'Watch mode only.',
      },
    },
  },
  async (args, callbacks) => {
    const tiniApp = await getTiniApp();
    const {config: tiniConfig} = tiniApp;
    const prebuilder = await loadPrebuilder(tiniApp);
    // watch mode
    if (args.watch) {
      if (prebuilder) {
        watch(tiniConfig.srcDir, {ignoreInitial: true})
          .on('add', path => prebuilder.buildFile(path))
          .on('change', path => prebuilder.buildFile(path))
          .on('unlink', path =>
            remove(
              resolve(
                tiniConfig.tempDir,
                path.split(`/${tiniConfig.srcDir}/`).pop() as string
              )
            )
          );
      } else {
        callbacks?.onUselessWatch?.();
      }
    } else {
      const builder = await loadBuilder(tiniApp);
      // prebuild
      await prebuilder?.build();
      // start dev server
      if (builder.dev instanceof Function) {
        await builder.dev();
      } else {
        if (prebuilder) {
          concurrently([
            {command: builder.dev.command},
            {command: 'tini dev --watch'},
          ]);
        } else {
          await execaCommand(builder.dev.command, {stdio: 'inherit'});
        }
        const customOnServerStart = builder.dev.onServerStart;
        setTimeout(() => callbacks?.onServerStart(customOnServerStart), 2000);
      }
      // public
      checkAndbuildPublic(tiniConfig);
    }
  },
  {
    onUselessWatch: () =>
      consola.warn('The --watch option is useless while prebuild is disabled.'),
    onServerStart: (customCallback?: () => void) =>
      customCallback
        ? customCallback()
        : consola.info(
            `Server running at: ${blueBright('http://localhost:3000')}`
          ),
  }
);

export default devCommand;
