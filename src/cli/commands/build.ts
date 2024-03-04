import fsExtra from 'fs-extra';
import {resolve} from 'pathe';

import {exec} from '../../lib/helpers/terminal.js';
import {loadProjectConfig} from '../../lib/helpers/project.js';
import {
  getAppStagingDirPath,
  buildStaging,
  copyPublic,
} from '../../lib/helpers/build.js';

const {remove} = fsExtra;

interface BuildCommandOptions {
  target?: string;
}

export async function buildCommand(commandOptions: BuildCommandOptions) {
  process.env.TARGET_ENV = commandOptions.target || 'production';
  const projectConfig = await loadProjectConfig();
  const {srcDir, outDir, stagingDir} = projectConfig;
  const stagingPath = getAppStagingDirPath(stagingDir);
  // clean target dir
  await remove(resolve(outDir));
  // build staging
  await buildStaging();
  // build target
  exec(
    `npx cross-env NODE_ENV=${process.env.TARGET_ENV} parcel build "${stagingPath}/index.html" --dist-dir ${outDir} --no-cache`,
    '.',
    'inherit'
  );
  // copy public dir
  await copyPublic(srcDir, outDir);
}
