const { ExtraPayload } = require('./types')
const { NewVirtualPathWatcher } = require('./watcherVirtual')

const NewVirtualWatcher = (rootUUID, fsPath = '', extra = new ExtraPayload()) => {
  return NewVirtualPathWatcher(rootUUID, fsPath, extra)
}

module.exports = {
  NewVirtualWatcher
}