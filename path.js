import { ErrArguments } from './errors.js'
export const Separator = '/'

/**
 * Default upper bound, in UTF-8 bytes, for one file name. Common file systems
 * (ext4, APFS, Btrfs) reject names over 255 bytes; 240 keeps room for the
 * suffixes that OS tools and sync clients append (" (1)", ".tmp", ...).
 * @type {number}
 */
export const MaxFileNameBytes = 240

// Extensions longer than this are not real extensions (for example a dot in
// the middle of a long title), so they are truncated together with the base.
const maxExtensionBytes = 16,
  // '~' + 8 hex digits, ASCII only, so its byte length equals its length.
  hashSuffixBytes = 9,
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
  // FNV-1a 32-bit offset basis 0x811c9dc5 written as the same 32 bits in
  // signed form: ^ and Math.imul work on int32 anyway and >>> 0 below turns
  // the result unsigned, while static analyzers (PMD) reject literals above
  // 2^31 - 1 as inexact.
  let hash = -2128831035

  for (const byte of bytes) {
    hash ^= byte
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Makes a file name fit into maxBytes UTF-8 bytes so it can be written to
 * file systems with a per-name byte limit.
 *
 * Names that already fit are returned unchanged, so existing names, stored
 * transactions and trees keep working. Longer names keep a short extension,
 * cut the base name on a code point boundary and get a deterministic
 * "~xxxxxxxx" hash of the full original name, so the same input always gives
 * the same output and names sharing a long prefix stay distinct (collisions
 * are unlikely, not impossible). Calling it again on its output is a no-op.
 *
 * @param {string} name single file name without separators
 * @param {number} [maxBytes=MaxFileNameBytes] UTF-8 byte limit, integer > 9
 * @return {string}
 * @throws {Error} ErrArguments when name is not a string or maxBytes is not an
 *   integer greater than the hash suffix length
 */
export function safeFileName(name, maxBytes = MaxFileNameBytes) {
  const validName = typeof name === 'string',
    validMaxBytes = Number.isInteger(maxBytes) && maxBytes > hashSuffixBytes

  if (!validName || !validMaxBytes) {
    throw new Error(ErrArguments)
  }

  const nameBytes = encoder.encode(name)

  if (nameBytes.length <= maxBytes) return name

  const suffix = '~' + fnv1aHex(nameBytes),
    dotIndex = name.lastIndexOf('.')

  // A leading dot marks a hidden file (".bashrc"), not an extension.
  let extension = dotIndex > 0 ? name.slice(dotIndex) : '',
    extensionBytes = encoder.encode(extension).length

  const extensionTooLong = extensionBytes > maxExtensionBytes,
    // Always leave at least one byte for the base so the result is not just
    // the suffix and extension.
    noRoomForBase = hashSuffixBytes + extensionBytes >= maxBytes

  if (extensionTooLong || noRoomForBase) {
    extension = ''
    extensionBytes = 0
  }

  const base = extension ? name.slice(0, dotIndex) : name,
    baseBudget = maxBytes - hashSuffixBytes - extensionBytes

  return truncateUtf8(base, baseBudget) + suffix + extension
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
