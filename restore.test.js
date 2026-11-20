import unitJS from 'unit.js'
import { v4 } from 'uuid'
import { ErrFileNodeNotFound } from './errors.js'
import { ExtraPayload, MetaData } from './types.js'
import { Remove, Create, Rename, Move } from './event.js'
import { EventTransaction } from './eventTransaction.js'
import { NewVirtualPathWatcher } from './watcherVirtual.js'
import {
  CreateFileNodeWithTransactions,
  RestoreWatcherWithTransactions
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
        new EventTransaction('s-test-3', Remove, uUIDs[4], uUIDs[0])
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
        new EventTransaction('s-test-3', Create, uUIDs[4], uUIDs[0])
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

  it('should be error CreateFileNodeWithTransactions is invalid transactions', done => {
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
      new ExtraPayload(v4(), true)
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
      new ExtraPayload(v4(), true)
    )

    await RestoreWatcherWithTransactions(txnS, watcher)
    unitJS.assert.equal('test-1', watcher.FileTree.Name)
    unitJS.value(watcher.FileTree.SearchByUUID(uUIDs[3])).isNull()
    unitJS.assert.equal(
      watcher.FileTree.SearchByUUID(uUIDs[4]).Name,
      's-test-3'
    )
  })

  it('should be error RestoreWatcherWithTransactions is invalid transactions', async () => {
    const root = 'fs-shadow',
      rootUUID = v4(),
      txnS = ['tx1']
    const { watcher } = await NewVirtualPathWatcher(
      rootUUID,
      root,
      new ExtraPayload(v4(), true)
    )

    await RestoreWatcherWithTransactions(txnS, watcher).catch(err => {
      unitJS.value(err).isInstanceOf(Error)
    })
  })
})

// Fixed synthetic vectors for the restore tolerance tests (WEBAPP-640
// KR-12). The UUIDs, names and times are constant so the expected trees can
// be written out byte for byte; the expected JSON was recorded from the
// restore code before the tolerance change.
const fixedUUIDs = {
    root: '00000000-0000-4000-8000-000000000000',
    docs: '00000000-0000-4000-8000-00000000000a',
    note: '00000000-0000-4000-8000-00000000000b',
    pics: '00000000-0000-4000-8000-00000000000c',
    temp: '00000000-0000-4000-8000-00000000000d',
    ghost: '00000000-0000-4000-8000-0000000000ff'
  },
  // Base CreatedAt of the fixed vectors: Unix time 1700000000. Each event is
  // `fixedTimestamp + n`. Built from the ISO date so no ten-digit literal is
  // left for static analysis to misread as an imprecise number.
  fixedTimestamp = Date.parse('2023-11-14T22:13:20Z') / 1000,
  // Stored msgpack bytes of a sequential list: Create root, docs, note.txt,
  // pics; Rename and Move pics; Create and Remove tmp.bin; Write note.txt.
  sequentialTransactionsHex = [
    '85a44e616d65a4726f6f74a454797065a6637265617465a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303030aa506172656e7455554944a0a44d65746185a54973446972c3a353756da0a453697a6500a9437265617465644174ce6553f100aa5065726d697373696f6ea430363434',
    '85a44e616d65a4646f6373a454797065a6637265617465a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303061aa506172656e7455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303030a44d65746185a54973446972c3a353756da0a453697a6500a9437265617465644174ce6553f101aa5065726d697373696f6ea430363434',
    '85a44e616d65a86e6f74652e747874a454797065a6637265617465a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303062aa506172656e7455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303061a44d65746185a54973446972c2a353756dac73756d2d6e6f74652e747874a453697a650ca9437265617465644174ce6553f102aa5065726d697373696f6ea430363434',
    '85a44e616d65a470696373a454797065a6637265617465a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303063aa506172656e7455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303030a44d65746185a54973446972c3a353756da0a453697a6500a9437265617465644174ce6553f103aa5065726d697373696f6ea430363434',
    '85a44e616d65a670686f746f73a454797065a672656e616d65a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303063aa506172656e7455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303030a44d65746185a54973446972c3a353756da0a453697a6500a9437265617465644174ce6553f104aa5065726d697373696f6ea430363434',
    '85a44e616d65a670686f746f73a454797065a46d6f7665a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303063aa506172656e7455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303061a44d65746185a54973446972c3a353756da0a453697a6500a9437265617465644174ce6553f105aa5065726d697373696f6ea430363434',
    '85a44e616d65a7746d702e62696ea454797065a6637265617465a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303064aa506172656e7455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303030a44d65746185a54973446972c2a353756dab73756d2d746d702e62696ea453697a6507a9437265617465644174ce6553f106aa5065726d697373696f6ea430363434',
    '85a44e616d65a7746d702e62696ea454797065a672656d6f7665a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303064aa506172656e7455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303030a44d65746185a54973446972c2a353756dab73756d2d746d702e62696ea453697a6507a9437265617465644174ce6553f107aa5065726d697373696f6ea430363434',
    '85a44e616d65a86e6f74652e747874a454797065a57772697465a455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303062aa506172656e7455554944d92430303030303030302d303030302d343030302d383030302d303030303030303030303061a44d65746185a54973446972c2a353756dac73756d2d6e6f74652e747874a453697a6514a9437265617465644174ce6553f108aa5065726d697373696f6ea430363434'
  ]

