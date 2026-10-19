import unitJS from 'unit.js'
import { ErrArguments, ErrFileExists } from './errors.js'
import {
  Separator,
  Path,
  FileInfo,
  MaxFileNameBytes,
  safeFileName
} from './path.js'

describe('Seperator', () => {
  it('valid', () => {
    unitJS.assert.equal('/', Separator)
  })
})

describe('Path Tests', () => {
  it('all', () => {
    const p = new Path()

    unitJS.assert.equal(false, p.IsVirtual())
    unitJS.assert.equal(false, p.IsDir())
    unitJS.assert.equal(false, p.Exists())
    unitJS.assert.equal('', p.Name())
    unitJS.assert.equal('', p.String())
    unitJS.value(p.ParentPath()).is(new Path())
    unitJS.value(p.ExcludePath(new Path())).is(new Path())
    unitJS.value(p.Info()).is(new FileInfo())
  })
})

describe('FileInfo Tests', () => {
  it('with valid params', () => {
    const fileInfo = new FileInfo(true, 2, 3, 'permission')

    unitJS.assert.equal(true, fileInfo.IsDir)
    unitJS.assert.equal(2, fileInfo.Size)
    unitJS.assert.equal(3, fileInfo.CreatedAt)
    unitJS.assert.equal('permission', fileInfo.Permission)
  })

  it('Should be throw new Error(ErrArguments) with invalid size ', () => {
    unitJS
      .error(() => {
        new FileInfo(true, -1, 0, 'perm')
      })
      .is(new Error(ErrArguments))
  })

  it('.ToJSON()', () => {
    const jsonValue = `{"IsDir":true,"Size":3,"CreatedAt":4,"Permission":"perm1"}`,
      fileInfo = new FileInfo(true, 3, 4, 'perm1')

    unitJS.assert.equal(jsonValue, fileInfo.ToJSON())
  })

  it('.FromJSON()', () => {
    const jsonValue = `{"IsDir":true,"Size":3,"CreatedAt":4,"Permission":"perm1"}`,
      { fileInfo, error } = new FileInfo().FromJSON(jsonValue)

    unitJS.value(error).isNull()
    unitJS.assert.equal(true, fileInfo.IsDir)
    unitJS.assert.equal(3, fileInfo.Size)
    unitJS.assert.equal(4, fileInfo.CreatedAt)
    unitJS.assert.equal('perm1', fileInfo.Permission)
  })

  it('Should be SyntaxError .FromJSON() is invalid json string', () => {
    const { fileInfo, error } = new FileInfo().FromJSON('invalid')

    unitJS.value(error).isInstanceOf(Error)
    unitJS.value(fileInfo).isNull()
  })

  it('Should be SyntaxError .FromJSON() is invalid CreatedAt', () => {
    const jsonValue = `{"IsDir":true,"Size":3,"CreatedAt":-1,"Permission":"perm1"}`,
      { fileInfo, error } = new FileInfo().FromJSON(jsonValue)

    unitJS.value(error).is(new Error(ErrArguments))
    unitJS.value(fileInfo).isNull()
  })
})

