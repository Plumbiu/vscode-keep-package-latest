import { InlayHint, Position } from 'vscode'

function findIndex(arr: string[], dep: string) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].includes(dep)) {
      return i + 1
    }
  }
  return undefined
}

export function findDepsLineStart(fileLines: string[]) {
  const depStart = findIndex(fileLines, '"dependencies":')
  let depEnd = undefined
  if (depStart) {
    depEnd = findIndex(fileLines.slice(depStart), '}')! + depStart
  }
  // eslint-disable-next-line @stylistic/max-len
  const devDepStart = findIndex(fileLines, '"devDependencies":')
  let devDepEnd = undefined
  if (devDepStart) {
    devDepEnd = findIndex(fileLines.slice(devDepStart), '}')! + devDepStart
  }
  return {
    depStart,
    depEnd,
    devDepStart,
    devDepEnd,
  }
}

export function createHint(pos: [number, number], label: string) {
  const [line, column] = pos
  return new InlayHint(new Position(line, column + 1), '⭐' + label.trimEnd())
}

export function createNeededArr(
  arr: string[],
  start: number | undefined,
  end: number | undefined,
) {
  if (!start || !end) {
    return []
  }
  return arr.slice(start, end).map((name, idx) => ({
    name: name.split(':')[0].trim(),
    idx: idx + (start ?? 0),
    len: name.length + 1,
  }))
}
