<section id="head" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

# @tinijs/cli

**The CLI for the TiniJS framework.**

</section>

<section id="tocx" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

- [@tinijs/cli](#tinijscli)
  - [Install](#install)
  - [Development](#development)
    - [The structure](#the-structure)
    - [Add a new command](#add-a-new-command)
    - [Add a new util](#add-a-new-util)
  - [License](#license)

</section>

<section id="usage">

## Install

- Create a TiniJS app:

`npx @tinijs/cli new my-app --latest`

- Or, install it globally:

`npm i -g @tinijs/cli`

For more, please visit: <https://tinijs.dev>

## Development

- Create a home for TiniJS: `mkdir TiniJS && cd TiniJS`
- Fork the repo
- Install dependencies: `cd cli && npm i`
- Make changes & build locally: `npm run build`
- Preview a command: `tini <command> [options]`
- Push changes & create a PR 👌

### The structure

The source of the package resides in the `src` folder:

- `public-api.ts`: the public interface of the package
- `cli/index.ts`: the entry of the CLI
- `cli/commands/...`: all the commands of the CLI app
- `cli/utils/...`: all the reusable functions

The test specs are in the `test` folder:

- No unit test has been written yet (please help if you can, thank you!)

### Add a new command

Add a file in `src/cli/commands/<name>.ts`, for example:

```ts
export async function <name>Command() {
  // command logic here
}
```

### Add a new util

Similar to adding a new command, add a new file: `src/lib/utils/<name>.ts`

</section>

<section id="cli" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

<h2><a name="cli-command-overview"><p>Command overview</p>
</a></h2>

The CLI for the TiniJS framework.

- [`tini add|module <packageName> --tag [value]`](#command-add)
- [`tini build --target [value]`](#command-build)
- [`tini clean|c --includes [value] --excludes [value]`](#command-clean)
- [`tini dev|serve --watch`](#command-dev)
- [`tini docs|home`](#command-docs)
- [`tini generate|create|g <type> <dest> --type-prefixed --nested`](#command-generate)
- [`tini new|start <projectName> --latest --tag [value] --skip-git --skip-ui`](#command-new)
- [`tini preview --port [value] --host [value] --i18n`](#command-preview)
- [`tini test`](#command-test)
- [`tini ui <subCommand> [params...] --build-only --skip-help --hook [path] --output [path] --react`](#command-ui)
- [`tini help`](#command-help)
- [`tini *`](#command-*)

<h2><a name="cli-command-reference"><p>Command reference</p>
</a></h2>

<h3><a name="command-add"><p><code>add</code></p>
</a></h3>

Add a module to the current project.

**Usage:**

```sh
tini add <packageName> --tag [value]
tini module <packageName> --tag [value]
```

**Parameters:**

- `<packageName>`: The module package name.

**Options:**

- `-t, --tag [value]`: Use the custom version of the package.

<h3><a name="command-build"><p><code>build</code></p>
</a></h3>

Build the app.

**Usage:**

```sh
tini build --target [value]
```

**Options:**

- `-t, --target [value]`: Target: production (default), qa1, any, ...

<h3><a name="command-clean"><p><code>clean</code></p>
</a></h3>

Clean Typescript output files.

**Usage:**

```sh
tini clean --includes [value] --excludes [value]
tini c --includes [value] --excludes [value]
```

**Options:**

- `-i, --includes [value]`: Including files, separated by |.
- `-e, --excludes [value]`: Excluding files, separated by |.

<h3><a name="command-dev"><p><code>dev</code></p>
</a></h3>

Start the dev server.

**Usage:**

```sh
tini dev --watch
tini serve --watch
```

**Options:**

- `-w, --watch`: Watch mode only.

<h3><a name="command-docs"><p><code>docs</code></p>
</a></h3>

Open documentation.

**Usage:**

```sh
tini docs
tini home
```

<h3><a name="command-generate"><p><code>generate</code></p>
</a></h3>

Generate a resource.

**Usage:**

```sh
tini generate <type> <dest> --type-prefixed --nested
tini create <type> <dest> --type-prefixed --nested
tini g <type> <dest> --type-prefixed --nested
```

**Parameters:**

- `<type>`: The resource type
- `<dest>`: The resource destination

**Options:**

- `-t, --type-prefixed`: Use the format [name].[type].[ext].
- `-n, --nested`: Nested under a folder.

<h3><a name="command-new"><p><code>new</code></p>
</a></h3>

Create a new project.

**Usage:**

```sh
tini new <projectName> --latest --tag [value] --skip-git --skip-ui
tini start <projectName> --latest --tag [value] --skip-git --skip-ui
```

**Parameters:**

- `<projectName>`: The project name.

**Options:**

- `-l, --latest`: Install the latest @tinijs/skeleton.
- `-t, --tag [value]`: Use the custom version of the @tinijs/skeleton.
- `-g, --skip-git`: Do not initialize a git repository.
- `-u, --skip-ui`: Do not run: tini ui use.

<h3><a name="command-preview"><p><code>preview</code></p>
</a></h3>

Preview the app.

**Usage:**

```sh
tini preview --port [value] --host [value] --i18n
```

**Options:**

- `-p, --port [value]`: Custom port.
- `-h, --host [value]`: Custom host.
- `-i, --i18n`: Enable superstatic i18n.

<h3><a name="command-test"><p><code>test</code></p>
</a></h3>

Unit test the app.

**Usage:**

```sh
tini test
```

<h3><a name="command-ui"><p><code>ui</code></p>
</a></h3>

Tools for developing and using Tini UI.

**Usage:**

```sh
tini ui <subCommand> [params...] --build-only --skip-help --hook [path] --output [path] --react
```

**Parameters:**

- `<subCommand>`: The `<subCommand>` parameter.
- `[params...]`: The `[params...]` parameter.

**Options:**

- `-b, --build-only`: Build mode only of the use command.
- `-i, --skip-help`: Skip instruction of the use command.
- `-h, --hook [path]`: Path to a hook file.
- `-o, --output [path]`: Custom output folder.
- `-r, --react`: Build for React.

<h3><a name="command-help"><p><code>help</code></p>
</a></h3>

Display help.

**Usage:**

```sh
tini help
```

<h3><a name="command-*"><p><code>*</code></p>
</a></h3>

Any other command is not suppoted.

**Usage:**

```sh
tini <cmd>
```

</section>

<section id="license" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

## License

**@tinijs/cli** is released under the [MIT](https://github.com/tinijs/cli/blob/master/LICENSE) license.

</section>
