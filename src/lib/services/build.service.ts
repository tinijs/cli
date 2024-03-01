import {remove} from 'fs-extra';
import {resolve} from 'pathe';
import {minifyHTMLLiterals} from 'minify-html-literals';
import {compileStringAsync} from 'sass';
import {
  transpileModule,
  ScriptTarget,
  ModuleKind,
  ModuleResolutionKind,
} from 'typescript';
import {gray, cyan, red, bold, magenta, green} from 'chalk';
import {stat} from 'fs-extra';
import {getManifest} from 'workbox-build';
import {build as esBuild} from 'esbuild';
import {nanoid} from 'nanoid';

import {FileService} from '../../lib/services/file.service';
import {
  ProjectService,
  ProjectOptions,
} from '../../lib/services/project.service';

export class BuildService {
  constructor(
    private fileService: FileService,
    private projectService: ProjectService
  ) {}

  getAppStagingDirPath(stagingDir: string) {
    return resolve(stagingDir, 'app');
  }

  async buildStaging() {
    const {srcDir, stagingDir} = await this.projectService.getOptions();
    const srcPath = resolve(srcDir);
    const stagingPath = this.getAppStagingDirPath(stagingDir);
    await this.fileService.cleanDir(stagingPath);
    const paths = await this.fileService.listDir(srcPath);
    for (let i = 0; i < paths.length; i++) {
      await this.buildFile(paths[i], stagingPath, srcDir);
    }
    return stagingPath;
  }

  async copyPublic(srcDir: string, outDir: string) {
    const inPath = resolve(srcDir, 'public');
    const outPath = resolve(outDir);
    if (
      (await this.fileService.exists(inPath)) &&
      (await this.fileService.exists(outPath))
    ) {
      await this.fileService.copyDir(inPath, outPath);
    }
  }

  async removeFile(path: string, stagingPath: string, srcDir: string) {
    const {outFilePath} = this.extractPathValues(
      resolve(path),
      stagingPath,
      srcDir
    );
    return remove(outFilePath);
  }

  async buildFile(path: string, stagingPath: string, srcDir: string) {
    path = resolve(path);
    const {fileName, fileExt, dirPath, outFilePath} = this.extractPathValues(
      path,
      stagingPath,
      srcDir
    );
    const appConfig = await this.projectService.getOptions();
    // create dir
    await this.fileService.createDir(resolve(stagingPath, dirPath));
    // app.html -> index.html
    if (fileName === 'app.html') {
      await this.fileService.createFile(
        outFilePath.replace('/app.html', '/index.html'),
        await this.buildIndexHTML(path)
      );
    } else if (fileExt === 'ts') {
      await this.fileService.createFile(
        outFilePath,
        await this.buildTS(path, appConfig)
      );
    } else {
      await this.fileService.copyFile(path, outFilePath);
    }
  }

  async buildPWA(appConfig: ProjectOptions) {
    const SW_TS = 'sw.ts';
    const SW_JS = 'sw.js';
    const {srcDir, outDir, pwa: pwaPrecaching} = appConfig;
    const startTime = new Date().getTime();
    // read sw.ts
    const tsCode = await this.fileService.readText(resolve(srcDir, SW_TS));
    // transpile
    let {outputText: code} = transpileModule(tsCode, {
      compilerOptions: {
        noEmit: false,
        sourceMap: false,
        skipLibCheck: true,
        moduleResolution: ModuleResolutionKind.NodeJs,
        module: ModuleKind.ESNext,
        target: ScriptTarget.ESNext,
      },
    });
    // inject precaching entries
    if (pwaPrecaching?.globPatterns) {
      const {manifestEntries} = await getManifest({
        globDirectory: outDir,
        ...(pwaPrecaching || {}),
      });
      code =
        `
import {precacheAndRoute} from 'workbox-precaching';
precacheAndRoute(${JSON.stringify(manifestEntries)});
      \n` + code;
    }
    // save file
    const swPath = resolve(outDir, SW_JS);
    await this.fileService.createFile(swPath, code);
    // bundle
    try {
      await esBuild({
        entryPoints: [`${outDir}/sw.js`],
        allowOverwrite: true,
        bundle: true,
        sourcemap: true,
        minify: true,
        outdir: outDir,
      });
      if (this.projectService.targetEnv !== 'development') {
        const endTime = new Date().getTime();
        const timeSecs = ((endTime - startTime) / 1000).toFixed(2);
        const fileStat = await stat(swPath);
        process.stdout.write(
          `${gray(outDir + '/')}${bold(cyan(SW_JS))}          ${bold(
            magenta((fileStat.size / 1024).toFixed(2) + ' KB')
          )}    ${bold(green(timeSecs + 's'))}\n`
        );
      }
    } catch (error: unknown) {
      process.stdout.write(
        red(`Failed to build ${outDir}/${SW_JS}, please try again!`) + '\n'
      );
    }
  }

