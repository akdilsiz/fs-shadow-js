import { ErrArguments, ErrFileExists } from './errors.js'
export const Separator = '/'

/**
 * Default upper bound, in UTF-8 bytes, for one file name. Common file systems
 * (ext4, APFS, Btrfs) reject names over 255 bytes; 240 keeps room for the
 * suffixes that OS tools and sync clients append (" (1)", ".tmp", ...).
 * @type {number}
 */
export const MaxFileNameBytes = 240

// Marks that the base name was cut. ASCII only, so bytes equal length.
const ellipsis = '...',
  // '~' + 8 hex digits, ASCII only, so its byte length equals its length.
  hashSuffixBytes = 9,
  // Smallest limit that still fits one base byte, the ellipsis and the hash.
  minFileNameBytes = 1 + ellipsis.length + hashSuffixBytes,
  // Emoji code points plus the joiners, selectors, skin tones, flags and tags
  // that build emoji sequences, so no orphan part is left behind. Note that
  // Extended_Pictographic also covers a few symbols such as © and ™.
  // Joiners, selectors and the keycap mark are combining characters, so they
  // are alternatives instead of class members (no-misleading-character-class).
  emojiPattern =
    /[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}\u{E0020}-\u{E007F}]|\u200D|\uFE0E|\uFE0F|\u20E3/gu,
  encoder = new TextEncoder()

/**
 * Returns the UTF-8 byte length of one code point without allocating.
 * Lone surrogates count as 3 bytes because TextEncoder writes them as U+FFFD.
 * @param {number} codePoint
 * @return {number}
 */
function utf8CodePointBytes(codePoint) {
  if (codePoint < 0x80) return 1

  if (codePoint < 0x800) return 2

  if (codePoint < 0x10000) return 3

  return 4
}

/**
 * Cuts a string to at most maxBytes UTF-8 bytes on a code point boundary, so
 * a multi-byte character or surrogate pair is never split into invalid bytes.
 * @param {string} value
 * @param {number} maxBytes
 * @return {string}
 */
function truncateUtf8(value, maxBytes) {
  let usedBytes = 0,
    result = ''

  for (const char of value) {
    const charBytes = utf8CodePointBytes(char.codePointAt(0))

    if (usedBytes + charBytes > maxBytes) break

    usedBytes += charBytes
    result += char
  }

  return result
}

/**
 * FNV-1a 32-bit hash of the bytes as 8 lowercase hex digits. Used only to keep
 * two long names with the same prefix apart; it is not a security hash.
 * @param {Uint8Array} bytes
 * @return {string}
 */
