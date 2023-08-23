import {resolve} from 'path';
import {FileService} from './file.service';
import {TerminalService} from './terminal.service';
import {ProjectService, Options} from './project.service';

export class PwaService {
  private readonly VENDOR_DIR = 'node_modules/@tinijs/pwa/assets';

  private readonly SW_FILE = 'sw.ts';
  private readonly MANIFEST_FILE = 'manifest.webmanifest';
  private readonly ICONS_DIR = 'icons';

  constructor(
    private fileService: FileService,
    private terminalService: TerminalService,
    private projectService: ProjectService
  ) {}

  private swFileExists() {
    return this.fileService.exists(resolve('app', this.SW_FILE));
  }

  private manifestFileExists() {
    return this.fileService.exists(resolve('app', this.MANIFEST_FILE));
  }

  private iconsFolderExists() {
    return this.fileService.exists(resolve('app', this.ICONS_DIR));
  }

  async assetsExist() {
    const sw = await this.swFileExists();
    const manifest = await this.manifestFileExists();
    const icons = await this.iconsFolderExists();
    return sw && manifest && icons;
  }

  installPackages(version: string) {
    this.terminalService.exec(`npm i @tinijs/pwa@${version}  --loglevel error`);
  }

  async copyAssets() {
    // app/sw.ts
    const swFileExists = await this.swFileExists();
    if (!swFileExists) {
      this.fileService.copyFile(
        resolve(this.VENDOR_DIR, this.SW_FILE),
        resolve('app', this.SW_FILE)
      );
    }
    // app/manifest.webmanifest
    const manifestFileExists = await this.manifestFileExists();
    if (!manifestFileExists) {
      this.fileService.copyFile(
        resolve(this.VENDOR_DIR, this.MANIFEST_FILE),
        resolve('app', this.MANIFEST_FILE)
      );
    }
    // app/assets/icons
    const iconsDirExists = await this.iconsFolderExists();
    if (!iconsDirExists) {
      this.fileService.copyDir(
        resolve(this.VENDOR_DIR, this.ICONS_DIR),
        resolve('app', 'assets', this.ICONS_DIR)
      );
    }
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
    <link rel="icon" type="image/png" href="./assets/icons/icon-128x128.png" sizes="128x128">`;
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
              '**/*.svg',
              '**/*.webp',
              '**/*.jpg',
              '**/*.png',
              '**/*.woff',
              '**/*.woff2',
              '**/*.ttf',
              '**/*.otf',
            ],
          },
        }) as Options
    );
  }
}
