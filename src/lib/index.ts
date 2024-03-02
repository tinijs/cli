import {HelperService} from './services/helper.service.js';
import {MessageService} from './services/message.service.js';
import {FileService} from './services/file.service.js';
import {DownloadService} from './services/download.service.js';
import {TerminalService} from './services/terminal.service.js';
import {ProjectService} from './services/project.service.js';
import {GenerateService} from './services/generate.service.js';
import {TypescriptService} from './services/typescript.service.js';
import {BuildService} from './services/build.service.js';
import {UiService} from './services/ui.service.js';
import {ModuleService} from './services/module.service.js';

export class Lib {
  readonly helperService: HelperService;
  readonly messageService: MessageService;
  readonly fileService: FileService;
  readonly downloadService: DownloadService;
  readonly terminalService: TerminalService;
  readonly projectService: ProjectService;
  readonly generateService: GenerateService;
  readonly typescriptService: TypescriptService;
  readonly buildService: BuildService;
  readonly uiService: UiService;
  readonly moduleService: ModuleService;

  constructor() {
    this.helperService = new HelperService();
    this.messageService = new MessageService();
    this.fileService = new FileService();
    this.downloadService = new DownloadService(this.fileService);
    this.terminalService = new TerminalService();
    this.projectService = new ProjectService(this.fileService);
    this.generateService = new GenerateService(this.projectService);
    this.typescriptService = new TypescriptService(this.fileService);
    this.buildService = new BuildService(this.fileService, this.projectService);
    this.uiService = new UiService(this.fileService, this.typescriptService);
    this.moduleService = new ModuleService(
      this.fileService,
      this.terminalService,
      this.projectService
    );
  }
}
