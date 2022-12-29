import {TerminalService} from '../../lib/services/terminal.service';
import {ProcessorService} from '../../lib/services/processor.service';

interface Options {
  headless?: boolean;
}

export class DevCommand {
  private target = 'development';

  constructor(
    private terminalService: TerminalService,
    private processorService: ProcessorService
  ) {}

  async run(options: Options) {
    if (!options.headless) {
      // reset the out dir
      await this.processorService.resetOut();
      // clean the stage dir
      await this.processorService.resetStage();
      // process all
      await this.processorService.processAll(this.target);
      // run commands
      this.terminalService.exec(
        'npx concurrently "tini serve --headless" "parcel serve -p 3000"',
        '.',
        'inherit'
      );
    } else {
      // watch for change
      await this.processorService.watch(this.target);
    }
  }
}
