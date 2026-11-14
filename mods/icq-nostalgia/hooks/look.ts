import type { ThemeSetArgs } from 'claude-code'

import { palette } from './design'
import { makeColors } from './make-colors.js'

// Mint by day, pine by night. Grays are tinted toward the ICQ green so cards
// read as "white message well on mint window", as in the 2007 client.
const made = makeColors({
  label: 'Mint Messenger',
  id: 'icq-nostalgia',
  roles: {
    accent: palette.senderMe, // links and the main button: ICQ blue
    success: palette.leaf600, // the leaf green
    warning: palette.senderThem, // the orange of the other person's name
    danger: '#c8322a',
    pro: '#7a3fa0',
  },
  light: {
    gray: {
      anchors: {
        'surface-0': '#dff3e6',
        'surface-1': '#eefbf3',
        'surface-2': '#f8fffa',
        'text-primary': palette.pine900,
        'text-secondary': '#35584a',
        'text-muted': '#4f6e61',
      },
    },
    git: { added: '#2f8a3a', removed: '#c8322a', modified: '#1878a8' },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': palette.pine0,
        'surface-1': palette.pine1,
        'surface-2': palette.pine2,
        'surface-3': palette.pine3,
        'text-primary': '#e6f7ec',
        'text-secondary': '#bcd9c7',
        'text-muted': '#97b8a5',
      },
    },
    git: { added: '#6cc451', removed: '#ef6b5f', modified: '#5fb0e0' },
  },
})

export const problems: string[] = made.problems

// The backdrop is a scene (scene.ts): a glossy mint window with soft blossoms.
export const LOOK: ThemeSetArgs = {
  colors: made.theme,
  backdrop: { scene: 'mint-window', glass: { blur: 14, opacity: 0.78 } },
}
