import {concurrently} from 'concurrently';
import {watch} from 'chokidar';
import {resolve} from 'pathe';
import chalk from 'chalk';
import fsExtra from 'fs-extra';

import {log} from '../utils/message.js';
import {TiniConfig, getTiniApp} from '../../lib/classes/tini-app.js';
import {
  getAppStagingDirPath,
  buildFile,
  removeFile,
  buildStaging,
  copyPublic,
} from '../utils/build.js';

const {blueBright, bold} = chalk;
const {exists} = fsExtra;

interface DevCommandOptions {
  watch?: boolean;
}

export default async function (commandOptions: DevCommandOptions) {
  const {config: tiniConfig} = await getTiniApp();
  const {srcDir, outDir, tempDir} = tiniConfig;
  const stagingPath = getAppStagingDirPath(tempDir);
  // watch mode
  if (commandOptions.watch) {
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
    setTimeout(
      () => log(bold(blueBright('Server running at http://localhost:3000'))),
      2000
    );
  }
}

function buildOthers(tiniConfig: TiniConfig) {
  setTimeout(async () => {
    const {srcDir, outDir} = tiniConfig;
    if (await exists(resolve(outDir))) {
      // copy public dir
      await copyPublic(srcDir, outDir);
    } else {
      buildOthers(tiniConfig);
    }
  }, 2000);
}
