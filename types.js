import { ErrArguments } from './errors.js'

const encoder = new TextEncoder(),
  decoder = new TextDecoder()

export const DateTypes = {
    MILLI: 0,
    NANO: 1,
  },
  MILLI = 0,
  NANO = 0

export class MetaData {
  IsDir = false
  /**
   * Sum OS File Sha256 hash sum
   * @optional
   * @type {string}
   */
  Sum
  /**
   * @type {number}
   */
  Size
  // Unix time
  /**
   * CreatedAt unix timestamp
   * @type {number}
   */
  CreatedAt
  /**
   * UTCCreatedAt utc unix timestamp
   * @type {number}
   */
  UTCCreatedAt
  /**
   * Permission OS File
   * @type {string}
   */
  Permission

  /**
   * @param {boolean} isDir
   * @param {?string} sum
   * @param {number} size
   * @param {number} createdAt
   * @param {?string} permission
   */
  constructor(
    isDir = false,
    sum = '',
    size = 0,
    createdAt = 0,
    permission = '',
  ) {
    if (size < 0 || createdAt < 0) {
      throw new Error(ErrArguments)
    }
    this.IsDir = isDir
    this.Sum = sum
    this.Size = size
    this.CreatedAt = createdAt
    this.UTCCreatedAt = createdAt
    this.Permission = permission
  }

  /**
   * @param {number} v
   * @return {MetaData}
   */
  SetUTCCreatedAt(v) {
    this.UTCCreatedAt = v
    return this
  }

  /**
   * @param {string} value
   * @return {{metaData: ?MetaData, error: ?Error}}}
   */
  FromJSON(value) {
    try {
      const parsed = JSON.parse(value)

      if (
        (parsed.Size ?? parsed.size) < 0 ||
        (parsed.CreatedAt ?? parsed.created_at) < 0 ||
        (typeof parsed.UTCCreatedAt !== 'undefined' &&
          parsed.UTCCreatedAt < 0) ||
        (typeof parsed.utc_created_at !== 'undefined' &&
          parsed.utc_created_at < 0)
      ) {
        return { metaData: null, error: new Error(ErrArguments) }
      }

      this.IsDir = parsed.IsDir ?? parsed.is_dir
      this.Sum = parsed.IsDir ?? parsed.sum
      this.Size = parsed.Size ?? parsed.size
      this.CreatedAt = parsed.CreatedAt ?? parsed.created_at
      if (
        typeof parsed.UTCCreatedAt !== 'undefined' ||
        typeof parsed.utc_created_at !== 'undefined'
      ) {
        this.UTCCreatedAt = parsed.UTCCreatedAt ?? parsed.utc_created_at
      }

      this.Permission = parsed.Permission ?? parsed.permission

      return { metaData: this, error: null }
    } catch (e) {
      return { metaData: null, error: e }
    }
  }

  /**
   * @param {object} obj
   * @return {{metaData: ?MetaData, error: ?Error}}}
   */
  FromObject(obj) {
    try {
      if (!(obj instanceof Object)) {
        return { metaData: null, error: new Error(ErrArguments) }
      }
      if (
        obj.size < 0 ||
        obj.created_at < 0 ||
        (typeof obj.utc_created_at !== 'undefined' && obj.utc_created_at < 0)
      ) {
        return { metaData: null, error: new Error(ErrArguments) }
      }

      this.IsDir = obj.IsDir ?? obj.is_dir
      this.Sum = obj.Sum ?? obj.sum
      this.Size = obj.Size ?? obj.size
      this.CreatedAt = obj.CreatedAt ?? obj.created_at
      if (
        typeof obj.UTCCreatedAt !== 'undefined' ||
        typeof obj.utc_created_at !== 'undefined'
      ) {
        this.UTCCreatedAt = obj.UTCCreatedAt ?? obj.utc_created_at
      }

      this.Permission = obj.Permission ?? obj.permission

      return { metaData: this, error: null }
    } catch (e) {
      return { metaData: null, error: e }
    }
  }

  /**
   * @return {string}
   */
  ToJSON() {
    return JSON.stringify({
      is_dir: this.IsDir,
      sum: this.Sum,
      size: this.Size,
      created_at: this.CreatedAt,
      permission: this.Permission,
      utc_created_at: this.UTCCreatedAt,
    })
  }

