import fs from 'node:fs'
import { exec } from 'node:child_process'
import path from 'node:path'
import {
  type ExtensionContext,
  InlayHint,
  workspace,
  commands,
  languages,
} from 'vscode'
import { glob } from 'fast-glob'
import { createHint, createNeededArr, findDepsLineStart } from './utils.js'

export function activate(ctx: ExtensionContext) {
  const folders = workspace.workspaceFolders
  if (!folders || !folders.length) {
    return
  }
  const workspaces = folders
    .map((item) => item.uri.fsPath)
    .filter((item) => fs.existsSync(path.join(item, 'package.json')))
  const pkgJsonObj: Record<string, InlayHint[]> = {}

  for (const workspace of workspaces) {
    glob('**/package.json', {
      absolute: true,
      cwd: workspace,
      ignore: ['**/node_modules', 'dist', 'test'],
    }).then((pkgs) => {
      for (const pkgPath of pkgs) {
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
              const hint = createHint([idx, len], v)
              hints.push(hint)
              if (pkgJsonObj[pkgPath]) {
                pkgJsonObj[pkgPath].push(hint)
              } else {
                pkgJsonObj[pkgPath] = []
              }
            })
          }
        })
      }
    })
  }

  commands.registerCommand('vscode-keep-package-latest.init', () => {
    languages.registerInlayHintsProvider(
      {
        language: 'json',
      },
      {
        provideInlayHints(document) {
          return pkgJsonObj[document.uri.path.slice(1)]
        },
      },
    )
  })
}

export function deactivate() {}