describe('safeFileName Tests', () => {
  // fatal: true makes decode throw on invalid UTF-8, so a split character
  // fails the test instead of turning into U+FFFD.
  const encoder = new TextEncoder(),
    decoder = new TextDecoder('utf-8', { fatal: true })

  /**
   * @param {string} value
   * @return {number} UTF-8 byte length of value
   */
  function byteLength(value) {
    return encoder.encode(value).length
  }

  it('default limit is 240 bytes', () => {
    unitJS.assert.equal(240, MaxFileNameBytes)
  })

  it('returns names that already fit unchanged', () => {
    const exact = 'a'.repeat(236) + '.txt'

    unitJS.assert.equal('file.txt', safeFileName('file.txt'))
    unitJS.assert.equal('şğü 文件 😀.md', safeFileName('şğü 文件 😀.md'))
    unitJS.assert.equal(exact, safeFileName(exact))
    unitJS.assert.equal('.env', safeFileName('.env'))
  })

  // Expected hashes come from an independent FNV-1a 32-bit implementation.
  it('cuts long ascii names, marks the cut and keeps the extension', () => {
    const name = 'a'.repeat(300) + '.txt',
      result = safeFileName(name)

    unitJS.assert.equal('a'.repeat(224) + '...~96b24767.txt', result)
    unitJS.assert.equal(240, byteLength(result))
  })

  it('never splits multi-byte characters', () => {
    const result = safeFileName('ş'.repeat(200))

    unitJS.assert.equal('ş'.repeat(114) + '...~a1010ac5', result)
    unitJS.assert.equal(240, byteLength(result))

    const mixed = safeFileName('çğ文'.repeat(40) + '.md'),
      mixedBytes = encoder.encode(mixed)

    unitJS.assert.equal(true, mixedBytes.length <= MaxFileNameBytes)
    unitJS.assert.equal(mixed, decoder.decode(mixedBytes))
    unitJS.assert.equal(true, mixed.endsWith('.md'))
  })

  it('removes emoji from long names only', () => {
    const shortName = 'not 😀 👨‍👩‍👧.txt',
      collapsed = safeFileName('rapor 😀 '.repeat(30) + '.pdf')

    unitJS.assert.equal(shortName, safeFileName(shortName))
    // Removal alone makes it fit: no cut, no hash, single spaces.
    unitJS.assert.equal(Array(30).fill('rapor').join(' ') + '.pdf', collapsed)
  })

  it('returns the hash when nothing but emoji is left', () => {
    unitJS.assert.equal(
      '~5e623e80.png',
      safeFileName('😀'.repeat(100) + '.png')
    )
    // "." would point at the current directory, so it counts as empty.
    unitJS.assert.equal('~f5e1ece1', safeFileName('.' + '😀'.repeat(70)))
    // Different emoji-only names must not share one hash.
    unitJS.assert.equal('~275baa65', safeFileName('😀'.repeat(100)))
    unitJS.assert.equal('~aa3ca875', safeFileName('🎉'.repeat(100)))
  })

  it('normalizes long names to NFC', () => {
    const nfd = 's\u0327'.repeat(150),
      nfc = 'ş'.repeat(150),
      expected = 'ş'.repeat(114) + '...~a581fe05'

    unitJS.assert.equal(expected, safeFileName(nfd))
    unitJS.assert.equal(expected, safeFileName(nfc))
    // Short names keep their exact bytes, NFD included.
    unitJS.assert.equal('s\u0327', safeFileName('s\u0327'))
  })

  it('is deterministic and idempotent', () => {
    const name = 'b'.repeat(400) + '.pdf',
      first = safeFileName(name)

    unitJS.assert.equal(first, safeFileName(name))
    unitJS.assert.equal(first, safeFileName(first))
  })

  it('keeps names with the same long prefix distinct', () => {
    const prefix = 'c'.repeat(300),
      first = safeFileName(prefix + '1.txt'),
      second = safeFileName(prefix + '2.txt')

    unitJS.assert.notEqual(first, second)
  })

  it('keeps long extensions while the base still fits', () => {
    const extension = '.' + 'e'.repeat(40),
      longExtension = safeFileName('d'.repeat(250) + extension),
      hidden = safeFileName('.' + 'f'.repeat(300)),
      tight = safeFileName('g'.repeat(20) + '.txt', 13)

    unitJS.assert.equal(
      'd'.repeat(187) + '...~055676c9' + extension,
      longExtension
    )
    unitJS.assert.equal(MaxFileNameBytes, byteLength(longExtension))
    unitJS.assert.equal(true, hidden.startsWith('.f'))
    unitJS.assert.equal(MaxFileNameBytes, byteLength(hidden))
    // No room for ".txt" next to one base byte, so the whole name is cut.
    unitJS.assert.equal(13, byteLength(tight))
    unitJS.assert.equal(true, tight.startsWith('g...~'))
  })

  it('supports a custom limit', () => {
    const result = safeFileName('h'.repeat(100) + '.txt', 50)

    unitJS.assert.equal(50, byteLength(result))
    unitJS.assert.equal(true, result.endsWith('.txt'))
  })

  it('replaces characters that Windows or POSIX reject', () => {
    unitJS.assert.equal(
      'a_b_c_d_e_f_g_h_i_.txt',
      safeFileName('a>b<c:d"e/f\\g|h?i*.txt')
    )
    unitJS.assert.equal('ab', safeFileName('a\u0000\u0007\u001f\u007f\u009fb'))
    unitJS.assert.equal('_x', safeFileName('\uD800x'))
    unitJS.assert.equal('x_', safeFileName('x\uDC00'))
  })

  it('removes trailing dots and spaces', () => {
    unitJS.assert.equal('x', safeFileName('x. . '))
    unitJS.assert.equal('rapor.pdf', safeFileName('rapor.pdf. '))
    unitJS.assert.equal(' leading', safeFileName(' leading'))
    unitJS.assert.equal('_', safeFileName(''))
    unitJS.assert.equal('_', safeFileName('.'))
    unitJS.assert.equal('_', safeFileName('..'))
    unitJS.assert.equal('_', safeFileName(' . '))
  })

  it('suffixes reserved Windows device names', () => {
    unitJS.assert.equal('CON_', safeFileName('CON'))
    unitJS.assert.equal('nul_.txt', safeFileName('nul.txt'))
    unitJS.assert.equal('Aux_.tar.gz', safeFileName('Aux.tar.gz'))
    unitJS.assert.equal('COM¹_.log', safeFileName('COM¹.log'))
    unitJS.assert.equal('CON _.txt', safeFileName('CON .txt'))
    unitJS.assert.equal('LPT9_', safeFileName('lpt9'.toUpperCase()))
    // Not device names: digits 0 and 10, longer words, hidden files.
    unitJS.assert.equal('COM0', safeFileName('COM0'))
    unitJS.assert.equal('COM10', safeFileName('COM10'))
    unitJS.assert.equal('CONSOLE.txt', safeFileName('CONSOLE.txt'))
    unitJS.assert.equal('.con', safeFileName('.con'))
    // Emoji removal can expose a device name in a long name.
    unitJS.assert.equal(
      'CON_.txt',
      safeFileName('CON' + '😀'.repeat(60) + '.txt')
    )
  })

  it('counts portable names', () => {
    unitJS.assert.equal('CON_ (1)', safeFileName('CON', 240, ['CON_']))
    unitJS.assert.equal(
      'a_b (1).txt',
      safeFileName('a:b.txt', 240, ['a_b.txt'])
    )
  })

  it('keeps the deterministic result without existing names', () => {
    unitJS.assert.equal('a.txt', safeFileName('a.txt', undefined, undefined))
    unitJS.assert.equal('a.txt', safeFileName('a.txt', undefined, []))
    unitJS.assert.equal('a.txt', safeFileName('a.txt', undefined, ['b.txt']))
  })

  it('adds a counter before the extension when the name is taken', () => {
    const taken = new Set(['rapor.pdf', 'rapor (1).pdf'])

    unitJS.assert.equal(
      'rapor (1).pdf',
      safeFileName('rapor.pdf', 240, ['rapor.pdf'])
    )
    unitJS.assert.equal('rapor (2).pdf', safeFileName('rapor.pdf', 240, taken))
    unitJS.assert.equal('.env (1)', safeFileName('.env', 240, ['.env']))
    unitJS.assert.equal('README (1)', safeFileName('README', 240, ['README']))
  })

  it('keeps counted long names within the limit', () => {
    const name = 'a'.repeat(300) + '.txt',
      first = safeFileName(name),
      second = safeFileName(name, MaxFileNameBytes, [first])

    // The counter is reserved before the cut, so the hash stays whole.
    unitJS.assert.equal('a'.repeat(220) + '...~96b24767 (1).txt', second)
    unitJS.assert.equal(MaxFileNameBytes, byteLength(second))
  })

  it('always finds a free name for a crowded folder', () => {
    const taken = ['x.txt']

    for (let counter = 1; counter <= 50; counter++) {
      taken.push('x (' + counter + ').txt')
    }

    unitJS.assert.equal('x (51).txt', safeFileName('x.txt', 240, taken))

    const tightName = 'y'.repeat(30),
      tight = safeFileName(tightName, 20, [safeFileName(tightName, 20)])

    unitJS.assert.equal(20, byteLength(tight))
    unitJS.assert.equal(true, tight.startsWith('yyyy...~'))
    unitJS.assert.equal(true, tight.endsWith(' (1)'))
  })

  it('counts short names that only overflow with the counter', () => {
    const name = 'k'.repeat(236) + '.txt',
      result = safeFileName(name, 240, [name])

    unitJS.assert.equal(true, byteLength(result) <= MaxFileNameBytes)
    unitJS.assert.equal(true, result.endsWith(' (1).txt'))
    unitJS.assert.equal(true, result.includes('...~'))
  })

  it('throws ErrFileExists when the limit has no room for a counter', () => {
    const name = 'z'.repeat(20)

    // "...~xxxxxxxx (1)" alone is 16 bytes, more than the 13-byte limit.
    unitJS
      .exception(() => {
        safeFileName(name, 13, [safeFileName(name, 13)])
      })
      .hasMessage(ErrFileExists)
  })

  // Regression: each counter used to clean and hash the whole name again,
  // so this loop was O(counters^2 * name length) and ran into minutes. The
  // .mocharc timeout (5 s) fails the test if that comes back.
  it('keeps the collision guard linear for long names', () => {
    const name = 'q'.repeat(100000) + '.txt',
      taken = [safeFileName(name)]

    // 300 counters: well under a second now, tens of seconds before the fix,
    // so slower CI machines keep a wide margin.
    for (let counter = 1; counter <= 300; counter++) {
      taken.push(safeFileName(name, MaxFileNameBytes, taken))
    }

    unitJS.assert.equal(301, new Set(taken).size)
    unitJS.assert.equal(true, taken[300].endsWith(' (300).txt'))
  })

  it('throws ErrArguments for invalid arguments', () => {
    const invalidCalls = [
      [null],
      [1],
      ['a', 12],
      ['a', 1.5],
      ['a', NaN],
      ['a', 240, 'a'],
      ['a', 240, null],
      ['a', 240, 1]
    ]

    // hasMessage checks the text; .is(new Error(...)) accepts any Error.
    for (const args of invalidCalls) {
      unitJS
        .exception(() => {
          safeFileName(...args)
        })
        .hasMessage(ErrArguments)
    }
  })
})

