import {TerminalService} from '../../lib/services/terminal.service';
import {ProcessorService} from '../../lib/services/processor.service';

interface Options {
  watch?: boolean;
}

export class DevCommand {
  private target = 'development';

  constructor(
    private terminalService: TerminalService,
    private processorService: ProcessorService
  ) {}

  async run(options: Options) {
    if (options.watch) {
      // clean the stage dir
      await this.processorService.resetStage();
      // process all
      await this.processorService.processAll(this.target);
      // watch for change
      await this.processorService.watch(this.target);
    } else {
      this.terminalService.exec(
        'npx concurrently "tini serve -w" "parcel serve -p 3000"',
        '.',
        'inherit'
      );
    }
  }
}
