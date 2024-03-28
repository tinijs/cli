<section id="head" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

# @tinijs/cli

> [!IMPORTANT]
> This previously experiment is wrapped up, moving forward the development will happen at <https://github.com/tinijs/tinijs/tree/main/packages/cli>.
>
> If you want to use the experimental version still, please use the version `0.16.0`.

**The CLI for the TiniJS framework.**

</section>

<section id="tocx" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

- [Install](#install)
- [Development](#development)
  - [The structure](#the-structure)
  - [Add new command](#add-new-command)
- [Command overview](#cli-command-overview)
- [Command reference](#cli-command-reference)
  - [`build`](#command-build)
  - [`clean`](#command-clean)
  - [`dev`](#command-dev)
  - [`docs`](#command-docs)
  - [`generate`](#command-generate)
  - [`new`](#command-new)
  - [`preview`](#command-preview)
  - [`pwa`](#command-pwa)
  - [`test`](#command-test)
  - [`ui`](#command-ui)
  - [`help`](#command-help)
  - [`*`](#command-*)
- [Detail API reference](https://cli-api.tinijs.dev)


</section>

<section id="usage">

## Install

- Create a TiniJS app:

`npx @tinijs/cli@0.16.0 new my-app --latest`

- Or, install it globally:

`npm i -g @tinijs/cli@0.16.0`

For more, please visit: <https://tinijs.dev>

## Development

- Create a home for TiniJS: `mkdir TiniJS && cd TiniJS`
- Fork the repo
- Install dependencies: `cd cli && npm i`
- Make changes & build locally: `npm run build`
- Preview a command: `tini <command> [options]`
- Push changes & create a PR 👌

### The structure

This project uses a design pattern called `seminjecto` (it's a term which I invented some years ago).

The source of the package resides in the `src` folder:

- `public-api.ts`: the public interface of the package
- `bin.ts`: the entry of the CLI
- `lib/index.ts`: the container for all shared features
- `lib/services/...`: all the reusable services
- `cli/index.ts`: the container of the CLI app
- `cli/commands/...`: all the commands of the CLI app

The test specs are in the `test` folder:

- No unit test has been written yet (please help if you can, thank you!)

### Add new command

- Install the `@lamnhan/seminjecto` CLI tool: `npm i -g @lamnhan/seminjecto` (the tool is quite outdated but it is still working :), I will update it when I have more time).
- Run: `semidi g command commands/<name>`

A file will be create in `src/cli/commands/<name>.command.ts`.

Beside, the command definition code will be injected into `src/cli/index.ts`.

</section>

<section id="cli" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

<h2><a name="cli-command-overview"><p>Command overview</p>
</a></h2>

The CLI for the TiniJS framework.

- [`tini build --target [value]`](#command-build)
- [`tini clean|c --includes [value] --excludes [value]`](#command-clean)
- [`tini dev|serve --watch`](#command-dev)
- [`tini docs|home`](#command-docs)
- [`tini generate|create|g <type> <dest> --type-prefixed --nested`](#command-generate)
- [`tini new|start <projectName> --latest --tag [value] --skip-install --skip-ui --skip-git`](#command-new)
- [`tini preview --port [value] --host [value] --i18n`](#command-preview)
- [`tini pwa <subCommand> --tag [value]`](#command-pwa)
- [`tini test`](#command-test)
- [`tini ui <subCommand> [params...] --build-only --skip-help`](#command-ui)
- [`tini help`](#command-help)
- [`tini *`](#command-*)

<h2><a name="cli-command-reference"><p>Command reference</p>
</a></h2>

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
tini new <projectName> --latest --tag [value] --skip-install --skip-ui --skip-git
tini start <projectName> --latest --tag [value] --skip-install --skip-ui --skip-git
```

**Parameters:**

- `<projectName>`: The project name.

**Options:**

- `-l, --latest`: Install the latest @tinijs/skeleton.
- `-t, --tag [value]`: Use the custom version of the @tinijs/skeleton.
- `-i, --skip-install`: Do not install dependency packages.
- `-u, --skip-ui`: Do not run tini ui use.
- `-g, --skip-git`: Do not initialize a git repository.

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

<h3><a name="command-pwa"><p><code>pwa</code></p>
</a></h3>

Working with PWA apps.

**Usage:**

```sh
tini pwa <subCommand> --tag [value]
```

**Parameters:**

- `<subCommand>`: The `<subCommand>` parameter.

**Options:**

- `-t, --tag [value]`: Use the custom version of @tinijs/pwa.

<h3><a name="command-test"><p><code>test</code></p>
</a></h3>

Unit test the app.

**Usage:**

```sh
tini test
```

<h3><a name="command-ui"><p><code>ui</code></p>
</a></h3>

Tools for developing and using Tini.

**Usage:**

```sh
tini ui <subCommand> [params...] --build-only --skip-help
```

**Parameters:**

- `<subCommand>`: The `<subCommand>` parameter.
- `[params...]`: The `[params...]` parameter.

**Options:**

- `-b, --build-only`: Build mode only of the use command.
- `-i, --skip-help`: Skip instruction of the use command.

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
