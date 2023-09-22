const { ErrArguments } = require('./errors')
const Separator = '/'

class Path {
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

class FileInfo {
  IsDir = false
  Size = 0
  CreatedAt = 0
  Permission = ''
  constructor(isDir = false, size = 0, createdAt = 0, permission = '') {
    if (size < 0 || createdAt < 0) {
      throw ErrArguments
    }
    this.IsDir = isDir
    this.Size = size
    this.CreatedAt = createdAt
    this.Permission = permission
  }
  ToJSON() {
    return JSON.stringify({
      IsDir: this.IsDir,
      Size: this.Size,
      CreatedAt: this.CreatedAt,
      Permission: this.Permission
    })
  }

  FromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)
      if (parsed.Size < 0 || parsed.CreatedAt < 0) {
        return { fileInfo: null, error: ErrArguments }
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
}

module.exports = {
  Separator,
  Path,
  FileInfo
}