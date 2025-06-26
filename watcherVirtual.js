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
  Handler(event, extra) {
    let error = null,
      node = new FileNode(),
      bExtra = null,
      response

    if (extra) {
      bExtra = extra
    }

    switch (event.Type) {
      case Remove:
        response = this.Remove(event.FromPath)
        node = response.fileNode
        error = response.error
        break
      // case Write:
      //   response = this.Write(event.FromPath)
      //   node = response.fileNode
      //   error = response.error
      //   break
      case Create:
        response = this.Create(event.FromPath, bExtra)
        node = response.fileNode
        error = response.error
        break
      case Rename:
        response = this.Rename(event.FromPath, event.ToPath)
        node = response.fileNode
        error = response.error
        break
      case Move:
        response = this.Move(event.FromPath, event.ToPath)
        node = response.fileNode
        error = response.error
        break
      default:
        error = new Error(`unhandled event: ${event.String()}`)
        break
    }
    if (error) {
      return { eventTransaction: null, error: error }
    }

    return { eventTransaction: this.MakeEventTransaction(node, event.Type), error: null }
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
  Create(fromPath = new VirtualPath(), extra = new ExtraPayload()) {
    const eventPath = fromPath.ExcludePath(this.ParentPath),
      { fileNode, error } = this.FileTree.Create(eventPath, fromPath)

    if (error) {
      return { fileNode: null, error: error }
    }

    fileNode.UpdateWithExtra(extra)

    return { fileNode: fileNode, error: null }
  }
  Remove(fromPath = new VirtualPath()) {
    const { fileNode, error } = this.FileTree.Remove(fromPath.ExcludePath(this.ParentPath))
    if (error) {
      return { fileNode: null, error: error }
    }

    return { fileNode: fileNode, error: null }
  }
  Rename(fromPath = new VirtualPath(), toPath = new VirtualPath()) {
    const { fileNode, error } = this.FileTree.Rename(fromPath.ExcludePath(this.ParentPath),
      toPath.ExcludePath(this.ParentPath))

    if (error) {
      return { fileNode: null, error: error }
    }

    return { fileNode: fileNode, error: null }
  }
  Move(fromPath = new VirtualPath(), toPath = new VirtualPath()) {
    const { fileNode, error } = this.FileTree.Move(fromPath.ExcludePath(this.ParentPath),
      toPath.ExcludePath(this.ParentPath))

    if (error) {
      return { fileNode: null, error: error }
    }

    return { fileNode: fileNode, error: null }
  }
  Write(fromPath = new VirtualPath()) {
    return { fileNode: null, error: null }
  }

  MakeEventTransaction(node = new FileNode(), event = Create) {
    return  new EventTransaction(node.Name, event, node.UUID, node.ParentUUID, node.Meta)
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
