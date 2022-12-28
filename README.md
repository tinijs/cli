<section id="head" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

# @tinijs/cli

**The CLI for the TiniJS framework.**

</section>

<section id="tocx" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

- [Command overview](#cli-command-overview)
- [Command reference](#cli-command-reference)
  - [`build`](#command-build)
  - [`dev`](#command-dev)
  - [`docs`](#command-docs)
  - [`new`](#command-new)
  - [`preview`](#command-preview)
  - [`test`](#command-test)
  - [`help`](#command-help)
  - [`*`](#command-*)
- [Detail API reference](https://example.com)


</section>

<section id="cli" data-note="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY!">

<h2><a name="cli-command-overview"><p>Command overview</p>
</a></h2>

The CLI for the TiniJS framework.

- [`tini build`](#command-build)
- [`tini dev|serve`](#command-dev)
- [`tini docs|home`](#command-docs)
- [`tini new|start <projectName> --skip-install --skip-git`](#command-new)
- [`tini preview --port [value] --host [value] --i18n`](#command-preview)
- [`tini test`](#command-test)
- [`tini help`](#command-help)
- [`tini *`](#command-*)

<h2><a name="cli-command-reference"><p>Command reference</p>
</a></h2>

<h3><a name="command-build"><p><code>build</code></p>
</a></h3>

Build the app.

**Usage:**

```sh
tini build
```

<h3><a name="command-dev"><p><code>dev</code></p>
</a></h3>

Start the dev server.

**Usage:**

```sh
tini dev
tini serve
```

<h3><a name="command-docs"><p><code>docs</code></p>
</a></h3>

Open documentation.

**Usage:**

```sh
tini docs
tini home
```

<h3><a name="command-new"><p><code>new</code></p>
</a></h3>

Create a new project.

**Usage:**

```sh
tini new <projectName> --skip-install --skip-git
tini start <projectName> --skip-install --skip-git
```

**Parameters:**

- `<projectName>`: The project name.

**Options:**

- `-i, --skip-install`: Do not install dependency packages.
- `-g, --skip-git`: Do not initialize a git repository.

<h3><a name="command-preview"><p><code>preview</code></p>
</a></h3>

Preview the app.

**Usage:**

```sh
tini preview --port [value] --host [value] --i18n
```

**Options:**

- `-p, --port [value]`: Custom port
- `-h, --host [value]`: Custom host
- `-i, --i18n`: Enable i18n

<h3><a name="command-test"><p><code>test</code></p>
</a></h3>

Unit test the app.

**Usage:**

```sh
tini test
```

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
