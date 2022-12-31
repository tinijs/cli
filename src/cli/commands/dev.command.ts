import {TerminalService} from '../../lib/services/terminal.service';
import {BuilderService} from '../../lib/services/builder.service';

interface Options {
  headless?: boolean;
}

export class DevCommand {
  private target = 'development';

  constructor(
    private terminalService: TerminalService,
    private builderService: BuilderService
  ) {}

  async run(options: Options) {
    if (!options.headless) {
      // reset the out dir
      await this.builderService.resetOut();
      // clean the stage dir
      await this.builderService.resetStage();
      // process all
      await this.builderService.processAll(this.target);
      // run commands
      this.terminalService.exec(
        'npx concurrently "tini serve --headless" "parcel serve -p 3000"',
        '.',
        'inherit'
      );
    } else {
      // watch for change
      await this.builderService.watch(this.target);
    }
  }
}
