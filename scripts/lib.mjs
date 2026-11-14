// Shared helpers for the repo scripts. Node 18+, no dependencies.

import { spawnSync } from 'node:child_process'

export const MOD_NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Quotes one argument for cmd.exe, used only when Windows needs a shell to find claude.cmd. */
const quoteForCmd = arg => (/[\s"&|<>^%!()]/.test(arg) ? `"${arg.replace(/"/g, '""')}"` : arg)

/**
 * Runs a command without a shell. On Windows a CLI installed through npm is a
 * .cmd shim that Node can only start through cmd.exe, so on ENOENT/EINVAL we
 * retry once through the shell with every argument quoted.
 */
export function run(cmd, args, options = {}) {
  const first = spawnSync(cmd, args, { stdio: 'inherit', ...options })
  const missing = first.error && ['ENOENT', 'EINVAL'].includes(first.error.code)
  if (process.platform !== 'win32' || !missing) return first
  return spawnSync(quoteForCmd(cmd), args.map(quoteForCmd), { stdio: 'inherit', ...options, shell: true })
}

/** One line of plain text: no control characters, at most `max` characters. */
export const oneLine = (text, max = 200) => text.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max)
