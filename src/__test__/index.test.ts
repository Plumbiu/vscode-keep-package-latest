import { expect, test } from 'vitest'
import { findDepsLineStart } from '../utils.js'

test('findDpesLineStart', () => {
  const result = findDepsLineStart([
    '{',
    '"script": {',
    '"dev": "node index.js"',
    '},',
    '"dependencies": {',
    '"vue": "3.0.0"',
    '}',
  ])

  expect(result).toEqual({
    depStart: 4,
    depEnd: 6,
    devDepStart: null,
    devDepEnd: null,
  })
})

// test('findDpesLineStart', () => {
//   const result = getLatestVersion('vue')

//   expect(result).toEqual({
//     depStart: 4,
//     depEnd: 6,
//     devDepStart: null,
//     devDepEnd: null,
//   })
// })
