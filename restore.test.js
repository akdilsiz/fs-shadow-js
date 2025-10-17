import unitJS from 'unit.js'
import { v4 } from 'uuid'
import { ExtraPayload } from './types.js'
import { Remove, Create, Rename, Move } from './event.js'
import EventTransaction from './eventTransaction.js'
import { NewVirtualPathWatcher } from './watcherVirtual.js'
import {
  CreateFileNodeWithTransactions,
  RestoreWatcherWithTransactions,
} from './restore.js'

const generateTransactionsBytes = () => {
    const uUIDs = [v4(), v4(), v4(), v4(), v4()],
      eTxnS = [
        new EventTransaction('test-1', Create, uUIDs[0]),
        new EventTransaction('s-test-1', Create, uUIDs[1], uUIDs[0]),
        new EventTransaction('ss-test-1', Create, uUIDs[2], uUIDs[1]),
        new EventTransaction('s-test-2', Create, uUIDs[3], uUIDs[0]),
        new EventTransaction('s-test-2-rename', Rename, uUIDs[3], uUIDs[0]),
        new EventTransaction('s-test-2-rename', Move, uUIDs[3], uUIDs[0]),
        new EventTransaction('s-test-3', Create, uUIDs[4], uUIDs[0]),
        new EventTransaction('s-test-3', Remove, uUIDs[4], uUIDs[0]),
      ],
      encodedTxnS = []

    for (let i = 0; i < eTxnS.length; i++) {
      const { encoded } = eTxnS[i].Encode()
      encodedTxnS.push(encoded)
    }

    return encodedTxnS
  },
  generateTransactionsBytesTwo = () => {
    const uUIDs = [v4(), v4(), v4(), v4(), v4()],
      eTxnS = [
        new EventTransaction('test-1', Create, uUIDs[0]),
        new EventTransaction('s-test-1', Create, uUIDs[1], uUIDs[0]),
        new EventTransaction('ss-test-1', Create, uUIDs[2], uUIDs[1]),
        new EventTransaction('s-test-2', Create, uUIDs[3], uUIDs[0]),
        new EventTransaction('s-test-2-rename', Rename, uUIDs[3], uUIDs[0]),
        new EventTransaction('s-test-2-moved', Move, uUIDs[3], uUIDs[1]),
        new EventTransaction('s-test-2-moved', Remove, uUIDs[3], uUIDs[1]),
        new EventTransaction('s-test-3', Create, uUIDs[4], uUIDs[0]),
      ],
      encodedTxnS = []

    for (let i = 0; i < eTxnS.length; i++) {
      const { encoded } = eTxnS[i].Encode()
      encodedTxnS.push(encoded)
    }

    return { encodedTxnS, uUIDs }
  }

describe('Restore Tests', () => {
  it('CreateFileNodeWithTransactions', async () => {
    const txnS = generateTransactionsBytes()

    const { fileNode } = await CreateFileNodeWithTransactions(txnS)
    unitJS.assert.equal('test-1', fileNode.Name)
    unitJS.assert.equal('s-test-1', fileNode.Subs[0].Name)
  })

  it('should be error CreateFileNodeWithTransactions is invalid transactions', (done) => {
    CreateFileNodeWithTransactions(['tx1', 'tx2'])
      .then(() => {
        done(new Error('invalid'))
      })
      .catch(() => {
        done()
      })
  })

  it('RestoreWatcherWithTransactions', async () => {
    const root = 'fs-shadow',
      rootUUID = v4(),
      txnS = generateTransactionsBytes()
    const { watcher } = await NewVirtualPathWatcher(
      rootUUID,
      root,
      new ExtraPayload(v4(), true),
    )

    await RestoreWatcherWithTransactions(txnS, watcher)
    unitJS.assert.equal('test-1', watcher.FileTree.Name)
    unitJS.assert.equal('s-test-1', watcher.FileTree.Subs[0].Name)
  })

  it('RestoreWatcherWithTransactions case two', async () => {
    const root = 'fs-shadow',
      rootUUID = v4(),
      { encodedTxnS: txnS, uUIDs } = generateTransactionsBytesTwo()
    const { watcher } = await NewVirtualPathWatcher(
      rootUUID,
      root,
      new ExtraPayload(v4(), true),
    )

    await RestoreWatcherWithTransactions(txnS, watcher)
    unitJS.assert.equal('test-1', watcher.FileTree.Name)
    unitJS.value(watcher.FileTree.SearchByUUID(uUIDs[3])).isNull()
    unitJS.assert.equal(
      watcher.FileTree.SearchByUUID(uUIDs[4]).Name,
      's-test-3',
    )
  })

  it('should be error RestoreWatcherWithTransactions is invalid transactions', async () => {
    const root = 'fs-shadow',
      rootUUID = v4(),
      txnS = ['tx1']
    const { watcher } = await NewVirtualPathWatcher(
      rootUUID,
      root,
      new ExtraPayload(v4(), true),
    )

    await RestoreWatcherWithTransactions(txnS, watcher).catch((err) => {
      unitJS.value(err).isInstanceOf(Error)
    })
  })
})
