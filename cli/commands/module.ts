import {blueBright} from 'colorette';
import {consola} from 'consola';

import {getTiniApp, loadModule} from 'tinijs';

import {errorUncleanGit} from '../utils/message.js';
import {
  installPackage,
  copyAssets,
  updateScripts,
  initRun,
} from '../utils/module.js';
import {isGitClean} from '../utils/git.js';
import {defineTiniCommand} from '../utils/cli.js';

export const moduleCommand = defineTiniCommand(
  {
    meta: {
      name: 'module',
      description: 'Add a module to the current project.',
    },
    args: {
      packageName: {
        type: 'positional',
        description: 'The package name to install.',
      },
      tag: {
        alias: 't',
        type: 'string',
        description: 'Use the custom version of the package.',
      },
    },
  },
  async (args, callbacks) => {
    if (!isGitClean()) return errorUncleanGit();
    const {config: tiniConfig} = await getTiniApp();
    // install packages
    await installPackage(args.packageName, args.tag);
    // handle init
    const tiniModule = await loadModule(args.packageName);
    if (tiniModule?.init) {
      const {copy, scripts, buildCommand, run} = tiniModule.init(tiniConfig);
      // copy assets
      if (copy) await copyAssets(args.packageName, copy);
      // add scripts
      if (scripts) await updateScripts(scripts, buildCommand);
      // run
      if (run) await initRun(run);
    }
    // done
    callbacks?.onEnd(args.packageName);
  },
  {
    onEnd: (packageName: string) =>
      consola.success(`Add module ${blueBright(packageName)} successfully.`),
  }
);

export default moduleCommand;
