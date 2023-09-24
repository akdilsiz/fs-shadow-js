const unitJS = require('unit.js')
const { v4 } = require('uuid')
const { ExtraPayload } = require('./types')
const { EventTypes } = require('./event')
const EventTransaction = require('./eventTransaction')
const { NewVirtualPathWatcher } = require('./watcherVirtual')
const { CreateFileNodeWithTransactions, RestoreWatcherWithTransactions } = require('./restore')

const generateTransactionsBytes = () => {
  const uUIDs = [v4(), v4(), v4(), v4(), v4()],
    eTxnS = [
      new EventTransaction('test-1', EventTypes.Create, uUIDs[0]),
      new EventTransaction('s-test-1', EventTypes.Create, uUIDs[1], uUIDs[0]),
      new EventTransaction('ss-test-1', EventTypes.Create, uUIDs[2], uUIDs[1]),
      new EventTransaction('s-test-2', EventTypes.Create, uUIDs[3], uUIDs[0]),
      new EventTransaction('s-test-2-rename', EventTypes.Rename, uUIDs[3], uUIDs[0]),
      new EventTransaction('s-test-2-rename', EventTypes.Move, uUIDs[3], uUIDs[0]),
      new EventTransaction('s-test-3', EventTypes.Create, uUIDs[4], uUIDs[0]),
      new EventTransaction('s-test-3', EventTypes.Remove, uUIDs[4], uUIDs[0])
    ],
    encodedTxnS = []

  for (let i = 0; i < eTxnS.length; i++) {
    const { encoded } = eTxnS[i].Encode()
    encodedTxnS.push(encoded)
  }

  return encodedTxnS
}

describe('Restore Tests', () => {
  it('CreateFileNodeWithTransactions', () => {
    const txnS = generateTransactionsBytes()

    const { fileNode, error } = CreateFileNodeWithTransactions(txnS)
    unitJS.value(error).isNull()
    unitJS.assert.equal('test-1', fileNode.Name)
    unitJS.assert.equal('s-test-1', fileNode.Subs[0].Name)
  })

  it('Should be error CreateFileNodeWithTransactions is invalid transactions', () => {
    const { fileNode, error } = CreateFileNodeWithTransactions(['tx1', 'tx2'])
    unitJS.value(error).isInstanceOf(Error)
    unitJS.value(fileNode).isNull()
  })

  it('RestoreWatcherWithTransactions', () => {
    const root = 'fs-shadow',
      txnS = generateTransactionsBytes()
    const { watcher, error } = NewVirtualPathWatcher(root, new ExtraPayload(v4(), true))
    unitJS.value(error).isNull()

    const err = RestoreWatcherWithTransactions(txnS, watcher)
    unitJS.value(err).isNull()
    unitJS.assert.equal('test-1', watcher.FileTree.Name)
    unitJS.assert.equal('s-test-1', watcher.FileTree.Subs[0].Name)
  })

  it('Should be error RestoreWatcherWithTransactions is invalid transactions', () => {
    const root = 'fs-shadow',
      txnS = ['tx1']
    const { watcher, error } = NewVirtualPathWatcher(root, new ExtraPayload(v4(), true))
    unitJS.value(error).isNull()

    const err = RestoreWatcherWithTransactions(txnS, watcher)
    unitJS.value(err).isInstanceOf(Error)
  })
})