import {resolve} from 'pathe';
import {loadConfig} from 'c12';
import fsExtra from 'fs-extra';

import {Lib as TiniModule} from '../index.js';
import {FileService} from './file.service.js';
import {TerminalService} from './terminal.service.js';
import {ProjectService} from './project.service.js';

const {stat} = fsExtra;

export interface ModuleConfig {
  init?: ModuleInit;
  build?: (options: any, tiniModule: TiniModule) => void;
}

export interface ModuleInit {
  copy?: Record<string, string>;
  scripts?: Record<string, string>;
  buildCommand?: string;
  run?: string | ((tiniModule: TiniModule) => void);
}

export function defineTiniModule(config: ModuleConfig) {
  return config;
}

export class ModuleService {
  constructor(
    private tiniModule: TiniModule,
    private fileService: FileService,
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  installPackage(packageName: string, tag?: string) {
    return this.terminalService.exec(
      `npm i ${packageName}${!tag ? '' : `@${tag}`}  --loglevel error`
    );
  }

  async loadModuleConfig(packageName: string) {
    const loadResult = await loadConfig({
      cwd: resolve('node_modules', packageName),
      configFile: 'tini.module',
      rcFile: false,
    });
    return loadResult.config as ModuleConfig;
  }

  async copyAssets(packageName: string, copy: NonNullable<ModuleInit['copy']>) {
    for (const from in copy) {
      const fromPath = resolve('node_modules', packageName, from);
      const toPath = resolve(copy[from]);
      if (
        (await this.fileService.exists(fromPath)) &&
        !(await this.fileService.exists(toPath))
      ) {
        const stats = await stat(fromPath);
        if (stats.isFile()) {
          await this.fileService.copyFile(fromPath, toPath);
        } else if (stats.isDirectory()) {
          await this.fileService.copyDir(fromPath, toPath);
        }
      }
    }
  }

  async updateScripts(
    scripts: NonNullable<ModuleInit['scripts']>,
    buildCommand?: ModuleInit['buildCommand']
  ) {
    return this.projectService.modifyProjectPackageJson(async data => {
      const build = [
        (data.scripts as any).build,
        !buildCommand ? undefined : `npm run ${buildCommand}`,
      ]
        .filter(Boolean)
        .join(' && ');
      data.scripts = {
        ...scripts,
        ...data.scripts,
        ...(!build ? {} : {build}),
      };
      return data;
    });
  }

  initRun(run: NonNullable<ModuleInit['run']>) {
    return run instanceof Function
      ? run(this.tiniModule)
      : this.terminalService.exec(
          run.startsWith('npx ') ? run : `npm run ${run}`
        );
  }
}
