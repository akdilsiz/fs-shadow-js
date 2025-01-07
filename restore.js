const FileNode = require('./fileNode')
const { EventTypes } = require('./event')
const EventTransaction = require('./eventTransaction')
const { VirtualTree } = require('./watcherVirtual')
const { FMap } = require('./fmap')

const CreateFileNodeWithTransactions = (transactions = []) => {
  const table = new FMap()

  let root = new FileNode(),
    currentNode = null

  for (let i = 0; i < transactions.length; i++) {
    const { eventTransaction, error } = new EventTransaction().Decode(transactions[i])
    if (error) {
      return { fileNode: null, error: error }
    }

    const fileNode = eventTransaction.ToFileNode()
    if (fileNode.ParentUUID === "") {
      root = fileNode
    }

    switch (eventTransaction.Type) {
      case EventTypes.Create:
        table.append(fileNode.UUID, fileNode)
        if (table.has(fileNode.ParentUUID)) {
          table.getLast(fileNode.ParentUUID).Subs.push(fileNode)
        }
        break
      case EventTypes.Rename:
        currentNode = table.getLast(fileNode.UUID)
        currentNode.Name = fileNode.Name
        currentNode.Meta = fileNode.Meta
        break
      case EventTypes.Move:
        currentNode = table.getLast(fileNode.UUID)
        root.RemoveByUUID(currentNode.UUID, currentNode.ParentUUID)
        if (table.has(fileNode.ParentUUID)) {
          currentNode.ParentUUID = fileNode.ParentUUID
          table.getLast(fileNode.ParentUUID).Subs.push(currentNode)
        }
        break
      case EventTypes.Remove:
        root.RemoveByUUID(fileNode.UUID, fileNode.ParentUUID)
        break
    }

    currentNode = null
  }

  table.clear()

  return { fileNode: root, error: null }
}

const RestoreWatcherWithTransactions = (transactions = [], tw = new VirtualTree()) => {
  const { fileNode, error } = CreateFileNodeWithTransactions(transactions)
  if (error) {
    return error
  }

  tw.Restore(fileNode)

  return null
}

module.exports = {
  CreateFileNodeWithTransactions,
  RestoreWatcherWithTransactions
}