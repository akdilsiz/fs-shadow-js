const { ExtraPayload } = require('./types')
const { NewVirtualPathWatcher } = require('./watcherVirtual')

const NewVirtualWatcher = (fsPath = '', extra = new ExtraPayload()) => {
  return NewVirtualPathWatcher(fsPath, extra)
}

module.exports = {
  NewVirtualWatcher
}