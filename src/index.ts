import fs from 'node:fs'
import { exec } from 'node:child_process'
import {
  type ExtensionContext,
  InlayHint,
  workspace,
  commands,
  languages,
} from 'vscode'
import { createHint, createNeededArr, findDepsLineStart } from './utils.js'

export function activate(ctx: ExtensionContext) {
  const pkgJsonMap: Map<string, InlayHint[]> = new Map()
  workspace.findFiles('**/package.json', '**/node_modules/**').then((uri) => {
    for (const workspace of uri) {
      const pkgPath = workspace.fsPath
      fs.readFile(pkgPath, 'utf-8', (_err, file) => {
        const files = file.split(/\r?\n/)
        const { depStart, devDepStart, depEnd, devDepEnd } =
          findDepsLineStart(files)
        if (!depStart && !devDepStart) {
          return
        }
        const hints: InlayHint[] = []
        const needed = [
          ...createNeededArr(files, depStart, depEnd),
          ...createNeededArr(files, devDepStart, devDepEnd),
        ]
        for (const { name, idx, len } of needed) {
          exec(`npm view ${name} version`, (_err, v) => {
            if (!v) {
              return
            }
            hints.push(createHint([idx, len], v))
          })
        }
        pkgJsonMap.set(pkgPath, hints)
      })
    }
  })

  commands.registerCommand('vscode-keep-package-latest.init', () => {
    languages.registerInlayHintsProvider(
      {
        language: 'json',
      },
      {
        provideInlayHints(document) {
          return pkgJsonMap.get(document.uri.fsPath)
        },
      },
    )
  })
}

export function deactivate() {}
