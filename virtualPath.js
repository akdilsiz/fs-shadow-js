const { Separator, Path, FileInfo } = require("./path");

class VirtualPath extends Path {
  p = ''
  isDir = false
  constructor(p = '', isDir = false) {
    super()
    this.p = p
    this.isDir = isDir
  }

  IsVirtual() {
    return true
  }
  IsDir() {
    return this.isDir
  }
  Info() {
    return new FileInfo()
  }
  Exists() {
    return true
  }
  String() {
    return this.p
  }

  Name() {
    const parts = this.String().split(Separator)
    return parts[parts.length-1]
  }
  ParentPath() {
    const parts = this.String().split(Separator),
      absolutePath = parts.slice(0, parts.length-1).join(Separator)

    return new VirtualPath(absolutePath, true)
  }
  ExcludePath(p = new Path()) {
    let eventAbsolutePath = this.String().replaceAll(p.String(), '')

    if (eventAbsolutePath.length && eventAbsolutePath[0] === Separator) {
      eventAbsolutePath = eventAbsolutePath.slice(1, eventAbsolutePath.length)
    }

    return new VirtualPath(eventAbsolutePath, this.IsDir())
  }
}

module.exports = VirtualPath