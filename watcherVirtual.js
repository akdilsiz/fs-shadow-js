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
   * params event = new Event(), extra = new ExtraPayload()
   */
  async Handler(event, extra) {
    let node = new FileNode(),
      bExtra = null,
      response

    if (extra) {
      bExtra = extra
    }

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
        response = await this.Create(event.FromPath, bExtra)
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
  Restore(tree = new FileNode()) {
    this.FileTree = tree

    return this
  }

  SearchByPath(p = '') {
    return this.FileTree.Search(p)
  }
  SearchByUUID(uUID = '') {
    return this.FileTree.SearchByUUID(uUID)
  }
  PrintTree(label = '') {
    console.log(`----------------${label}----------------`)
    console.log(JSON.stringify(this.FileTree.ToObject(), null, 2))
    console.log(`----------------${label}----------------\n\n`)
  }
  async Create(fromPath = new VirtualPath(), extra = new ExtraPayload()) {
    const eventPath = fromPath.ExcludePath(this.ParentPath),
      { fileNode } = await this.FileTree.Create(eventPath, fromPath)

    fileNode.UpdateWithExtra(extra)

    return { fileNode: fileNode }
  }
  async Remove(fromPath = new VirtualPath()) {
    const { fileNode } = await this.FileTree.Remove(fromPath.ExcludePath(this.ParentPath))

    return { fileNode: fileNode }
  }
  async Rename(fromPath = new VirtualPath(), toPath = new VirtualPath()) {
    const { fileNode } = await this.FileTree.Rename(fromPath.ExcludePath(this.ParentPath),
      toPath.ExcludePath(this.ParentPath))

    return { fileNode: fileNode }
  }
  async Move(fromPath = new VirtualPath(), toPath = new VirtualPath()) {
    const { fileNode } = await this.FileTree.Move(fromPath.ExcludePath(this.ParentPath),
      toPath.ExcludePath(this.ParentPath))

    return { fileNode: fileNode }
  }
  async Write(_fromPath = new VirtualPath()) {
    return Promise.reject(new Error('unhandled event'))
  }

  MakeEventTransaction(node = new FileNode(), event = Create) {
    return new EventTransaction(node.Name, event, node.UUID, node.ParentUUID, node.Meta)
  }
}

export const NewVirtualPathWatcher = async (uUID = '', virtualPath = '', extra = new ExtraPayload()) => {
  const path = new VirtualPath(virtualPath, true),
    root = new FileNode([],
      path.Name(),
      '',
      '',
      new MetaData(true)),
    virtualTree = new VirtualTree(root, path, path.ParentPath()),
    e = new Event(Create, path),
    { eventTransaction, error } = virtualTree.Handler(e, extra)

  if (error) {
    return Promise.reject(error)
  }

  return { watcher: virtualTree, eventTransaction: eventTransaction }
}
