import {HelperService} from './services/helper.service.js';
import {MessageService} from './services/message.service.js';
import {FileService} from './services/file.service.js';
import {DownloadService} from './services/download.service.js';
import {TerminalService} from './services/terminal.service.js';
import {ProjectService} from './services/project.service.js';
import {GenerateService} from './services/generate.service.js';
import {PwaService} from './services/pwa.service.js';
import {TypescriptService} from './services/typescript.service.js';
import {BuildService} from './services/build.service.js';
import {UiService} from './services/ui.service.js';
import {ServerService} from './services/server.service.js';

export class Lib {
  readonly helperService: HelperService;
  readonly messageService: MessageService;
  readonly fileService: FileService;
  readonly downloadService: DownloadService;
  readonly terminalService: TerminalService;
  readonly projectService: ProjectService;
  readonly generateService: GenerateService;
  readonly pwaService: PwaService;
  readonly typescriptService: TypescriptService;
  readonly buildService: BuildService;
  readonly uiService: UiService;
  readonly serverService: ServerService;

  constructor() {
    this.helperService = new HelperService();
    this.messageService = new MessageService();
    this.fileService = new FileService();
    this.downloadService = new DownloadService(this.fileService);
    this.terminalService = new TerminalService();
    this.projectService = new ProjectService(this.fileService);
    this.generateService = new GenerateService(this.projectService);
    this.pwaService = new PwaService(
      this.fileService,
      this.terminalService,
      this.projectService
    );
    this.typescriptService = new TypescriptService(this.fileService);
    this.buildService = new BuildService(this.fileService, this.projectService);
    this.uiService = new UiService(this.fileService, this.typescriptService);
    this.serverService = new ServerService(
      this.fileService,
      this.terminalService,
      this.projectService
    );
  }
}
