import { Separator, Path, FileInfo } from './path.js'

export class VirtualPath extends Path {
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

  /**
   * @return {string}
   * @constructor
   */
  Name() {
    const parts = this.String().split(Separator)
    return parts[parts.length - 1]
  }

  /**
   * @return {VirtualPath}
   */
  ParentPath() {
    const parts = this.String().split(Separator),
      absolutePath = parts.slice(0, parts.length - 1).join(Separator)

    return new VirtualPath(absolutePath, true)
  }

  /**
   * @param p
   * @return {VirtualPath}
   */
  ExcludePath(p = new Path()) {
    let eventAbsolutePath = this.String().replaceAll(p.String(), '')

    if (eventAbsolutePath.length && eventAbsolutePath[0] === Separator) {
      eventAbsolutePath = eventAbsolutePath.slice(1, eventAbsolutePath.length)
    }

    return new VirtualPath(eventAbsolutePath, this.IsDir())
  }
}
