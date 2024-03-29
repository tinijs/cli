import {resolve} from 'path';
import {stat} from 'fs-extra';

import {FileService} from './file.service';
import {TerminalService} from './terminal.service';
import {ProjectService, Options} from './project.service';

export interface InitInstruction {
  copy?: Record<string, string>;
  scripts?: Record<string, string>;
  buildCommand?: string;
  run?: string;
}

export class ServerService {
  constructor(
    private fileService: FileService,
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  installPackage(packageName: string, tag?: string) {
    return this.terminalService.exec(
      `npm i ${packageName}${!tag ? '' : `@${tag}`}  --loglevel error`
    );
  }

  async loadInitInstruction(packageName: string) {
    const packageJsonPath = resolve(
      'node_modules',
      packageName,
      'package.json'
    );
    const packageJson = await this.fileService.readJson(packageJsonPath);
    return ((packageJson as any).tiniServer || {}) as InitInstruction;
  }

  async copyAssets(packageName: string, copy: Record<string, string>) {
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

  async updateScripts(scripts: Record<string, string>, buildCommand?: string) {
    return this.projectService.updatePackageJson(async data => {
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

  runAdditional(run: string) {
    return this.terminalService.exec(run);
  }
}
