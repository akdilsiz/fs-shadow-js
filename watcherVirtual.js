import VirtualPath from './virtualPath.js'
import { ExtraPayload, MetaData } from './types.js'
import { Remove, Create, Rename, Move, Event } from './event.js'
import FileNode from'./fileNode.js'
import EventTransaction from './eventTransaction.js'

export class VirtualTree {
  FileTree = new FileNode()
  Path = new VirtualPath()
  ParentPath = new VirtualPath()
  constructor(fileTree = new FileNode(), path = new VirtualPath(), parentPath = new VirtualPath()) {
    this.FileTree = fileTree
    this.Path = path
    this.ParentPath = parentPath
  }

  /**
   * @param {Event} event
   * @param {?ExtraPayload} extra
   * @return {Promise<{eventTransaction: EventTransaction}>}
   * @constructor
   */
  async Handler(event, extra = null) {
    let node = new FileNode(),
      response

    switch (event.Type) {
      case Remove:
        response = await this.Remove(event.FromPath)
        node = response.fileNode
        break
      // case Write:
      //   response = this.Write(event.FromPath)
      //   node = response.fileNode
      //   error = response.error
      //   break
      case Create:
        response = await this.Create(event.FromPath, extra)
        node = response.fileNode
        break
      case Rename:
        response = await this.Rename(event.FromPath, event.ToPath)
        node = response.fileNode
        break
      case Move:
        response = await this.Move(event.FromPath, event.ToPath)
        node = response.fileNode
        break
      default:
        return Promise.reject(new Error(`unhandled event: ${event.String()}`))
    }

    return { eventTransaction: this.MakeEventTransaction(node, event.Type) }
  }

  /**
   * @param {FileNode} tree
   * @return {VirtualTree}
   */
  Restore(tree = new FileNode()) {
    this.FileTree = tree

    return this
  }

  /**
   * @param {string} p
   * @return {?FileNode}
   */
  SearchByPath(p = '') {
    return this.FileTree.Search(p)
  }

  /**
   * @param {string} uUID
   * @return {?FileNode}
   */
  SearchByUUID(uUID) {
    return this.FileTree.SearchByUUID(uUID)
  }

  PrintTree(label = '') {
    console.log(`----------------${label}----------------`)
    console.log(JSON.stringify(this.FileTree.ToObject(), null, 2))
    console.log(`----------------${label}----------------\n\n`)
  }

  /**
   * @param {VirtualPath} fromPath
   * @param {?ExtraPayload} extra
   * @return {Promise<{fileNode: FileNode}>}
   * @constructor
   */
  async Create(fromPath, extra) {
    const eventPath = fromPath.ExcludePath(this.ParentPath),
      { fileNode } = await this.FileTree.Create(eventPath, fromPath)

    fileNode.UpdateWithExtra(extra)

    return { fileNode: fileNode }
  }

  /**
   * @param {VirtualPath} fromPath
   * @return {Promise<{fileNode: FileNode}>}
   */
  async Remove(fromPath) {
    const { fileNode } = await this.FileTree.Remove(fromPath.ExcludePath(this.ParentPath))

    return { fileNode: fileNode }
  }

  /**
   * @param {VirtualPath} fromPath
   * @param {VirtualPath} toPath
   * @return {Promise<{fileNode: FileNode}>}
   */
  async Rename(fromPath, toPath) {
    const { fileNode } = await this.FileTree.Rename(fromPath.ExcludePath(this.ParentPath),
      toPath.ExcludePath(this.ParentPath))

    return { fileNode: fileNode }
  }

  /**
   * @param {VirtualPath} fromPath
   * @param {VirtualPath} toPath
   * @return {Promise<{fileNode: FileNode}>}
   */
  async Move(fromPath, toPath) {
    const { fileNode } = await this.FileTree.Move(fromPath.ExcludePath(this.ParentPath),
      toPath.ExcludePath(this.ParentPath))

    return { fileNode: fileNode }
  }

  async Write(_fromPath) {
    return Promise.reject(new Error('unhandled event'))
  }

  /**
   * @param {FileNode} node
   * @param {string|Remove,Write,Create,Rename,Move} event
   * @return {EventTransaction}
   */
  MakeEventTransaction(node = new FileNode(), event = Create) {
    return new EventTransaction(node.Name, event, node.UUID, node.ParentUUID, node.Meta)
  }
}

/**
 * @param uUID
 * @param virtualPath
 * @param extra
 * @return {Promise<{watcher: VirtualTree, eventTransaction: EventTransaction>}
 * @constructor
 */
export const NewVirtualPathWatcher = async (uUID = '', virtualPath = '', extra = new ExtraPayload()) => {
  const path = new VirtualPath(virtualPath, true),
    root = new FileNode([],
      path.Name(),
      '',
      '',
      new MetaData(true)),
    virtualTree = new VirtualTree(root, path, path.ParentPath()),
    e = new Event(Create, path),
    { eventTransaction } = await virtualTree.Handler(e, extra)

  return { watcher: virtualTree, eventTransaction: eventTransaction }
}
