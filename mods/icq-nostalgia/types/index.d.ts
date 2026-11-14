export type IcqStatus = 'online' | 'typing' | 'needsYou'

declare module 'claude-code' {
  interface PluginState {
    'icq-nostalgia': { status: IcqStatus }
  }
}