describe('safeFileName Stress Tests', () => {
  const encoder = new TextEncoder(),
    decoder = new TextDecoder(),
    reservedCharacters = '<>:"/\\|?*',
    deviceNames = new Set(['CON', 'PRN', 'AUX', 'NUL']),
    // Code units that hit every rule: ASCII, reserved and control characters,
    // spaces and dots, Turkish, CJK, emoji with joiners and selectors,
    // combining marks, astral letters, bidi marks and lone surrogates.
    pool = [
      'a',
      'Z',
      '0',
      '9',
      ' ',
      '.',
      '-',
      '(',
      ')',
      '~',
      ...reservedCharacters,
      '\u0000',
      '\u001f',
      '\u007f',
      '\u0085',
      'ş',
      'Ğ',
      'ı',
      'İ',
      '文',
      '件',
      '😀',
      '👍🏽',
      '👨‍👩‍👧',
      '🇹🇷',
      '1️⃣',
      '‍',
      '️',
      '́',
      'ş',
      '𝒜',
      // U+202E (right-to-left override), built at runtime so the source has no
      // bidi control character.
      String.fromCodePoint(0x202e),
      '\uD800',
      '\uDC00',
      'CON',
      'nul',
      'COM¹'
    ]

  for (let digit = 1; digit <= 9; digit++) {
    deviceNames.add('COM' + digit)
    deviceNames.add('LPT' + digit)
  }

  for (const digit of ['¹', '²', '³']) {
    deviceNames.add('COM' + digit)
    deviceNames.add('LPT' + digit)
  }

  /**
   * Mulberry32: a small seeded PRNG, so every failure is reproducible
   * without adding a dependency.
   * @param {number} seed
   * @return {function(): number} returns values in [0, 1)
   */
  function createRandom(seed) {
    let state = seed >>> 0

    return function next() {
      state = (state + 0x6d2b79f5) >>> 0

      let value = Math.imul(state ^ (state >>> 15), 1 | state)

      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)

      return ((value ^ (value >>> 14)) >>> 0) / 4294967296
    }
  }

  /**
   * @param {function(): number} random
   * @param {number} pieces
   * @return {string} random name built from the pool
   */
  function randomName(random, pieces) {
    let name = ''

    for (let index = 0; index < pieces; index++) {
      name += pool[Math.floor(random() * pool.length)]
    }

    return name
  }

  /**
   * Returns the first broken rule for a result, or '' when all hold.
   * @param {string} result
   * @param {number} maxBytes
   * @return {string}
   */
  function brokenRule(result, maxBytes) {
    const bytes = encoder.encode(result),
      firstDot = result.indexOf('.'),
      device = (firstDot === -1 ? result : result.slice(0, firstDot))
        .trimEnd()
        .toUpperCase(),
      lastCharacter = result[result.length - 1]

    if (bytes.length > maxBytes) return 'too long'

    // Lone surrogates would turn into U+FFFD, so the round trip differs.
    if (decoder.decode(bytes) !== result) return 'not well-formed'

    if (result === '' || result === '.' || result === '..') return 'empty'

    if (lastCharacter === '.' || lastCharacter === ' ') return 'trailing'

    if (deviceNames.has(device)) return 'device name'

    for (const char of result) {
      const codePoint = char.codePointAt(0),
        control = codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f)

      if (control || reservedCharacters.includes(char)) return 'character'
    }

    return ''
  }

  it('keeps every rule for 3000 random names', () => {
    const random = createRandom(20261020),
      limits = [13, 32, 240, 255]

    for (let round = 0; round < 3000; round++) {
      const name = randomName(random, Math.floor(random() * 200)),
        maxBytes = limits[round % limits.length],
        result = safeFileName(name, maxBytes),
        context = JSON.stringify({ round, name, maxBytes, result })

      unitJS.assert.equal('', brokenRule(result, maxBytes), context)
      unitJS.assert.equal(result, safeFileName(name, maxBytes), context)
      unitJS.assert.equal(result, safeFileName(result, maxBytes), context)

      // A name that already keeps every rule must come back unchanged.
      if (brokenRule(name, maxBytes) === '') {
        unitJS.assert.equal(name, result, context)
      }
    }
  })

  it('returns free names that keep every rule with existing names', () => {
    const random = createRandom(7),
      taken = new Set()

    for (let round = 0; round < 1000; round++) {
      // Few base names so collisions and counters happen often.
      const name = randomName(random, 1 + Math.floor(random() * 3)),
        result = safeFileName(name, 240, taken),
        context = JSON.stringify({ round, name, result })

      unitJS.assert.equal('', brokenRule(result, 240), context)
      unitJS.assert.equal(false, taken.has(result), context)
      taken.add(result)
    }
  })

  // Each input targets a pattern that makes backtracking regular expressions
  // explode (long runs, nested joiners, many combining marks). The .mocharc
  // timeout (5 s) fails a test that turns super-linear.
  const megabyte = 1 << 20,
    hostileInputs = {
      'spaces then a letter': ' '.repeat(megabyte) + 'x',
      'dots and spaces then a letter': '. '.repeat(megabyte / 2) + 'x',
      'double spaces between emoji': '😀  '.repeat(megabyte / 8),
      'zero width joiners': '‍'.repeat(megabyte),
      'variation selectors': 'a️'.repeat(megabyte / 2),
      'combining marks': 'e' + '́'.repeat(megabyte),
      'family emoji chain': '👨‍👩‍👧'.repeat(megabyte / 8),
      'reserved characters': '<>:"/\\|?*'.repeat(megabyte / 9),
      'lone surrogates': '\uD800'.repeat(megabyte),
      'one dot per letter': 'a.'.repeat(megabyte / 2),
      '10 MB ascii': 'b'.repeat(10 * megabyte) + '.txt'
    }

  for (const [label, input] of Object.entries(hostileInputs)) {
    it('stays linear for ' + label, () => {
      const result = safeFileName(input)

      unitJS.assert.equal('', brokenRule(result, MaxFileNameBytes))
    })
  }

  it('handles a folder with 100000 taken names', () => {
    const taken = new Set(['x.txt'])

    for (let counter = 1; counter <= 100000; counter++) {
      taken.add('x (' + counter + ').txt')
    }

    unitJS.assert.equal('x (100001).txt', safeFileName('x.txt', 240, taken))
  })
})
