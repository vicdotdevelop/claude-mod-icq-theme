# Security

Mods run inside Claude Code with your user's permissions, unsandboxed. This
file says exactly what the mods here do, so you can check before installing.

## What `icq-nostalgia` can do

From `claude plugin validate mods/icq-nostalgia`:

| Capability | Why |
| --- | --- |
| `$.theme.set` | Paints the mint theme and backdrop |
| `$.ui.*`, `$.state.*` | Draws the status flower and name headers |
| `$.env.get` `OS`, `USER`, `USERNAME` | Detects Windows; default nickname |
| `$.process.run` `uname -s` | Tells macOS from Linux (not run on Windows) |
| `$.process.run` `powershell.exe` / `afplay` / `paplay` / `aplay` | Plays the sound |
| `$.fs.exists` | Checks for your optional custom sound file |
| `$.store` `muted` | Remembers `/icq mute` |
| `$.command.register` `/icq` | The command |

It makes no network requests, writes no files, reads no file contents, does
not approve, deny or change any tool call, and never changes what Claude sees.
Its hooks on permission prompts and `AskUserQuestion` only observe and pass the
event on unchanged.

### Process execution

- Every player starts from an argument vector, never through a shell.
- On Windows, the PowerShell command is a constant string. The sound's path is
  handed over in the `ICQ_NOSTALGIA_SOUND` environment variable, so no file
  name can inject PowerShell code.
- A custom `soundFile` must be an absolute path ending in `.wav`, with no
  control characters, and must exist; anything else is refused.
- `/icq` only accepts `test`, `mute`, `unmute` and `status`.

## The repo scripts

`scripts/*.mjs` use only Node's standard library and no dependencies.
`dev-link.mjs` edits `~/.claude/settings.json` (it keeps a `.bak`, and refuses
to touch a file that is not valid JSON). Commands run without a shell; on
Windows, when `claude` is an npm `.cmd` shim, they retry once through `cmd.exe`
with every argument quoted.

## Reporting a vulnerability

Please open a private security advisory on this repository
(Security tab, "Report a vulnerability") rather than a public issue.
