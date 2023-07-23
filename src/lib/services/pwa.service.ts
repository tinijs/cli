import {resolve} from 'path';
import {FileService} from './file.service';
import {TerminalService} from './terminal.service';
import {ProjectService, Options} from './project.service';

export class PwaService {
  private VENDOR_PATH = 'node_modules/@tinijs/pwa/assets';

  private SW_PATH = 'app/sw.ts';
  private MANIFEST_PATH = 'app/manifest.webmanifest';
  private ICONS_PATH = 'assets/icons';

  constructor(
    private fileService: FileService,
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  private swFileExists() {
    return this.fileService.exists(resolve(this.SW_PATH));
  }

  private manifestFileExists() {
    return this.fileService.exists(resolve(this.MANIFEST_PATH));
  }

  private iconsFolderExists() {
    return this.fileService.exists(resolve(this.ICONS_PATH));
  }

  async assetsExist() {
    const sw = await this.swFileExists();
    const manifest = await this.manifestFileExists();
    const icons = await this.iconsFolderExists();
    return sw && manifest && icons;
  }

  installPackages(version: string) {
    this.terminalService.exec(
      `npm install --save @tinijs/pwa@${version}  --loglevel error`
    );
  }

  async copyAssets() {
    const assetArr = [] as string[][];
    // app/sw.ts
    const sw = await this.swFileExists();
    if (!sw) {
      assetArr.push([this.SW_PATH.replace('app/', ''), this.SW_PATH]);
    }
    // app/manifest.webmanifest
    const manifest = await this.manifestFileExists();
    if (!manifest) {
      assetArr.push([
        this.MANIFEST_PATH.replace('app/', ''),
        this.MANIFEST_PATH,
      ]);
    }
    // assets/icons
    const icons = await this.iconsFolderExists();
    if (!icons) {
      const vendorIconsPath = `${this.VENDOR_PATH}/icons`;
      const iconFilePaths = await this.fileService.listDir(vendorIconsPath);
      for (let i = 0; i < iconFilePaths.length; i++) {
        const filePath = iconFilePaths[i].replace(
          vendorIconsPath,
          this.ICONS_PATH
        );
        assetArr.push([filePath.replace('assets/', ''), filePath]);
      }
    }
    // copy
    await this.fileService.createDir(resolve(this.ICONS_PATH));
    return Promise.all(
      assetArr.map(([src0, dest0]) => {
        const src = resolve(`${this.VENDOR_PATH}/${src0}`);
        const dest = resolve(dest0);
        return this.fileService.copyFile(src, dest);
      })
    );
  }

  async modifyFiles() {
    // app.html
    await this.fileService.changeContent(
      resolve('app', 'app.html'),
      content => {
        const manifestUrl = './manifest.webmanifest';
        if (content.indexOf(manifestUrl) !== -1) return content;
        const template = `
    <!-- PWA -->
    <link rel="manifest" href="${manifestUrl}">
    <script src="https://cdn.jsdelivr.net/npm/pwacompat" crossorigin="anonymous" async></script>
    <link rel="icon" type="image/png" href="../assets/icons/icon-128x128.png" sizes="128x128">`;
        const themeColorMatching = content.match(
          /(<meta name="theme-color")([\s\S]*?)(>)/
        );
        if (themeColorMatching) {
          const anchorStr = themeColorMatching[0];
          return content.replace(anchorStr, anchorStr + template);
        } else {
          const anchorStr = '</head>';
          return content.replace(anchorStr, template + '\n  ' + anchorStr);
        }
      }
    );
    // tini.config.json
    await this.projectService.updateOptions(
      async options =>
        ({
          ...options,
          pwa: {
            globPatterns: [
              '**/*.html',
              '**/*.css',
              '**/*.js',
              '**/*.ico',
              '**/*.jpg',
              '**/*.png',
              '**/*.webp',
              '**/*.svg',
            ],
          },
        } as Options)
    );
  }
}
