# @tinijs/cli

**The CLI for the TiniJS framework and beyond.**

- [@tinijs/cli](#tinijscli)
  - [Install](#install)
  - [Usage](#usage)
    - [Using in a TiniJS app](#using-in-a-tinijs-app)
    - [Customize commands and expand the CLI](#customize-commands-and-expand-the-cli)
  - [Development](#development)
    - [The structure](#the-structure)
    - [Add a new command](#add-a-new-command)
    - [Add a new util](#add-a-new-util)
  - [License](#license)

## Install

- Create a TiniJS app:

`npx @tinijs/cli new my-app --latest`

- Or, add it to an existing project:

`npm i -g @tinijs/cli`

- Or, install it globally:

`npm i -g @tinijs/cli`

For more, please visit: <https://tinijs.dev>

## Usage

### Using in a TiniJS app

Please run `tini` for available commands and usage detail.

### Customize commands and expand the CLI

TODO

## Development

- Create a home for TiniJS: `mkdir TiniJS && cd TiniJS`
- Fork the repo
- Install dependencies: `cd cli && npm i`
- Make changes & build locally: `npm run build`
- Preview a command: `tini <command> [options]`
- Push changes & create a PR 👌

### The structure

Public APIs exported from:
- `public-api.ts`: the public interface of the package

The source of the CLI resides in the `cli` folder:
- `cli/index.ts`: the entry of the CLI
- `cli/commands/...`: all the commands of the CLI app
- `cli/utils/...`: all the reusable functions

The test specs are in the `test` folder:
- No unit test has been written yet (please help if you can, thank you!)

### Add a new command

Add a file in `cli/commands/<name>.ts`, for example:

```ts
import {defineTiniCommand} from '../utils/cli.js';

export const xxxCommand = defineTiniCommand(
  { /* command definition */ },
  async (args, callbacks) => {
    // run logic
  },
  { /* optional callbacks */ },
);

export default xxxCommand;
```

### Add a new util

Similar to adding a new command, add a new file: `cli/utils/<name>.ts`

## License

**@tinijs/cli** is released under the [MIT](https://github.com/tinijs/cli/blob/master/LICENSE) license.
