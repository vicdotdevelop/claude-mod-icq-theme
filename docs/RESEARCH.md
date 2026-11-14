# What popular mods teach (November 2026)

Sources read for this workflow: the official docs (mods overview, create,
interface), Anthropic's built-in mods in `anthropics/claude-code/mods`, the
`plugin-authoring` skill shipped with Claude Code 2.1.325, and the
[awesome-claude-code-mods](https://github.com/karanb192/awesome-claude-code-mods)
catalogue (8,393 scanned mods), from which these were read in full:

| Mod | Stars* | Lesson taken |
| --- | --- | --- |
| `anthropics/claude-code` `mods/diff`, `agents-md` | built in | Folder layout, `userConfig` with `options`, tests under `tests/` named for the file they cover, one `describe` per file |
| `Plagemes/claude-mods` `soundpack` | 6 | `$.audio.play` is macOS-only and reports success when silent; cooldown per sound; `classic.PermissionRequest` + `classic.Notification` fire together, so dedupe; play from `$.clock.after(0)` so no hook waits |
| `angeldelbiondo/claude-chat-bubbles` | 3 | Messenger-style rows: wrap `await next(e)` in a `Box` to keep the app's own row (images, files) and add your own header; `origin.kind` in `composer/sdk/bridge` = your prompts; mirror `$.state` to `$.store` for persistence |
| `hellosverre/claude-skins`, `GarvitNangru` `firelight`, `theonly1me` `looks` | 294 / 33 / 4 | Themes ship as data via `makeColors`; offer light and dark; a `/command` to switch |
| `davila7` `spooky-season` | 33k (repo) | A themed band above the prompt and themed turn words go a long way |
| `ray-amjad` `cache-clock` | 115 | A one-line band is the most-installed UI shape |

\* stars of the containing repository at scan time.

## Patterns worth copying

- **Observe, don't gate.** Most hooks should `return next(e)` (or `await next(e)`
  then act). Validate flags hooks at gating sites without `.catch`; for pure
  observers that is fine, since a failure skips the hook and the event goes on.
- **Never block on side effects.** Sounds, network, and processes go through
  `$.clock.after(0, ...)`.
- **Draw on every surface.** `e.surface` is `terminal`, `desktop`, `vscode` or
  `mobile`; elements come from `$.ui.resolve(e)` and differ per surface
  (`Svg` is not on the terminal).
- **Keep drawing state in `$.state`** (survives hot reload), module variables
  only for caches.
- **Ship an access list.** The catalogue shows what each mod can read, write,
  run and send; users check it before installing. Copy validate's `calls:` line
  into the README.
- **Tests catch real bugs.** In `icq-nostalgia` the first test run found that
  a cooldown initialised to `0` swallowed the first sound under a mocked clock.
