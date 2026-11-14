#!/usr/bin/env node
// Load mods from this repo in the Claude desktop app without installing them.
//
//   node scripts/dev-link.mjs <name> [<name>...]   add mods
//   node scripts/dev-link.mjs --off                remove this repo's mods
//
// It writes CLAUDE_CODE_PLUGIN_DIRS (and CLAUDE_CODE_PLUGIN_DIR_WATCH=1, so the
// desktop app hot-reloads on save) into the `env` block of
// ~/.claude/settings.json. Claude Code reads that variable from there for
// sessions the desktop app starts. Paths are joined with the platform's
// separator: ";" on Windows, ":" on macOS/Linux.
//
// A backup of settings.json is written next to it first. Start a new session
// in the Code tab afterwards.

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { delimiter, dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MOD_NAME } from './lib.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const settingsPath = join(homedir(), '.claude', 'settings.json')
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: node scripts/dev-link.mjs <mod-name> [...] | --off')
  process.exit(1)
}

mkdirSync(dirname(settingsPath), { recursive: true })
let settings = {}
if (existsSync(settingsPath)) {
  try {
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'))
  } catch {
    console.error(`${settingsPath} is not valid JSON; fix it first, nothing was changed.`)
    process.exit(1)
  }
}
if (existsSync(settingsPath)) copyFileSync(settingsPath, `${settingsPath}.bak`)

const env = (settings.env ??= {})
const modsRoot = resolve(root, 'mods')
const isOurs = p => resolve(p).startsWith(modsRoot + sep)
const current = (env.CLAUDE_CODE_PLUGIN_DIRS ?? '').split(delimiter).filter(Boolean)
const others = current.filter(p => !isOurs(p))

let next
if (args.includes('--off')) {
  next = others
} else {
  if (!args.every(name => MOD_NAME.test(name))) {
    console.error('Mod names are kebab-case folder names under mods/.')
    process.exit(1)
  }
  const wanted = args.map(name => resolve(modsRoot, name))
  for (const dir of wanted) {
    if (!existsSync(join(dir, '.claude-plugin', 'plugin.json'))) {
      console.error(`No mod at ${dir}`)
      process.exit(1)
    }
  }
  const ours = current.filter(isOurs)
  next = [...others, ...new Set([...ours, ...wanted])]
}

if (next.length) {
  env.CLAUDE_CODE_PLUGIN_DIRS = next.join(delimiter)
  env.CLAUDE_CODE_PLUGIN_DIR_WATCH = '1'
} else {
  delete env.CLAUDE_CODE_PLUGIN_DIRS
  delete env.CLAUDE_CODE_PLUGIN_DIR_WATCH
}
if (Object.keys(env).length === 0) delete settings.env

writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n')
console.log(`Updated ${settingsPath} (backup: settings.json.bak)`)
console.log(next.length ? `CLAUDE_CODE_PLUGIN_DIRS = ${env.CLAUDE_CODE_PLUGIN_DIRS}` : 'No dev mods linked.')
console.log('Start a new session in the desktop app (Code tab) to load the change.')