  /**
   * @return {{is_dir: boolean, sum: string, size: number, created_at: number, permission: string, utc_created_at: number}}
   */
  ToObject() {
    return {
      is_dir: this.IsDir,
      sum: this.Sum,
      size: this.Size,
      created_at: this.CreatedAt,
      permission: this.Permission,
      utc_created_at: this.UTCCreatedAt,
    }
  }
}

export class ExtraPayload {
  UUID = ''
  IsDir = false
  // Sha256 hash sum
  Sum = ''
  Size = 0
  CreatedAt = 0
  UTCCreatedAt = 0
  Permission = ''

  constructor(
    uUID = '',
    isDir = false,
    sum = '',
    size = 0,
    createdAt = 0,
    permission = '',
  ) {
    if (size < 0 || createdAt < 0) {
      throw new Error(ErrArguments)
    }

    this.UUID = uUID
    this.IsDir = isDir
    this.Sum = sum
    this.Size = size
    this.CreatedAt = createdAt
    this.UTCCreatedAt = createdAt
    this.Permission = permission
  }

  SetUTCCreatedAt(v) {
    this.UTCCreatedAt = v
    return this
  }

  /**
   * @param {string} value
   * @return {{extraPayload: ?ExtraPayload, error: ?Error}}
   */
  FromJSON(value) {
    try {
      const parsed = JSON.parse(value)

      if (
        parsed.Size < 0 ||
        parsed.CreatedAt < 0 ||
        (typeof parsed.UTCCreatedAt !== 'undefined' &&
          parsed.utc_created_at < 0)
      ) {
        return { extraPayload: null, error: new Error(ErrArguments) }
      }

      this.UUID = parsed.UUID
      this.IsDir = parsed.IsDir
      this.Sum = parsed.Sum
      this.Size = parsed.Size
      this.CreatedAt = parsed.CreatedAt
      if (typeof parsed.UTCCreatedAt !== 'undefined') {
        this.UTCCreatedAt = parsed.UTCCreatedAt
      }

      this.Permission = parsed.Permission

      return { extraPayload: this, error: null }
    } catch (e) {
      return { extraPayload: null, error: e }
    }
  }

  /**
   * @param {object} obj
   * @return {{extraPayload: ?ExtraPayload, error: ?Error}}
   */
  FromObject(obj) {
    try {
      if (
        obj.Size < 0 ||
        obj.CreatedAt < 0 ||
        (typeof obj.UTCCreatedAt !== 'undefined' && obj.utc_created_at < 0)
      ) {
        return { extraPayload: null, error: new Error(ErrArguments) }
      }

      this.UUID = obj.UUID
      this.IsDir = obj.IsDir
      this.Sum = obj.Sum
      this.Size = obj.Size
      this.CreatedAt = obj.CreatedAt
      if (typeof obj.UTCCreatedAt !== 'undefined') {
        this.UTCCreatedAt = obj.UTCCreatedAt
      }

      this.Permission = obj.Permission

      return { extraPayload: this, error: null }
    } catch (e) {
      return { extraPayload: null, error: e }
    }
  }

  /**
   * @param {Uint8Array} encoded
   * @return {{extraPayload: ?ExtraPayload, error: ?Error}}
   */
  FromBinary(encoded) {
    try {
      const decoded = decoder.decode(encoded),
        { error } = this.FromJSON(decoded)
      if (error) {
        return { extraPayload: null, error: error }
      }

      return { extraPayload: this, error: null }
    } catch (e) {
      return { extraPayload: null, error: e }
    }
  }

  /**
   * @return {Uint8Array}
   */
  ToBinary() {
    return encoder.encode(this.ToJSON())
  }

  /**
   * @return {string}
   */
  ToJSON() {
    return JSON.stringify({
      UUID: this.UUID,
      IsDir: this.IsDir,
      Sum: this.Sum,
      Size: this.Size,
      CreatedAt: this.CreatedAt,
      Permission: this.Permission,
      UTCCreatedAt: this.UTCCreatedAt,
    })
  }

  /**
   * @return {{UUID: string, IsDir: boolean, Sum: string, Size: number, CreatedAt: number, Permission: string, UTCCreatedAt: number}}
   */
  ToObject() {
    return {
      UUID: this.UUID,
      IsDir: this.IsDir,
      Sum: this.Sum,
      Size: this.Size,
      CreatedAt: this.CreatedAt,
      Permission: this.Permission,
      UTCCreatedAt: this.UTCCreatedAt,
    }
  }
}