/**
 * Builds one fixed event transaction. Files get a `sum-<name>` sum so file
 * and folder meta differ in the expected trees.
 * @param {string} name
 * @param {string} type
 * @param {string} uUID
 * @param {string} parentUUID
 * @param {boolean} isDir
 * @param {number} size
 * @param {number} createdAt
 * @return {EventTransaction}
 */
function fixedTransaction(
  name,
  type,
  uUID,
  parentUUID,
  isDir,
  size,
  createdAt
) {
  const sum = isDir ? '' : 'sum-' + name

  return new EventTransaction(
    name,
    type,
    uUID,
    parentUUID,
    new MetaData(isDir, sum, size, createdAt, '0644')
  )
}

/**
 * Encodes fixed event transactions the way consumers store them.
 * @param {Array<EventTransaction>} eventTransactions
 * @return {Array<Uint8Array>}
 */
function encodeTransactions(eventTransactions) {
  const encodedTxnS = []

  for (const eventTransaction of eventTransactions) {
    const { encoded } = eventTransaction.Encode()
    encodedTxnS.push(encoded)
  }

  return encodedTxnS
}

/**
 * Expected JSON of a nested node. `FileNode.ToJSON` writes nested nodes
 * with their PascalCase class fields, in this key order.
 * @param {Array<object>} subs
 * @param {string} name
 * @param {string} uUID
 * @param {string} parentUUID
 * @param {boolean} isDir
 * @param {number} size
 * @param {number} createdAt
 * @return {object}
 */
function expectedSubNode(subs, name, uUID, parentUUID, isDir, size, createdAt) {
  return {
    Subs: subs,
    Name: name,
    UUID: uUID,
    ParentUUID: parentUUID,
    Meta: {
      IsDir: isDir,
      Sum: isDir ? '' : 'sum-' + name,
      Size: size,
      CreatedAt: createdAt,
      UTCCreatedAt: createdAt,
      Permission: '0644'
    }
  }
}

/**
 * Expected `FileNode.ToJSON` string of a root folder. The root itself is
 * written in snake_case, in this key order.
 * @param {Array<object>} subs
 * @param {string} name
 * @param {string} uUID
 * @param {number} createdAt
 * @return {string}
 */
function expectedRootJSON(subs, name, uUID, createdAt) {
  return JSON.stringify({
    subs: subs,
    name: name,
    uuid: uUID,
    parent_uuid: '',
    meta: {
      is_dir: true,
      sum: '',
      size: 0,
      created_at: createdAt,
      permission: '0644',
      utc_created_at: createdAt
    }
  })
}

/**
 * Root, docs and pics: the tree every list with one skipped orphan event
 * between `docs` and `pics` must build.
 * @return {string}
 */
function expectedRootWithDocsAndPics() {
  return expectedRootJSON(
    [
      expectedSubNode(
        [],
        'docs',
        fixedUUIDs.docs,
        fixedUUIDs.root,
        true,
        0,
        fixedTimestamp + 1
      ),
      expectedSubNode(
        [],
        'pics',
        fixedUUIDs.pics,
        fixedUUIDs.root,
        true,
        0,
        fixedTimestamp + 3
      )
    ],
    'root',
    fixedUUIDs.root,
    fixedTimestamp
  )
}

/**
 * Root, docs, then `event` for `ghost`, then pics.
 * @param {EventTransaction} event
 * @return {Array<Uint8Array>}
 */
function transactionsWithEventBetweenDocsAndPics(event) {
  return encodeTransactions([
    fixedTransaction(
      'root',
      Create,
      fixedUUIDs.root,
      '',
      true,
      0,
      fixedTimestamp
    ),
    fixedTransaction(
      'docs',
      Create,
      fixedUUIDs.docs,
      fixedUUIDs.root,
      true,
      0,
      fixedTimestamp + 1
    ),
    event,
    fixedTransaction(
      'pics',
      Create,
      fixedUUIDs.pics,
      fixedUUIDs.root,
      true,
      0,
      fixedTimestamp + 3
    )
  ])
}

