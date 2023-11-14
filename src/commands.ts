import { window, commands, languages, type InlayHint } from 'vscode'

export function registerInitCommand(hints: InlayHint[]) {
  commands.registerCommand('vscode-keep-package-latest.init', () => {
    languages.registerInlayHintsProvider(
      {
        language: 'json',
      },
      {
        provideInlayHints() {
          window.showInformationMessage(JSON.stringify(hints))
          return hints
        },
      },
    )
  })
}
