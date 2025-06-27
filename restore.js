import { ErrArguments } from './errors.js'
import FileNode from'./fileNode.js'
import { Remove, Rename, Create, Move } from './event.js'
import EventTransaction from './eventTransaction.js'
import { VirtualTree } from './watcherVirtual.js'
import { FMap } from './fmap.js'

/**
 * @param {Array<object>} transactions
 * @return {Promise<{fileNode: FileNode}>}
 * @constructor
 */
export const CreateFileNodeWithTransactions = async (transactions) => {
  if (!Array.isArray(transactions)) return Promise.reject(new Error(ErrArguments))

  const table = new FMap()

  let root = new FileNode(),
    currentNode

  for (let i = 0; i < transactions.length; i++) {
    const { eventTransaction, error } = new EventTransaction().Decode(transactions[i])
    if (error) {
      return Promise.reject(error)
    }

    const fileNode = eventTransaction.ToFileNode()
    if (fileNode.ParentUUID === '') {
      root = fileNode
    }

    switch (eventTransaction.Type) {
      case Create:
        table.append(fileNode.UUID, fileNode)
        if (table.has(fileNode.ParentUUID)) {
          table.getLast(fileNode.ParentUUID).Subs.push(fileNode)
        }
        break
      case Rename:
        currentNode = table.getLast(fileNode.UUID)
        currentNode.Name = fileNode.Name
        currentNode.Meta = fileNode.Meta
        break
      case Move:
        currentNode = table.getLast(fileNode.UUID)
        await root.RemoveByUUID(currentNode.UUID, currentNode.ParentUUID)
        if (table.has(fileNode.ParentUUID)) {
          currentNode.ParentUUID = fileNode.ParentUUID
          table.getLast(fileNode.ParentUUID).Subs.push(currentNode)
        }
        break
      case Remove:
        await root.RemoveByUUID(fileNode.UUID, fileNode.ParentUUID)
        break
    }

    currentNode = null
  }

  table.clear()

  return { fileNode: root }
}

/**
 * @param {Array<object>} transactions
 * @param {VirtualTree} tw
 * @return {Promise<void>}
 */
export const RestoreWatcherWithTransactions = async (transactions = [], tw = new VirtualTree()) => {
  const { fileNode } = await CreateFileNodeWithTransactions(transactions)
  tw.Restore(fileNode)
}
