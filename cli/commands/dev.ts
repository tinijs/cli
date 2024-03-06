import {concurrently} from 'concurrently';
import {watch} from 'chokidar';
import {resolve} from 'pathe';
import chalk from 'chalk';
import fsExtra from 'fs-extra';

import {log} from '../helpers/message.js';
import {ProjectConfig, loadProjectConfig} from '../helpers/project.js';
import {
  getAppStagingDirPath,
  buildFile,
  removeFile,
  buildStaging,
  copyPublic,
} from '../helpers/build.js';

const {blueBright, bold} = chalk;
const {pathExists} = fsExtra;

interface DevCommandOptions {
  watch?: boolean;
}

export default async function (commandOptions: DevCommandOptions) {
  const projectConfig = await loadProjectConfig();
  const {srcDir, outDir, stagingDir} = projectConfig;
  const stagingPath = getAppStagingDirPath(stagingDir);
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
    buildOthers(projectConfig);
    // running
    setTimeout(
      () => log(bold(blueBright('Server running at http://localhost:3000'))),
      2000
    );
  }
}

function buildOthers(projectConfig: ProjectConfig) {
  setTimeout(async () => {
    const {srcDir, outDir} = projectConfig;
    if (await pathExists(resolve(outDir))) {
      // copy public dir
      await copyPublic(srcDir, outDir);
    } else {
      buildOthers(projectConfig);
    }
  }, 2000);
}
