# icq-nostalgia

Claude Code dressed as a 2007 instant messenger: mint theme, glossy title-bar
backdrop with blossoms, `Name (hh:mm):` headers in blue and orange, a status
flower above the prompt, and a chime when Claude needs you. Unofficial fan
theme, not affiliated with ICQ.

Install, settings, screenshots and the security notes are in the
[repository README](../../README.md). Design tokens are in [DESIGN.md](DESIGN.md).

```text
/plugin install icq-nostalgia --marketplace vicdotdevelop/claude-mod-icq-theme
```

## Files

| Path | What it is |
| --- | --- |
| `hooks/register.tsx` | All hooks: theme, headers, status band, spinner, sound triggers, `/icq` |
| `hooks/sound.ts` | Picks the file and the player for macOS, Windows and Linux |
| `hooks/look.ts`, `hooks/design.ts` | The palette and design tokens |
| `hooks/scene.ts` | The backdrop SVG |
| `hooks/make-colors.*` | Palette builder from Claude Code 2.1.325's plugin-authoring skill (do not edit) |
| `sounds/message.wav` | The original chime (`node scripts/make-chime.mjs` regenerates it) |
| `tests/register.test.tsx` | `claude plugin test` suite |

Tested with Claude Code 2.1.325.
