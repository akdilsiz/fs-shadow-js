import { ErrArguments, ErrFileNodeNotFound } from './errors.js'
import { FileNode } from './fileNode.js'
import { Remove, Rename, Create, Move } from './event.js'
import { EventTransaction } from './eventTransaction.js'
import { VirtualTree } from './watcherVirtual.js' // eslint-disable-line
import { FMap } from './fmap.js'

/**
 * Rebuilds a file tree from stored msgpack event transactions, in list order.
 *
 * A transaction with an empty `ParentUUID` becomes the root. A `Rename` or
 * `Move` whose node UUID no earlier `Create` added (an orphan row, or a row
 * sorted before its `Create`) cannot be applied: without `force` it is
 * skipped and the rest of the list is applied; with `force` the restore
 * rejects. `force` keeps its existing meaning: tree changes that cannot be
 * applied (this case and failed `Remove`/`Move` removals) reject instead of
 * being skipped.
 *
 * @param {Array<Uint8Array>} transactions
 * @param {boolean} force Reject instead of skipping tree changes that cannot
 *   be applied.
 * @return {Promise<{fileNode: FileNode}>}
 * @throws {Error} Rejects with `ErrArguments` when `transactions` is not an
 *   array, with the decode error for an invalid transaction and, only when
 *   `force` is set, with `ErrFileNodeNotFound` or the removal error.
 * @constructor
 */
export const CreateFileNodeWithTransactions = async (
  transactions,
  force = false
) => {
  if (!Array.isArray(transactions))
    return Promise.reject(new Error(ErrArguments))

  const table = new FMap()

  let root = new FileNode(),
    currentNode

  for (let i = 0; i < transactions.length; i++) {
    const { eventTransaction, error } = new EventTransaction().Decode(
      transactions[i]
    )
    if (error) {
      return Promise.reject(error)
    }

    const fileNode = eventTransaction.ToFileNode(),
      patchesNode =
        eventTransaction.Type === Rename || eventTransaction.Type === Move

    // Rename and Move patch the node an earlier Create put into the table.
    // Stored rows can arrive without that Create before them (rows sorted by
    // the sender's timestamp, or an orphan row whose Create was never
    // stored); the lookup below would then run on null and drop the whole
    // restore. Only the node's own UUID is checked: an empty ParentUUID still
    // means the root and is never read as an unknown parent. The check runs
    // before the root assignment so a skipped event is skipped whole and an
    // unknown node cannot replace the root.
    if (patchesNode && !table.has(fileNode.UUID)) {
      if (force) {
        return Promise.reject(new Error(ErrFileNodeNotFound))
      }

      continue
    }

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
        await root
          .RemoveByUUID(currentNode.UUID, currentNode.ParentUUID)
          .catch(e => {
            if (!force) return

            return Promise.reject(e)
          })
        if (table.has(fileNode.ParentUUID)) {
          currentNode.ParentUUID = fileNode.ParentUUID
          table.getLast(fileNode.ParentUUID).Subs.push(currentNode)
        }
        break
      case Remove:
        await root.RemoveByUUID(fileNode.UUID, fileNode.ParentUUID).catch(e => {
          if (!force) return

          return Promise.reject(e)
        })
        break
    }

    currentNode = null
  }

  table.clear()

  return { fileNode: root }
}

/**
 * Rebuilds the tree with `CreateFileNodeWithTransactions` and restores it
 * into the watcher. The watcher is left unchanged when the rebuild rejects.
 *
 * @param {Array<Uint8Array>} transactions
 * @param {VirtualTree} tw
 * @param {boolean} force Reject instead of skipping tree changes that cannot
 *   be applied.
 * @return {Promise<void>}
 * @throws {Error} Rejects with the `CreateFileNodeWithTransactions` error.
 * @constructor
 */
export const RestoreWatcherWithTransactions = async (
  transactions,
  tw,
  force = false
) => {
  const { fileNode } = await CreateFileNodeWithTransactions(transactions, force)
  tw.Restore(fileNode)
}
