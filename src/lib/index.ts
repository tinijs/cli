import {HelperService} from './services/helper.service';
import {MessageService} from './services/message.service';
import {FileService} from './services/file.service';
import {DownloadService} from './services/download.service';
import {TerminalService} from './services/terminal.service';
import {ProjectService} from './services/project.service';
import {GenerateService} from './services/generate.service';
import {BuilderService} from './services/builder.service';

export class Lib {
  public readonly helperService: HelperService;
  public readonly messageService: MessageService;
  public readonly fileService: FileService;
  public readonly downloadService: DownloadService;
  public readonly terminalService: TerminalService;
  public readonly projectService: ProjectService;
  public readonly generateService: GenerateService;
  public readonly builderService: BuilderService;

  constructor() {
    this.helperService = new HelperService();
    this.messageService = new MessageService();
    this.fileService = new FileService();
    this.downloadService = new DownloadService(this.fileService);
    this.terminalService = new TerminalService();
    this.projectService = new ProjectService(this.fileService);
    this.generateService = new GenerateService(this.projectService);
    this.builderService = new BuilderService(
      this.fileService,
      this.projectService
    );
  }
}
