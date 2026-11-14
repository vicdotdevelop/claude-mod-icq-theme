import type { EngineInterface } from 'claude-code'

// Plays the message sound on macOS, Windows and Linux.
//
// Which file:
//   1. the `soundFile` option, an absolute path to a .wav you own
//   2. sounds/custom.wav inside the mod folder, if you dropped one there
//      (git-ignored, so a sound you may not redistribute never gets committed)
//   3. sounds/message.wav, the original chime this repo ships
//
// Which player:
//   macOS   $.audio.play (afplay) for the mod's own files, afplay for others
//   Windows powershell.exe + System.Media.SoundPlayer (built into Windows)
//   Linux   paplay, then aplay
// `$.audio.play` only plays on macOS and resolves silently elsewhere, which is
// why Windows and Linux get a player of their own.
//
// Security: every player runs from an argument vector, never through a shell.
// On Windows the path reaches PowerShell through an environment variable, so
// the command string is a constant and no path can inject PowerShell code.

export const BUNDLED = 'sounds/message.wav'
export const LOCAL_OVERRIDE = 'sounds/custom.wav'
const PATH_VAR = 'ICQ_NOSTALGIA_SOUND'
const PLAYER_TIMEOUT_MS = 15000

export type Platform = 'mac' | 'windows' | 'linux'

/** A sound to play: one of the mod's own files (`asset`), or an absolute path. */
export type Sound = { path: string; asset?: string; source: 'option' | 'custom' | 'bundled' }

let cachedPlatform: Platform | undefined

export async function platformOf($: EngineInterface): Promise<Platform> {
  if (cachedPlatform !== undefined) return cachedPlatform
  // Windows sets OS=Windows_NT for every process; uname does not exist there.
  if ((await $.env.get('OS')) === 'Windows_NT') return (cachedPlatform = 'windows')
  try {
    const { stdout } = await $.process.run(['uname', '-s'], { timeoutMs: 3000 })
    cachedPlatform = stdout.trim() === 'Darwin' ? 'mac' : 'linux'
  } catch {
    cachedPlatform = 'linux'
  }
  return cachedPlatform
}

/** A file of the mod's own, as an absolute path in the host's spelling. */
export function ownFile(root: string, asset: string, platform: Platform): string {
  const base = root.replace(/[\\/]+$/, '')
  return platform === 'windows' ? `${base}\\${asset.replace(/\//g, '\\')}` : `${base}/${asset}`
}

/**
 * Whether a configured path is one we are willing to hand to a player: an
 * absolute path to a .wav file, with no control characters.
 */
export function isAcceptableSoundPath(path: string): boolean {
  if (path.length === 0 || path.length > 1024) return false
  if (/[\u0000-\u001f\u007f]/.test(path)) return false
  if (!/\.wav$/i.test(path)) return false
  const isPosixAbsolute = path.startsWith('/')
  const isWindowsAbsolute = /^[A-Za-z]:[\\/]/.test(path) || path.startsWith('\\\\')
  return isPosixAbsolute || isWindowsAbsolute
}

/** Picks the file to play; throws, saying why, when the option is unusable. */
export async function resolveSound($: EngineInterface, platform: Platform, configured: string): Promise<Sound> {
  if (configured !== '') {
    if (!isAcceptableSoundPath(configured)) {
      throw new Error('the soundFile option must be an absolute path to a .wav file')
    }
    if (!(await $.fs.exists(configured))) throw new Error(`soundFile not found: ${configured}`)
    return { path: configured, source: 'option' }
  }
  const custom = ownFile($.plugin.root, LOCAL_OVERRIDE, platform)
  if (await $.fs.exists(custom).catch(() => false)) {
    return { path: custom, asset: LOCAL_OVERRIDE, source: 'custom' }
  }
  return { path: ownFile($.plugin.root, BUNDLED, platform), asset: BUNDLED, source: 'bundled' }
}

/** The PowerShell command is a constant; the path arrives in $env:ICQ_NOSTALGIA_SOUND. */
export const WINDOWS_ARGV: readonly string[] = [
  'powershell.exe',
  '-NoProfile',
  '-NonInteractive',
  '-WindowStyle',
  'Hidden',
  '-Command',
  `(New-Object System.Media.SoundPlayer $env:${PATH_VAR}).PlaySync()`,
]

/** Plays once and resolves when done; rejects with the reason it could not. */
export async function playMessageSound($: EngineInterface, gain: number, configured: string): Promise<Sound> {
  const platform = await platformOf($)
  const sound = await resolveSound($, platform, configured)

  if (platform === 'mac') {
    if (sound.asset !== undefined) {
      await $.audio.play({ asset: sound.asset }, { gain })
    } else {
      const run = await $.process.run(['afplay', '-v', String(gain), sound.path], { timeoutMs: PLAYER_TIMEOUT_MS })
      if (run.exitCode !== 0) throw new Error(run.stderr.trim() || `afplay exited ${run.exitCode}`)
    }
    return sound
  }

  if (platform === 'windows') {
    const run = await $.process.run(WINDOWS_ARGV, { env: { [PATH_VAR]: sound.path }, timeoutMs: PLAYER_TIMEOUT_MS })
    if (run.exitCode !== 0) throw new Error(run.stderr.trim() || `powershell exited ${run.exitCode}`)
    return sound
  }

  for (const argv of [['paplay', sound.path], ['aplay', '-q', sound.path]]) {
    try {
      const run = await $.process.run(argv, { timeoutMs: PLAYER_TIMEOUT_MS })
      if (run.exitCode === 0) return sound
    } catch {
      // That player is not installed: try the next one.
    }
  }
  throw new Error('no audio player found (install pulseaudio-utils or alsa-utils)')
}
