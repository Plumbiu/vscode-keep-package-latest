import fs from 'node:fs'
import path from 'node:path'
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
  const folders = workspace.workspaceFolders
  if (!folders || !folders.length) {
    return
  }
  // TODO: pnpm、yarn workspace support
  const workspaces = folders.map((item) => item.uri.fsPath)
  const pkgJsonObj: Record<string, InlayHint[]> = {}
  for (const workspace of workspaces) {
    const pkgPath = path.join(workspace, 'package.json')
    fs.readFile(pkgPath, 'utf-8', (err, file) => {
      if (err) {
        return
      }
      const files = file.split(/\r?\n/)
      console.log({ files })

      const { depStart, devDepStart, depEnd, devDepEnd } =
        findDepsLineStart(files)
      if (!depStart && !devDepStart) {
        return
      }
      const hints: InlayHint[] = []
      console.log({ depStart, devDepStart, depEnd, devDepEnd })

      const needed = [
        ...createNeededArr(files, depStart, depEnd),
        ...createNeededArr(files, devDepStart, devDepEnd),
      ]

      for (const { name, idx, len } of needed) {
        exec(`npm view ${name} version`, (err, v) => {
          if (err) {
            return
          }
          const hint = createHint([idx, len], v)
          hints.push(hint)
          if (pkgJsonObj[pkgPath]) {
            pkgJsonObj[pkgPath].push(hint)
          } else {
            pkgJsonObj[pkgPath] = []
          }
        })
      }
      // console.log({ hints })
    })
  }

  commands.registerCommand('vscode-keep-package-latest.init', () => {
    languages.registerInlayHintsProvider(
      {
        language: 'json',
      },
      {
        provideInlayHints(document) {
          return pkgJsonObj[document.uri.fsPath]
        },
      },
    )
  })
}

export function deactivate() {}
