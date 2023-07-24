import {remove} from 'fs-extra';
import {resolve} from 'path';
import {minifyHTMLLiterals} from 'minify-html-literals';
import {compileStringAsync} from 'sass';

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

  resolveStagingPath(srcDir: string, stagingPrefix: string) {
    return resolve(`${stagingPrefix}-${srcDir}`);
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
    if (isMain && Object.keys(appConfig.pwa).length) {
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
    // dev or no return html`...`
    if (isDev || !templateMatching) return content;
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
      if ('serviceWorker' in navigator) {
        this.$workbox = new Workbox('/sw.js');
        this.$workbox.register();
      }
    `;
    // import workbox-window
    content = "import {Workbox} from 'workbox-window';\n" + content;
    // add code
    const anchorMatching = content.match(/(onCreate\()([\s\S]*?)(\{)/);
    if (anchorMatching) {
      const anchorStr = anchorMatching[0];
      content = content.replace(anchorStr, anchorStr + `\n${wbCode}`);
    } else {
      const anchorStr = 'export class AppRoot extends TiniComponent {';
      content = content.replace(
        anchorStr,
        anchorStr + `\nonCreate() {${wbCode}}`
      );
    }
    return content;
  }
}