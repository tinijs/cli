import fsExtra from 'fs-extra';
import {resolve} from 'pathe';
import {execaCommand} from 'execa';

import {getTiniApp} from '../helpers/tini.js';
import {
  getAppStagingDirPath,
  buildStaging,
  copyPublic,
} from '../helpers/build.js';

const {remove} = fsExtra;

interface BuildCommandOptions {
  target?: string;
}

export default async function (commandOptions: BuildCommandOptions) {
  process.env.TARGET_ENV = commandOptions.target || 'production';
  const {config: tiniConfig} = await getTiniApp();
  const {srcDir, outDir, stagingDir} = tiniConfig;
  const stagingPath = getAppStagingDirPath(stagingDir);
  // clean target dir
  await remove(resolve(outDir));
  // build staging
  await buildStaging();
  // build target
  await execaCommand(
    `npx cross-env NODE_ENV=${process.env.TARGET_ENV} parcel build "${stagingPath}/index.html" --dist-dir ${outDir} --no-cache`,
    {
      cwd: '.',
      stdio: 'inherit',
    }
  );
  // copy public dir
  await copyPublic(srcDir, outDir);
}
