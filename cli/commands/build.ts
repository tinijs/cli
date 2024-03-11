import {resolve} from 'pathe';
import {execaCommand} from 'execa';
import {remove} from 'fs-extra/esm';

import {getTiniApp} from 'tinijs';

import {
  getAppStagingDirPath,
  buildStaging,
  copyPublic,
} from '../utils/build.js';
import {defineTiniCommand} from '../utils/cli.js';

export const buildCommand = defineTiniCommand(
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
    process.env.TARGET_ENV = args.target || 'production';
    const {config: tiniConfig} = await getTiniApp();
    const {srcDir, outDir, tempDir} = tiniConfig;
    const stagingPath = getAppStagingDirPath(tempDir);
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
);

export default buildCommand;
