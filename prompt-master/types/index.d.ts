declare module 'claude-code' {
  interface PluginState {
    'prompt-master': {
      /** True while the draft holds non-blank text. */
      hasDraft: boolean
      /** True while a rewrite is in flight. */
      isBusy: boolean
      /** The draft as it was before the last rewrite, for Undo; null when none. */
      original: string | null
    }
  }
}
