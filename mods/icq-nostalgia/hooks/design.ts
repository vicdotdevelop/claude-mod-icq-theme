// The "Mint Messenger" design system: tokens sampled from ICQ 6 (2007)
// screenshots and tuned for contrast. DESIGN.md documents each token and where
// it came from. Every color here is six-digit hex, because makeColors and the
// desktop app accept nothing else.

/** Raw palette, named by role in the 2007 client. */
export const palette = {
  // Window chrome
  mint50: '#ecfef2', // conversation window body (most sampled pixel)
  mint100: '#e0f7e9', // panel wells, contact list background
  mint200: '#c8f0e0', // toolbar strip, selected tab fill
  aqua300: '#a0d0d8', // 1px window and well borders
  aqua500: '#62b7cb', // input focus ring, scrollbar thumb

  // Glossy title bar, top to bottom
  gloss100: '#d0f1c4',
  gloss300: '#b5dd9e',
  leaf500: '#7ec344', // the signature green band
  leaf600: '#5fa52c',
  leaf700: '#48824f', // selected contact row
  pine900: '#1c2a24', // body text tinted toward the chrome

  // Sender names in the transcript
  senderMe: '#1878a8', // your own name: ICQ blue
  senderThem: '#e05000', // the contact's name: ICQ orange

  // Status flowers
  statusOnline: '#5fb32a',
  statusAway: '#e8b400',
  statusBusy: '#d9363e',
  statusNeedsYou: '#f07800',
  statusOffline: '#8a9a92',

  // Night mode ("ICQ at 2 a.m."): pine instead of mint
  pine0: '#0f1c16',
  pine1: '#15261d',
  pine2: '#1b2f24',
  pine3: '#20352a',
} as const

/** Sender colors that keep >= 3:1 on both the mint and the pine surfaces. */
export const sender = {
  me: '#2a86c0',
  them: '#e8661a',
} as const

export const status = {
  online: { glyph: '✿', label: 'Online', color: palette.statusOnline },
  typing: { glyph: '✿', label: 'Occupied · typing…', color: palette.statusBusy },
  needsYou: { glyph: '✿', label: 'Uh-oh! Claude needs you', color: palette.statusNeedsYou },
} as const

export type StatusName = keyof typeof status

/** Shape and type tokens, for the scene and for anyone porting the look to CSS. */
export const shape = {
  radiusWindow: 6,
  radiusTab: 8,
  radiusButton: 3,
  border: 1,
  titleBarHeight: 32,
  tabHeight: 22,
  spacing: [2, 4, 6, 8, 12, 16, 24],
  font: 'Tahoma, Verdana, "Segoe UI", sans-serif',
  fontSize: 11,
} as const
