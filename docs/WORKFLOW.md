# Building Claude Code mods on Windows and macOS

The loop this repo uses for every mod: **scaffold, write, check, load, try, ship.**
Every command works in PowerShell on Windows and in zsh/bash on macOS. You
need Claude Code 2.1.287 or later (`claude --version`) and Node 18+ for the
helper scripts (the mods themselves need no Node, bundler or build step).

## 0. Decide it is a mod

| You want | Use |
| --- | --- |
| A pane, a band above the prompt, a theme, sounds, restyled rows, a `/command` that runs code with no Claude turn | **Mod** |
| Block or log a tool call with a script you already have | Settings hook |
| Instructions Claude keeps needing | Skill |
| Claude reaching an external system | MCP server |

## 1. Scaffold

```sh
node scripts/new-mod.mjs my-mod "One line about what it does"          # band starter
node scripts/new-mod.mjs my-theme "A look for the desktop app" --theme # + make-colors
```

This copies `templates/starter` into `mods/<name>/`, fills the names in, and
lists the mod in `.claude-plugin/marketplace.json`. A mod is three files plus
whatever it ships:

```
mods/my-mod/
  .claude-plugin/plugin.json   name, version, description, userConfig
  hooks/hooks.json             { "modules": ["./register.tsx"] }
  hooks/register.tsx           export const register: Register = (on, options) => { ... }
  types/index.d.ts             only if the mod keeps values in $.state
  tests/*.test.tsx             claude plugin test
  sounds/, images/             assets the mod plays or draws
```

Names: kebab-case, at most 64 characters, never starting with `claude-`.

## 2. Write it (or ask Claude to)

Fastest path: open a Claude Code session in this repo and say
`/plugin-authoring` then describe the mod, or use the `claude-mod-workflow`
skill. Claude reads the exact API for your installed version from the types
it writes beside the mod.

Writing by hand, the shape is always `on(event, matcher?, ($, e, next) => ...)`:
`$` is the whole API, `e` the event, `next(e)` hands it on. Pick the event:

| Feature | Event / call |
| --- | --- |
| Theme / colors / backdrop | `$.theme.set({ colors, backdrop })` at `session.start`; colors from `makeColors` |
| Animated backdrop | `backdrop: { scene }` + `ui.render` on `{ component: 'Backdrop' }` returning an `Svg` |
| Band above the prompt | `ui.render` on `{ component: 'AbovePrompt' }` |
| Side pane | `$.ui.open({ id, title })` + `ui.render` on `{ component: 'Pane', requestId: id }` |
| Restyle messages | `ui.render` on `UserMessage`, `AssistantMessage`, `ToolUse`, `Spinner` |
| React to a tool call | `tool.call` with `{ tool: 'Bash' }` |
| Claude finished | `turn.complete` where `e.agentId === undefined` |
| Claude needs you | `classic.Notification` (permission prompt, idle, elicitation), `classic.PermissionRequest`, `tool.call` on `AskUserQuestion` |
| Slash command | `$.command.register` in `session.start` + `command.run` with `{ command }` |
| Remember across sessions | `$.store.get/set`; across redraws `atom` + `read`/`update` from `claude-code` |

### Rules the validator enforces

- Spell every call in full at the call site: `$.store.get('x')`. Never `const ui = $.ui`.
- Pass `$` only to functions declared **at the top level of the same file**.
  Not to a closure inside `register`, not to an imported function.
  (`atom`, `read`, `update` from `claude-code` are the exceptions.)
- Event names are string literals. No dynamic `import()`. Relative imports only.
- A render hook never writes state; write from a handler or another event.

## 3. Check

```sh
node scripts/check.mjs my-mod     # or no name for every mod
```

Runs `claude plugin validate` (static analysis: the hooks and calls it found,
and anything the engine would refuse), `tsc` once the types exist, and
`claude plugin test`. Read the `calls:` and `env reads:` lines: that is the
access list you will put in the README.

Write tests with `claude-code/testing`: `mock.clock(on)`, `mock.store(on)`,
`mock.env(on, {...})`, answer engine calls with `on('process.run', ...)`, and
mount drawings with `$.ui.mount({ plugin, surface, component, props })`.
**Loop every UI test over `['terminal', 'desktop']`.**

## 4. Load it