/**
 * Runs a restore that must reject and returns the rejection.
 * @param {Array<Uint8Array>} transactions
 * @param {boolean} force
 * @return {Promise<?Error>} The rejection, or null when the restore resolved.
 */
async function restoreRejection(transactions, force) {
  try {
    await CreateFileNodeWithTransactions(transactions, force)
  } catch (e) {
    return e
  }

  return null
}

describe('Restore Tolerance Tests', () => {
  it('restores fixed stored bytes of a sequential list to the same tree', async () => {
    const transactions = [],
      expected = expectedRootJSON(
        [
          expectedSubNode(
            [
              expectedSubNode(
                [],
                'note.txt',
                fixedUUIDs.note,
                fixedUUIDs.docs,
                false,
                12,
                fixedTimestamp + 2
              ),
              expectedSubNode(
                [],
                'photos',
                fixedUUIDs.pics,
                fixedUUIDs.docs,
                true,
                0,
                fixedTimestamp + 4
              )
            ],
            'docs',
            fixedUUIDs.docs,
            fixedUUIDs.root,
            true,
            0,
            fixedTimestamp + 1
          )
        ],
        'root',
        fixedUUIDs.root,
        fixedTimestamp
      )

    for (const transactionHex of sequentialTransactionsHex) {
      transactions.push(new Uint8Array(Buffer.from(transactionHex, 'hex')))
    }

    const withoutForce = await CreateFileNodeWithTransactions(transactions),
      withForce = await CreateFileNodeWithTransactions(transactions, true)

    unitJS.assert.equal(withoutForce.fileNode.ToJSON(), expected)
    unitJS.assert.equal(withForce.fileNode.ToJSON(), expected)
  })

  it('keeps the root replacement of an empty ParentUUID Rename', async () => {
    const transactions = encodeTransactions([
        fixedTransaction(
          'root',
          Create,
          fixedUUIDs.root,
          '',
          true,
          0,
          fixedTimestamp
        ),
        fixedTransaction(
          'docs',
          Create,
          fixedUUIDs.docs,
          fixedUUIDs.root,
          true,
          0,
          fixedTimestamp + 1
        ),
        fixedTransaction(
          'root-renamed',
          Rename,
          fixedUUIDs.root,
          '',
          true,
          0,
          fixedTimestamp + 2
        )
      ]),
      expected = expectedRootJSON(
        [],
        'root-renamed',
        fixedUUIDs.root,
        fixedTimestamp + 2
      )

    const withoutForce = await CreateFileNodeWithTransactions(transactions),
      withForce = await CreateFileNodeWithTransactions(transactions, true)

    unitJS.assert.equal(withoutForce.fileNode.ToJSON(), expected)
    unitJS.assert.equal(withForce.fileNode.ToJSON(), expected)
  })

  it('keeps the root replacement and force rejection of an empty ParentUUID Move', async () => {
    const transactions = encodeTransactions([
        fixedTransaction(
          'root',
          Create,
          fixedUUIDs.root,
          '',
          true,
          0,
          fixedTimestamp
        ),
        fixedTransaction(
          'docs',
          Create,
          fixedUUIDs.docs,
          fixedUUIDs.root,
          true,
          0,
          fixedTimestamp + 1
        ),
        fixedTransaction(
          'docs',
          Move,
          fixedUUIDs.docs,
          '',
          true,
          0,
          fixedTimestamp + 2
        )
      ]),
      expected = expectedRootJSON(
        [],
        'docs',
        fixedUUIDs.docs,
        fixedTimestamp + 2
      )

    const { fileNode } = await CreateFileNodeWithTransactions(transactions),
      rejection = await restoreRejection(transactions, true)

    unitJS.assert.equal(fileNode.ToJSON(), expected)
    unitJS.assert.equal(rejection.constructor, Error)
    unitJS.assert.equal(rejection.message, ErrFileNodeNotFound)
  })

  it('skips an orphan Rename and builds the rest of the tree', async () => {
    const transactions = transactionsWithEventBetweenDocsAndPics(
      fixedTransaction(
        'ghost',
        Rename,
        fixedUUIDs.ghost,
        fixedUUIDs.root,
        false,
        1,
        fixedTimestamp + 2
      )
    )

    const { fileNode } = await CreateFileNodeWithTransactions(transactions)

    unitJS.assert.equal(fileNode.ToJSON(), expectedRootWithDocsAndPics())
  })

  it('skips an orphan Move and builds the rest of the tree', async () => {
    const transactions = transactionsWithEventBetweenDocsAndPics(
      fixedTransaction(
        'ghost',
        Move,
        fixedUUIDs.ghost,
        fixedUUIDs.docs,
        false,
        1,
        fixedTimestamp + 2
      )
    )

    const { fileNode } = await CreateFileNodeWithTransactions(transactions)

    unitJS.assert.equal(fileNode.ToJSON(), expectedRootWithDocsAndPics())
  })

  it('skips an orphan Rename with an empty ParentUUID and keeps the root', async () => {
    const transactions = transactionsWithEventBetweenDocsAndPics(
      fixedTransaction(
        'ghost',
        Rename,
        fixedUUIDs.ghost,
        '',
        false,
        1,
        fixedTimestamp + 2
      )
    )

    const { fileNode } = await CreateFileNodeWithTransactions(transactions)

    unitJS.assert.equal(fileNode.ToJSON(), expectedRootWithDocsAndPics())
  })

  it('keeps skipping an orphan Remove without force', async () => {
    const transactions = transactionsWithEventBetweenDocsAndPics(
      fixedTransaction(
        'ghost',
        Remove,
        fixedUUIDs.ghost,
        fixedUUIDs.root,
        false,
        1,
        fixedTimestamp + 2
      )
    )

    const { fileNode } = await CreateFileNodeWithTransactions(transactions),
      rejection = await restoreRejection(transactions, true)

    unitJS.assert.equal(fileNode.ToJSON(), expectedRootWithDocsAndPics())
    unitJS.assert.equal(rejection.message, ErrFileNodeNotFound)
  })

  it('skips a Rename sorted before the Create of its node', async () => {
    // Rows sorted by an older sender timestamp put the Rename first; the
    // node keeps its Create name.
    const transactions = encodeTransactions([
        fixedTransaction(
          'root',
          Create,
          fixedUUIDs.root,
          '',
          true,
          0,
          fixedTimestamp
        ),
        fixedTransaction(
          'later-name',
          Rename,
          fixedUUIDs.note,
          fixedUUIDs.root,
          false,
          3,
          fixedTimestamp + 1
        ),
        fixedTransaction(
          'first-name',
          Create,
          fixedUUIDs.note,
          fixedUUIDs.root,
          false,
          3,
          fixedTimestamp + 2
        ),
        fixedTransaction(
          'docs',
          Create,
          fixedUUIDs.docs,
          fixedUUIDs.root,
          true,
          0,
          fixedTimestamp + 3
        )
      ]),
      expected = expectedRootJSON(
        [
          expectedSubNode(
            [],
            'first-name',
            fixedUUIDs.note,
            fixedUUIDs.root,
            false,
            3,
            fixedTimestamp + 2
          ),
          expectedSubNode(
            [],
            'docs',
            fixedUUIDs.docs,
            fixedUUIDs.root,
            true,
            0,
            fixedTimestamp + 3
          )
        ],
        'root',
        fixedUUIDs.root,
        fixedTimestamp
      )

    const { fileNode } = await CreateFileNodeWithTransactions(transactions)

    unitJS.assert.equal(fileNode.ToJSON(), expected)
  })

  it('rejects an orphan Rename or Move with force', async () => {
    const renameRejection = await restoreRejection(
        transactionsWithEventBetweenDocsAndPics(
          fixedTransaction(
            'ghost',
            Rename,
            fixedUUIDs.ghost,
            fixedUUIDs.root,
            false,
            1,
            fixedTimestamp + 2
          )
        ),
        true
      ),
      moveRejection = await restoreRejection(
        transactionsWithEventBetweenDocsAndPics(
          fixedTransaction(
            'ghost',
            Move,
            fixedUUIDs.ghost,
            fixedUUIDs.docs,
            false,
            1,
            fixedTimestamp + 2
          )
        ),
        true
      )

    unitJS.assert.equal(renameRejection.constructor, Error)
    unitJS.assert.equal(renameRejection.message, ErrFileNodeNotFound)
    unitJS.assert.equal(moveRejection.constructor, Error)
    unitJS.assert.equal(moveRejection.message, ErrFileNodeNotFound)
  })

  it('RestoreWatcherWithTransactions restores a list with an orphan Rename', async () => {
    const transactions = transactionsWithEventBetweenDocsAndPics(
      fixedTransaction(
        'ghost',
        Rename,
        fixedUUIDs.ghost,
        fixedUUIDs.root,
        false,
        1,
        fixedTimestamp + 2
      )
    )
    const { watcher } = await NewVirtualPathWatcher(
      v4(),
      'fs-shadow',
      new ExtraPayload(v4(), true)
    )

    await RestoreWatcherWithTransactions(transactions, watcher)

    unitJS.assert.equal(
      watcher.FileTree.ToJSON(),
      expectedRootWithDocsAndPics()
    )
    unitJS.value(watcher.SearchByUUID(fixedUUIDs.ghost)).isNull()
  })
})
