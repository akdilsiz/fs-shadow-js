const FileNode = require('./fileNode')
const { Path } = require('./path')
const { ExtraPayload } = require('./types')
const { EventTypes, Event } = require('./event')
const EventTransaction = require('./eventTransaction')

class Watcher {
  onerror = () => {}
  onevents = () => {}
  Handler(event = new Event(), extra = new ExtraPayload()) {
    return { eventTransaction: new EventTransaction(), error: null }
  }
  Stop() {}
  Start() {}
  Watch() {}
  PrintTree(label = '') {}
  Restore(tree = new FileNode()) {}
  SearchByPath(p = '') {
    return new FileNode()
  }
  SearchByUUID(uUID = '') {
    return new FileNode()
  }
  Create(fromPath = new Path(), extra = new ExtraPayload()) {
    return { fileNode: new FileNode(), error: null }
  }
  Write(fromPath = new Path()) {
    return { fileNode: new FileNode(), error: null }
  }
  Remove(fromPath = new Path()) {
    return { fileNode: new FileNode(), error: null }
  }
  Move(fromPath = new Path(), toPath = new Path()) {
    return { fileNode: new FileNode(), error: null }
  }
  Rename(fromPath = new Path(), toPath = new Path()) {
    return { fileNode: new FileNode(), error: null }
  }

  MakeEventTransaction(node = new FileNode(), event = EventTypes.Create) {
    return new EventTransaction(node.Name, event, node.UUID, node.ParentUUID, node.Meta)
  }
}

const NewVirtualWatcher = (fsPath = '', extra = new ExtraPayload()) => {

}

module.exports = {
  Watcher,
  NewVirtualWatcher
}