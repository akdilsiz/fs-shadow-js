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
    unitJS.assert.equal('', safeFileName(''))
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
      '~433f52e0.png',
      safeFileName('😀'.repeat(100) + '.png')
    )
    // "." would point at the current directory, so it counts as empty.
    unitJS.assert.equal('~2b0c98f1', safeFileName('.' + '😀'.repeat(70)))
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
    unitJS.assert.throws(
      () => safeFileName(name, 13, [safeFileName(name, 13)]),
      new RegExp(ErrFileExists)
    )
  })

  it('throws ErrArguments for invalid arguments', () => {
    unitJS.assert.throws(() => safeFileName(null), new RegExp(ErrArguments))
    unitJS.assert.throws(() => safeFileName(1), new RegExp(ErrArguments))
    unitJS.assert.throws(() => safeFileName('a', 12), new RegExp(ErrArguments))
    unitJS.assert.throws(() => safeFileName('a', 1.5), new RegExp(ErrArguments))
    unitJS.assert.throws(() => safeFileName('a', NaN), new RegExp(ErrArguments))
    unitJS.assert.throws(
      () => safeFileName('a', 240, 'a'),
      new RegExp(ErrArguments)
    )
    unitJS.assert.throws(
      () => safeFileName('a', 240, null),
      new RegExp(ErrArguments)
    )
    unitJS.assert.throws(
      () => safeFileName('a', 240, 1),
      new RegExp(ErrArguments)
    )
  })
})
