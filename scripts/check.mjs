#!/usr/bin/env node
// Validate, type-check and test one mod or all of them.
//
//   node scripts/check.mjs            every folder under mods/
//   node scripts/check.mjs <name>     one mod
//
// Steps per mod:
//   1. claude plugin validate   (manifest + static analysis of the hooks module)
//   2. tsc -p <mod>             (only once Claude Code has laid .claude-plugin/types,
//                                i.e. after the mod loaded once via --plugin-dir)
//   3. claude plugin test       (only when the mod has *.test.ts[x] files)

import { existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MOD_NAME, run } from './lib.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const only = process.argv[2]
if (only !== undefined && !MOD_NAME.test(only)) {
  console.error('Usage: node scripts/check.mjs [mod-name]')
  process.exit(1)
}
const mods = only ? [only] : readdirSync(join(root, 'mods')).filter(name => MOD_NAME.test(name))

const ok = (cmd, args) => run(cmd, args, { cwd: root }).status === 0

const hasTests = dir => {
  const tests = join(dir, 'tests')
  return existsSync(tests) && readdirSync(tests).some(f => /\.test\.tsx?$/.test(f))
}

let failed = 0
for (const name of mods) {
  const dir = join(root, 'mods', name)
  if (!existsSync(join(dir, '.claude-plugin', 'plugin.json'))) continue
  console.log(`\n=== ${name} ===`)

  if (!ok('claude', ['plugin', 'validate', dir])) failed++

  if (existsSync(join(dir, '.claude-plugin', 'types', 'tsconfig.json')) || existsSync(join(dir, 'tsconfig.json'))) {
    if (!ok('npx', ['--yes', '-p', 'typescript@5', 'tsc', '-p', dir])) failed++
  } else {
    console.log('tsc: skipped (load the mod once with --plugin-dir so Claude Code writes its types)')
  }

  if (hasTests(dir)) {
    if (!ok('claude', ['plugin', 'test', dir])) failed++
  } else {
    console.log('tests: none')
  }
}

console.log(failed ? `\n${failed} step(s) failed.` : '\nAll checks passed.')
process.exit(failed ? 1 : 0)