function fnv1aHex(bytes) {
  let hash = 0x811c9dc5

  for (const byte of bytes) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Splits a name into stem and extension at the last dot. A leading dot marks
 * a hidden file (".bashrc"), not an extension.
 * @param {string} name
 * @return {{stem: string, extension: string}}
 */
function splitExtension(name) {
  const dotIndex = name.lastIndexOf('.')

  if (dotIndex <= 0) return { stem: name, extension: '' }

  return { stem: name.slice(0, dotIndex), extension: name.slice(dotIndex) }
}

/**
 * Normalizes text to NFC (macOS writes NFD, Linux keeps what it gets, so the
 * same visible name can have two byte forms), removes emoji and collapses the
 * spaces the removal leaves behind.
 * @param {string} value
 * @return {string}
 */
function cleanText(value) {
  return value
    .normalize('NFC')
    .replace(emojiPattern, '')
    .replace(/ {2,}/g, ' ')
    .trim()
}

/**
 * @typedef {Object} PreparedName
 * @property {number} bytes UTF-8 byte length of the name as given
 * @property {{stem: string, extension: string}} parts name split at the dot
 * @property {string} stem cleaned stem (NFC, no emoji)
 * @property {string} extension cleaned extension
 * @property {number} cleanedBytes UTF-8 byte length of stem + extension
 * @property {number} extensionBytes UTF-8 byte length of extension
 * @property {string} hash "~xxxxxxxx" of the cleaned name
 * @property {boolean} emptyStem cleaning left no usable stem
 */

/**
 * Does the work that depends only on the name: splitting, cleaning and
 * hashing. It runs once per safeFileName call, so the collision guard does
 * not repeat linear work on a long name for every counter.
 * @param {string} name
 * @return {PreparedName}
 */
function prepareName(name) {
  const parts = splitExtension(name),
    stem = cleanText(parts.stem),
    extension = cleanText(parts.extension),
    cleaned = stem + extension

  return {
    bytes: encoder.encode(name).length,
    parts,
    stem,
    extension,
    cleanedBytes: encoder.encode(cleaned).length,
    extensionBytes: encoder.encode(extension).length,
    // Hashing the cleaned name gives NFC and NFD input the same result.
    hash: '~' + fnv1aHex(encoder.encode(cleaned)),
    // "." and ".." would point at directories, so they count as empty.
    emptyStem: stem === '' || stem === '.' || stem === '..'
  }
}

/**
 * Fits a prepared name into maxBytes without looking at other names. See
 * safeFileName for the rules. The label (" (1)", ...) is reserved inside the
 * limit and placed before the extension, so a counter never cuts into the
 * "...~hash" marker; with an empty label this is the deterministic result.
 * Costs O(maxBytes): the cut stops as soon as the budget is used.
 * @param {PreparedName} prepared
 * @param {number} maxBytes
 * @param {string} [label=''] ASCII text added before the extension
 * @return {string} may exceed maxBytes only when the label alone leaves no
 *   room; the caller checks that
 */
function fitFileName(prepared, maxBytes, label = '') {
  const { parts, stem, extension, extensionBytes, hash } = prepared

  // Names that fit are kept byte for byte (backward compatible with existing
  // trees); with an empty label this returns the name itself.
  if (prepared.bytes + label.length <= maxBytes) {
    return parts.stem + label + parts.extension
  }

  // Only names that must change anyway are cleaned.
  if (prepared.emptyStem) {
    const extensionFits =
      hash.length + label.length + extensionBytes <= maxBytes

    return hash + label + (extensionFits ? extension : '')
  }

  if (prepared.cleanedBytes + label.length <= maxBytes) {
    return stem + label + extension
  }

  const marker = ellipsis + hash + label,
    // Without one byte left for the base the extension is not really an
    // extension (for example a dot in a long title), so cut the whole name.
    keepExtension = extensionBytes + marker.length < maxBytes,
    base = keepExtension ? stem : stem + extension,
    kept = keepExtension ? extension : '',
    baseBudget = maxBytes - marker.length - (keepExtension ? extensionBytes : 0)

  return truncateUtf8(base, baseBudget) + marker + kept
}

/**
 * Makes a file name fit into maxBytes UTF-8 bytes so it can be written to
 * file systems with a per-name byte limit.
 *
 * Names that already fit are returned unchanged, so existing names, stored
 * transactions and trees keep working. Longer names are first normalized to
 * NFC with emoji removed; if that is enough they are returned cleaned, and a
 * name left empty becomes "~xxxxxxxx{extension}". Otherwise they become
 * "{cut base}...~xxxxxxxx{extension}": the base is cut on a code point
 * boundary, "..." marks the cut and "~xxxxxxxx" is a deterministic hash of
 * the full cleaned name, so the same input always gives the same output and
 * names sharing a long prefix stay distinct (collisions are unlikely, not
 * impossible). The extension is kept whenever at least one base byte still
 * fits. Calling it again on its output is a no-op.
 *
 * With existingNames (the names already in the target folder) it becomes a
 * unique name generator: when the result is taken, even for a short name,
 * " (1)", " (2)", ... is added before the extension and the first free name
 * that still fits is returned. The result then depends on existingNames, so
 * the same name can give different results. Names are compared exactly; on
 * case-insensitive file systems pass lowercased names and compare likewise.
 *
 * @param {string} name single file name without separators
 * @param {number} [maxBytes=MaxFileNameBytes] UTF-8 byte limit, integer >= 13
 * @param {Iterable<string>} [existingNames] names that must not be returned
 * @return {string}
 * @throws {Error} ErrArguments when name is not a string, maxBytes is not an
 *   integer of at least 13 or existingNames is not an iterable
 * @throws {Error} ErrFileExists if no free name fits (only when maxBytes is
 *   too small for the counter)
 */
export function safeFileName(
  name,
  maxBytes = MaxFileNameBytes,
  existingNames = undefined
) {
  const validName = typeof name === 'string',
    validMaxBytes = Number.isInteger(maxBytes) && maxBytes >= minFileNameBytes,
    hasExistingNames = typeof existingNames !== 'undefined',
    validExistingNames =
      !hasExistingNames ||
      (existingNames !== null &&
        typeof existingNames !== 'string' &&
        typeof existingNames[Symbol.iterator] === 'function')

  if (!validName || !validMaxBytes || !validExistingNames) {
    throw new Error(ErrArguments)
  }

  const prepared = prepareName(name),
    candidate = fitFileName(prepared, maxBytes)

  if (!hasExistingNames) return candidate

  const taken =
    existingNames instanceof Set ? existingNames : new Set(existingNames)

  if (!taken.has(candidate)) return candidate

  // Every counter gives a different name (the digits between the last "("
  // and ")" differ), so taken.size + 1 tries reach a free one unless the
  // limit is too small for the counter. The bound keeps the loop finite.
  for (let counter = 1; counter <= taken.size + 1; counter++) {
    const numbered = fitFileName(prepared, maxBytes, ' (' + counter + ')'),
      fits = encoder.encode(numbered).length <= maxBytes

    if (fits && !taken.has(numbered)) return numbered
  }

  throw new Error(ErrFileExists)
}

export class Path {
  IsVirtual() {
    return false
  }
  IsDir() {
    return false
  }
  Exists() {
    return false
  }
  Name() {
    return ''
  }
  String() {
    return ''
  }
  ParentPath() {
    return new Path()
  }
  ExcludePath(p = new Path()) {
    return p
  }
  Info() {
    return new FileInfo()
  }
}

export class FileInfo {
  IsDir = false
  Size = 0
  CreatedAt = 0
  Permission = ''
  constructor(isDir = false, size = 0, createdAt = 0, permission = '') {
    if (size < 0 || createdAt < 0) {
      throw new Error(ErrArguments)
    }
    this.IsDir = isDir
    this.Size = size
    this.CreatedAt = createdAt
    this.Permission = permission
  }

  /**
   * @param {string} value
   * @return {{fileInfo: ?FileInfo, error: ?Error}}
   */
  FromJSON(value) {
    try {
      const parsed = JSON.parse(value)
      if (parsed.Size < 0 || parsed.CreatedAt < 0) {
        return { fileInfo: null, error: new Error(ErrArguments) }
      }
      this.IsDir = parsed.IsDir
      this.Size = parsed.Size
      this.CreatedAt = parsed.CreatedAt
      this.Permission = parsed.Permission

      return { fileInfo: this, error: null }
    } catch (e) {
      return { fileInfo: null, error: e }
    }
  }

  /**
   * @return {string}
   */
  ToJSON() {
    return JSON.stringify({
      IsDir: this.IsDir,
      Size: this.Size,
      CreatedAt: this.CreatedAt,
      Permission: this.Permission
    })
  }
}
