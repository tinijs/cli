import {concurrently} from 'concurrently';
import {watch} from 'chokidar';
import {resolve} from 'pathe';
import {consola} from 'consola';
import {blueBright, bold} from 'colorette';
import {existsSync} from 'node:fs';

import {TiniConfig, getTiniApp} from 'tinijs';

import {
  getAppStagingDirPath,
  buildFile,
  removeFile,
  buildStaging,
  copyPublic,
} from '../utils/build.js';
import {defineTiniCommand} from '../utils/cli.js';

function buildOthers(tiniConfig: TiniConfig) {
  setTimeout(async () => {
    const {srcDir, outDir} = tiniConfig;
    if (existsSync(resolve(outDir))) {
      // copy public dir
      await copyPublic(srcDir, outDir);
    } else {
      buildOthers(tiniConfig);
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
    const {config: tiniConfig} = await getTiniApp();
    const {srcDir, outDir, tempDir} = tiniConfig;
    const stagingPath = getAppStagingDirPath(tempDir);
    // watch mode
    if (args.watch) {
      watch(srcDir, {ignoreInitial: true})
        .on('add', path => buildFile(path, stagingPath, srcDir))
        .on('change', path => buildFile(path, stagingPath, srcDir))
        .on('unlink', path => removeFile(path, stagingPath, srcDir));
    } else {
      // build staging
      await buildStaging();
      // start dev server
      concurrently([
        {
          command: `parcel "${stagingPath}/index.html" --dist-dir ${outDir} --port 3000 --no-cache --log-level none`,
        },
        {command: 'tini dev --watch'},
      ]);
      // other assets
      buildOthers(tiniConfig);
      // running
      setTimeout(() => callbacks?.onServerStart(), 2000);
    }
  },
  {
    onServerStart: () =>
      consola.log(bold(blueBright('Server running at http://localhost:3000'))),
  }
);

export default devCommand;
