# Contributing

Thanks for helping! The full development loop is in
[docs/WORKFLOW.md](docs/WORKFLOW.md). In short:

1. `node scripts/new-mod.mjs <name> "<description>"` for a new mod, or edit one under `mods/`.
2. `node scripts/check.mjs` must pass (validate + tests). CI runs it on Windows, macOS and Linux.
3. Try it for real: `claude --plugin-dir mods/<name>` or `node scripts/dev-link.mjs <name>` for the desktop app, in light and dark mode.
4. Keep mods free of third-party logos, artwork, fonts and sounds. Original or generated assets only.
5. Update the mod's README, `SECURITY.md` if its access list changes, and `CHANGELOG.md`.
