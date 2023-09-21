const FileNode = require('./fileNode')
const { Path } = require('./path')
const VirtualPath = require('./virtualPath')
const { ExtraPayload, MetaData } = require('./types')
const { Watcher } = require('./watcher')
const { Event, EventTypes } = require('./event')
const EventTransaction = require('./eventTransaction')

class VirtualTree extends Watcher {
  FileTree = new FileNode()
  Path = new Path()
  ParentPath = new Path()

  constructor(fileTree = new FileNode(), path = new Path(), parentPath = new Path()) {
    super()
    this.FileTree = fileTree
    this.Path = path
    this.ParentPath = parentPath
  }
  Move(fromPath = new Path(), toPath = new Path()) {

  }

  Write(fromPath = new Path()) {
    return { fileNode: null, error: null }
  }

  Handler(event = new Event(), extra = new ExtraPayload()) {
    let error = null,
      node = new FileNode(),
      bExtra = new ExtraPayload(),
      response

    if (extra.UUID.length) {
      bExtra = extra
    }

    switch (event.Type) {
      case EventTypes.Remove:
        response = this.Remove(event.FromPath)
        node = response.fileNode
        error = response.error
        break
      case EventTypes.Write:
        response = this.Write(event.FromPath)
        node = response.fileNode
        error = response.error
        break
      case EventTypes.Create:
        response = this.Create(event.FromPath, bExtra)
        node = response.fileNode
        error = response.error
        break
      case EventTypes.Rename:
        response = this.Rename(event.FromPath, event.ToPath)
        node = response.fileNode
        error = response.error
        break
      case EventTypes.Move:
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
  }

  SearchByPath(p = '') {}
}

const NewVirtualPathWatcher = (virtualPath = '', extra = new ExtraPayload()) => {
  const path = new VirtualPath(virtualPath, true),
    root = new FileNode([],
      path.Name(),
      '',
      new MetaData(true)),
    virtualTree = new VirtualTree(root, path, path.ParentPath()),
    e = new Event(EventTypes.Create, path),
    { eventTransaction, error } = virtualTree.Handler(e, extra)

  if (error) {
    return { watcher: null, eventTransaction: null, error: error }
  }

  return { watcher: virtualTree, eventTransaction: eventTransaction, error: null }
}

module.exports = {
  VirtualTree
}