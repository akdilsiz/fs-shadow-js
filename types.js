const { ErrArguments } = require('./errors')

const DateTypes = {
    MILLI: 0,
    NANO: 1
}
class MetaData {
  IsDir = false
  // Sha256 hash sum
  Sum = ''
  Size = 0
  // Unix time
  CreatedAt = 0
  Permission = ''

  constructor(isDir = false, sum = '', size = 0,
              createdAt = 0, permission = '') {
    if (size < 0 || createdAt < 0) {
      throw ErrArguments
    }
    this.IsDir = isDir
    this.Sum = sum
    this.Size = size
    this.CreatedAt = createdAt
    this.Permission = permission
  }

  ToJSON() {
    return JSON.stringify({
      is_dir: this.IsDir,
      sum: this.Sum,
      size: this.Size,
      created_at: this.CreatedAt,
      permission: this.Permission
    })
  }

  FromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)

      if (parsed.size < 0 || parsed.created_at < 0) {
        return { metaData: null, error: ErrArguments }
      }

      this.IsDir = parsed.is_dir
      this.Sum = parsed.sum
      this.Size = parsed.size
      this.CreatedAt = parsed.created_at
      this.Permission = parsed.permission

      return { metaData: this, error: null }
    } catch (e) {
      return { metaData: null, error: e }
    }
  }

  ToObject() {
    return {
      is_dir: this.IsDir,
      sum: this.Sum,
      size: this.Size,
      created_at: this.CreatedAt,
      permission: this.Permission
    }
  }

  FromObject(obj) {
    try {
      if (!(obj instanceof Object)) {
        return { metaData: null, error: ErrArguments }
      }
      if (obj.size < 0 || obj.created_at < 0) {
        return { metaData: null, error: ErrArguments }
      }

      this.IsDir = obj.is_dir
      this.Sum = obj.sum
      this.Size = obj.size
      this.CreatedAt = obj.created_at
      this.Permission = obj.permission

      return { metaData: this, error: null }
    } catch (e) {
      return { metaData: null, error: e }
    }
  }
}

class ExtraPayload {
  UUID = ''
  IsDir = false
  // Sha256 hash sum
  Sum = ''
  Size = 0
  CreatedAt = 0
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
      throw ErrArguments
    }

    this.UUID = uUID
    this.IsDir = isDir
    this.Sum = sum
    this.Size = size
    this.CreatedAt = createdAt
    this.Permission = permission
  }

  ToJSON() {
    return JSON.stringify({
      UUID: this.UUID,
      IsDir: this.IsDir,
      Sum: this.Sum,
      Size: this.Size,
      CreatedAt: this.CreatedAt,
      Permission: this.Permission
    })
  }
  FromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)

      if (parsed.Size < 0 || parsed.CreatedAt < 0) {
        return { extraPayload: null, error: ErrArguments }
      }

      this.UUID = parsed.UUID
      this.IsDir = parsed.IsDir
      this.Sum = parsed.Sum
      this.Size = parsed.Size
      this.CreatedAt = parsed.CreatedAt
      this.Permission = parsed.Permission

      return { extraPayload: this, error: null }
    } catch (e) {
      return { extraPayload: null, error: e }
    }
  }

  ToBinary() {
    return this.encoder.encode(this.ToJSON())
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
}

module.exports = {
  DateTypes,
  MetaData,
  ExtraPayload
}