  private buildIndexHTML(path: string) {
    return this.fileService.readText(path);
  }

  private async buildTS(path: string, appConfig: ProjectOptions) {
    const targetEnv = this.projectService.targetEnv;
    const isDev = targetEnv === 'development';
    const isMain = this.isAppEntry(path);
    const isConfig = this.isConfigFile(path);
    let content = await this.fileService.readText(path);

    /*
     * 1. Configs
     */
    // inject envs
    if (isConfig) {
      content = this.injectEnvs(content);
    }
    // replace imports
    if (!isDev) {
      content = content.replace(
        /(\/configs\/development)/g,
        `/configs/${targetEnv}`
      );
    }

    /*
     * 2. HTML, CSS, Assets
     */
    content = this.processAssets(content);
    content = this.processHTML(content, isDev, appConfig);
    content = await this.processCSS(content, isDev);

    /*
     * 3. PWA
     */
    if (isMain && (await this.projectService.isPWAEnabled(appConfig))) {
      content = this.injectPWA(content);
    }

    // result
    return content;
  }

  private isAppEntry(filePath: string) {
    return filePath.match(/\/?app\/app.ts$/);
  }

  private isConfigFile(filePath: string) {
    return ~filePath.indexOf(`configs/${this.projectService.targetEnv}.ts`);
  }

  private extractPathValues(
    fullPath: string,
    stagingPath: string,
    srcDir: string
  ) {
    const filePath = fullPath.split(`/${srcDir}/`).pop() as string;
    const outFilePath = resolve(stagingPath, filePath);
    const filePathArr = filePath.split('/');
    const fileName = filePathArr.pop() as string;
    const fileExt = fileName.split('.').pop();
    const dirPath = filePathArr.join('/');
    const topDir = filePath.split('/')[0];
    return {filePath, outFilePath, fileName, fileExt, dirPath, topDir};
  }

  private injectEnvs(content: string) {
    const envMatchingArr = content.match(/process\.env\.([\s\S]*?)(,|\n)/g);
    if (envMatchingArr?.length) {
      envMatchingArr.forEach(envMatching => {
        const replaceStr = envMatching.replace(/,|\n/g, '');
        content = content.replace(
          replaceStr,
          `"${process.env[replaceStr.replace('process.env.', '')]}"`
        );
      });
    }
    return content;
  }

  private processHTML(
    content: string,
    isDev: boolean,
    appConfig: ProjectOptions
  ) {
    const templateMatching = content.match(/(return html`)([\s\S]*?)(`;)/);
    // no return html`...`
    if (!templateMatching) return content;
    // process generic component
    if (appConfig.precompileGeneric === 'lite') {
      const genericMatchingArr = content.match(
        /<tini-generic(-unscoped)?([\s\S]*?)>/g
      );
      genericMatchingArr?.forEach(genericMatching => {
        if (~genericMatching.indexOf('precomputed=')) return;
        const tag = ~genericMatching.indexOf('-unscoped')
          ? 'tini-generic-unscoped'
          : 'tini-generic';
        content = content.replace(
          genericMatching,
          genericMatching.replace(
            `<${tag}`,
            `<${tag} precomputed="${nanoid(7)}"`
          )
        );
      });
    } else if (appConfig.precompileGeneric === 'full') {
      // TODO: full precompile
    }
    // dev mode
    if (isDev) return content;
    // minify
    const matchedTemplate = templateMatching[0];
    let minifiedTemplate: string;
    try {
      if (appConfig.skipMinifyHTMLLiterals) {
        minifiedTemplate = matchedTemplate;
      } else {
        const result = minifyHTMLLiterals(matchedTemplate);
        if (!result) throw new Error('minifyHTMLLiterals() failed.');
        minifiedTemplate = result.code;
      }
    } catch (err) {
      minifiedTemplate = matchedTemplate;
    }
    return content.replace(matchedTemplate, minifiedTemplate);
  }

