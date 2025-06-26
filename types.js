import { ErrArguments } from './errors.js'

export const DateTypes = {
    MILLI: 0,
    NANO: 1
}

export class MetaData {
  IsDir = false
  // Sha256 hash sum
  Sum = ''
  Size = 0
  // Unix time
  CreatedAt = 0
  // UTC Unix time
  UTCCreatedAt = 0
  Permission = ''

  constructor(isDir = false, sum = '', size = 0,
              createdAt = 0, permission = '') {
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

  SetUTCCreatedAt(v) {
    this.UTCCreatedAt = v
  }

  FromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)

      if (parsed.size < 0 || parsed.created_at < 0 || (typeof parsed.utc_created_at !== 'undefined' && parsed.utc_created_at < 0)) {
        return { metaData: null, error: new Error(ErrArguments) }
      }

      this.IsDir = parsed.is_dir
      this.Sum = parsed.sum
      this.Size = parsed.size
      this.CreatedAt = parsed.created_at
      if (typeof parsed.utc_created_at !== 'undefined') {
        this.UTCCreatedAt = parsed.utc_created_at
      }

      this.Permission = parsed.permission

      return { metaData: this, error: null }
    } catch (e) {
      return { metaData: null, error: e }
    }
  }

  FromObject(obj) {
    try {
      if (!(obj instanceof Object)) {
        return { metaData: null, error: new Error(ErrArguments) }
      }
      if (obj.size < 0 || obj.created_at < 0 ||  (typeof obj.utc_created_at !== 'undefined' && obj.utc_created_at < 0)) {
        return { metaData: null, error: new Error(ErrArguments) }
      }

      this.IsDir = obj.is_dir
      this.Sum = obj.sum
      this.Size = obj.size
      this.CreatedAt = obj.created_at
      if (typeof obj.utc_created_at !== 'undefined') {
        this.UTCCreatedAt = obj.utc_created_at
      }

      this.Permission = obj.permission

      return { metaData: this, error: null }
    } catch (e) {
      return { metaData: null, error: e }
    }
  }

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
  encoder = new TextEncoder()
  decoder = new TextDecoder()

  constructor(uUID = '',
              isDir = false,
              sum = '',
              size = 0,
              createdAt = 0,
              permission = '') {
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
  }

  FromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)

      if (parsed.Size < 0 || parsed.CreatedAt < 0 || (typeof parsed.UTCCreatedAt !== 'undefined' && parsed.utc_created_at < 0)) {
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

  FromObject(obj) {
    try {
      if (obj.Size < 0 || obj.CreatedAt < 0 || (typeof obj.UTCCreatedAt !== 'undefined' && obj.utc_created_at < 0)) {
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

  FromBinary(encoded) {
    try {
      const decoded = this.decoder.decode(encoded),
        { error } = this.FromJSON(decoded)
      if (error) {
        return { extraPayload: null, error: error }
      }

      return { extraPayload: this, error: null}
    } catch (e) {
      return { extraPayload: null, error: e }
    }
  }

  ToBinary() {
    return this.encoder.encode(this.ToJSON())
  }

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