| Where | How | Reloads on save? |
| --- | --- | --- |
| Terminal, one session | `claude --plugin-dir mods/my-mod` | Yes |
| Desktop app (Code tab), no install | `node scripts/dev-link.mjs my-mod`, then a new session | Yes (`CLAUDE_CODE_PLUGIN_DIR_WATCH=1`) |
| Installed from this folder | `claude plugin marketplace add .` then `claude plugin install my-mod@vic-mods` | After `/reload-plugins` |
| Others, from GitHub | `/plugin install my-mod --marketplace <owner>/<repo>` | `claude plugin update` |

`dev-link.mjs` writes `CLAUDE_CODE_PLUGIN_DIRS` into the `env` block of
`~/.claude/settings.json` (Windows: `C:\Users\<you>\.claude\settings.json`),
joining paths with `;` on Windows and `:` on macOS, and keeps a `.bak`.
`node scripts/dev-link.mjs --off` removes them.

Check it loaded: `/plugin` in a terminal session shows `1 mod active · my-mod`.
A mod that does nothing: run `claude --debug --plugin-dir mods/my-mod` and look
for lines starting with the mod's name.

WSL sessions in the desktop app do not load plugins. Use a native Windows session.

## 5. Try it on both platforms

What differs between Windows and macOS, learned the hard way:

| Area | macOS | Windows | What to do |
| --- | --- | --- | --- |
| `$.audio.play({ asset })` | Plays via `afplay` | **Silent, and still resolves** | Branch on `$.env.get('OS') === 'Windows_NT'` and run `powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -Command "(New-Object System.Media.SoundPlayer $env:MY_SOUND).PlaySync()"` with `$.process.run`, passing the path in `init.env` so it never becomes PowerShell code. See `mods/icq-nostalgia/hooks/sound.ts`. |
| `$.audio.speak` | `say` | Not available | Same idea with `System.Speech` |
| Paths from `$.plugin.root` | `/Users/...` | `C:\Users\...` | Build paths with the host's separator; pass them as argv or env, never inside a shell or PowerShell string |
| `$.process.run(['uname'])` | Works | Fails | Detect Windows first via `OS` |
| Env vars | `USER`, `HOME` | `USERNAME`, `USERPROFILE` | Read both |
| `CLAUDE_CODE_PLUGIN_DIRS` separator | `:` | `;` | `path.delimiter` in Node |
| Fonts | Mods paint colors and backdrops, not fonts | same | Put type tokens in the scene SVG or docs |

Then look at it in both light and dark mode, with a long code block, and at a
larger text size. The permission prompt always keeps the app's own look.

## 6. Themes

1. Copy `templates/theme/make-colors.*` into the mod's `hooks/` (`--theme` does
   this). Do not hand-write `colors`: wrong token names paint nothing silently.
2. Give `makeColors` six anchors per mode (`surface-0..2`, `text-primary/secondary/muted`)
   and five roles (`accent`, `danger`, `success`, `warning`, `pro`).
3. Fix every line in `problems` that starts with `Desktop won't paint`; the
   rest are advisory.
4. Make dark mode a second version of the idea, not an inversion.
5. A scene SVG: `viewBox` + `preserveAspectRatio="xMidYMid slice"`, under
   131,072 characters, CSS animation inside its own `<style>`, art in the corners
   and top (words sit in the middle, the prompt at the foot), and
   `@media (prefers-color-scheme: dark)` for night colors.
   Note: CSS does not reach inside `<use>` clones; set `fill` on the `<use>`'s parent.
6. Your own art only: evoke an era, never ship a company's logo or font.
7. Refresh `make-colors.*` when Claude Code updates (copy from the
   plugin-authoring skill folder of the new build).

## 7. Ship

1. Bump `version` in `plugin.json` (installed copies are cached by version).
2. README: what it does, the install line, settings, what it can access (from
   validate), and the Claude Code version you tested.
3. `node scripts/check.mjs`.
4. Push the repo to GitHub (this one: `vicdotdevelop/claude-mod-icq-theme`). Others install with
   `/plugin install <mod> --marketplace <owner>/<repo>`, or in the desktop app:
   **+** next to the prompt, **Plugins**, **Add marketplace** `<owner>/<repo>`, **Add plugin**.
5. Add the `claude-code-mod` topic to the repo so the
   [awesome-claude-code-mods](https://github.com/karanb192/awesome-claude-code-mods)
   scanner lists it.