  private async processCSS(content: string, isDev: boolean) {
    const stylesMatchingArr = content.match(/(css`)([\s\S]*?)(`,|`;)/g);
    // no css``
    if (!stylesMatchingArr) return content;
    // compile scss
    for (let i = 0; i < stylesMatchingArr.length; i++) {
      const styleMatching = stylesMatchingArr[i];
      // original
      let originalStyles = styleMatching.replace('css`', '');
      originalStyles = originalStyles.substring(0, originalStyles.length - 2);
      // compile
      let compiledStyles: string;
      try {
        compiledStyles = (
          await compileStringAsync(originalStyles, {
            style: isDev ? 'expanded' : 'compressed',
          })
        ).css;
      } catch (err) {
        compiledStyles = isDev
          ? originalStyles
          : originalStyles
              .replace(/(?:\r\n|\r|\n)/g, '')
              .replace(/\s\s+/g, ' ');
      }
      // replacing
      content = content.replace(originalStyles, compiledStyles);
    }
    return content;
  }

  private processAssets(content: string) {
    const formats = [
      // images
      'jpe?g',
      'png',
      'webp',
      'svg',
      'bmp',
      'gif',
      'ico',
      'tiff?',
      // audios
      'mp3',
      'ogg',
      'aac',
      'wav',
      'midi?',
      // videos
      'mp4',
      'webm',
      'flv',
      'm3u8',
      'mpd',
      // fonts
      'ttf',
      'otf',
      'woff2?',
      // documents
      'txt',
      'md',
      'pdf',
      'docx?',
      'pptx?',
      'xlsx?',
      'odt',
    ];
    const lookups = [
      ['src="', '"'],
      ['srcset="', '"'],
      ['href="', '"'],
      ["url\\('", "'\\)"],
      ["asset\\('", "'\\)"],
    ];
    const validator = new RegExp(`\\.(${formats.join('|')})`, 'i');
    for (let i = 0; i < lookups.length; i++) {
      const [A, B] = lookups[i];
      const matchingArr = (
        content.match(new RegExp(`(${A})([\\s\\S]*?)(${B})`, 'g')) || []
      ).filter(item => validator.test(item));
      for (let i = 0; i < matchingArr.length; i++) {
        const originalStr = matchingArr[i];
        const url = originalStr
          .replace(A.replace('\\', ''), '')
          .replace(B.replace('\\', ''), '');
        const URL = `new URL('${url}', import.meta.url)`;
        // build new str
        let newStr = originalStr;
        if (/(src|srcset|href)/.test(A)) {
          const newA = A.replace('"', '');
          const newB = '';
          newStr = `${newA}\${${URL}}${newB}`;
        } else if (/(url)/.test(A)) {
          const newA = A.replace(/(\\|')/g, '');
          const newB = ')';
          newStr = `${newA}\${${URL}}${newB}`;
        } else {
          newStr = URL;
        }
        // apply new content
        content = content.replace(originalStr, newStr);
      }
    }
    return content;
  }

  private injectPWA(content: string) {
    const wbCode = `
      (this as typeof this & AppWithWorkbox).workbox = registerServiceWorker();
    `;
    // registerServiceWorker
    content =
      "import {AppWithWorkbox, registerServiceWorker} from '@tinijs/pwa';\n" +
      content;
    // add code
    const anchorMatching = content.match(/onCreate\(([\s\S]*?)\{/);
    if (anchorMatching) {
      const anchorStr = anchorMatching[0];
      content = content.replace(anchorStr, anchorStr + `\n${wbCode}`);
    } else {
      const appRootMatching = content.match(/export class AppRoot([\s\S]*?)\{/);
      if (appRootMatching) {
        const anchorStr = appRootMatching[0];
        content = content.replace(
          anchorStr,
          anchorStr + `\n  onCreate() {${wbCode}}`
        );
      }
    }
    return content;
  }
}
