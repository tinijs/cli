import {TerminalService} from '../../lib/services/terminal.service';
import {ProcessorService} from '../../lib/services/processor.service';

interface Options {
  target?: string;
}

export class BuildCommand {
  constructor(
    private terminalService: TerminalService,
    private processorService: ProcessorService
  ) {}

  async run(options: Options) {
    const target = options.target || 'production';
    // clean the stage dir
    await this.processorService.resetStage();
    // process all
    await this.processorService.processAll(target);
    // reset the out dir
    await this.processorService.resetOut();
    // build
    this.terminalService.exec('npx parcel build', '.', 'inherit');
  }
}
