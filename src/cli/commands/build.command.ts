import {TerminalService} from '../../lib/services/terminal.service';
import {BuilderService} from '../../lib/services/builder.service';

interface Options {
  target?: string;
}

export class BuildCommand {
  constructor(
    private terminalService: TerminalService,
    private builderService: BuilderService
  ) {}

  async run(options: Options) {
    const target = options.target || 'production';
    // clean the stage dir
    await this.builderService.resetStage();
    // process all
    await this.builderService.processAll(target);
    // reset the out dir
    await this.builderService.resetOut();
    // build
    this.terminalService.exec('npx parcel build', '.', 'inherit');
  }
}
