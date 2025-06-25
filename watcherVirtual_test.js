const unitJS = require('unit.js')
const { v4 } = require('uuid')
const { ErrFileNodeExists, ErrFileNodeNotFound} = require('./errors')
const VirtualPath = require('./virtualPath')
const { ExtraPayload, MetaData } = require('./types')
const { Watcher } = require('./watcher')
const { Event, EventTypes } = require('./event')
const EventTransaction = require('./eventTransaction')
const FileNode = require('./fileNode')
const { VirtualTree, NewVirtualPathWatcher } = require('./watcherVirtual')

const makeDummyTree = () => {
  const rootUUID = v4()

  return new FileNode(
    [
      new FileNode([], 'a', v4(), rootUUID),
      new FileNode([], 'b', v4(), rootUUID),
      new FileNode([], 'c', v4(), rootUUID),
      new FileNode([], 'd', v4(), rootUUID)
    ],
    'alphabet',
    rootUUID
  )
}

describe('VirtualTree Tests', () => {
  it('with valid params', () => {
    const path = new VirtualPath('vPath', true),
      rootUUID = v4(),
      root = new FileNode([], 'vPath', rootUUID, '', new MetaData(true)),
      virtualTree = new VirtualTree(root, path, path.ParentPath())

    unitJS.assert.equal(root, virtualTree.FileTree)
    unitJS.assert.equal(path, virtualTree.Path)
    unitJS.value(path.ParentPath()).is(virtualTree.ParentPath)
  })

  it('.Handler() with events', () => {
    const path = new VirtualPath('vPath', true),
      rootUUID = v4(),
      rootFolder = '/tmp',
      testFolder = `${rootFolder}/fs-shadow`,
      rootPath = new VirtualPath(testFolder, true),
      folder = `${testFolder}/test`,
      folderPath = new VirtualPath(folder, true),
      eventFolderPath = folderPath.ExcludePath(new VirtualPath(rootFolder, true)),
      emptyFile = `${testFolder}/test.txt`,
      filePath = new VirtualPath(emptyFile, false),
      eventFilePath = filePath.ExcludePath(new VirtualPath(rootFolder, true)),
      renameFilePath = new VirtualPath(`${testFolder}/test-2.txt`, false),
      renameEventFilePath = renameFilePath.ExcludePath(new VirtualPath(rootFolder, true)),
      moveFolder = `${testFolder}/moveFolder`,
      moveFolderPath = new VirtualPath(moveFolder, true),
      moveFolderEventPath = moveFolderPath.ExcludePath(new VirtualPath(rootFolder, true)),
      movedFilePath = new VirtualPath(`${moveFolder}/test-2.txt`, true),
      root = new FileNode([], rootPath.Name(), rootUUID, '', new MetaData(true)),
      virtualTree = new VirtualTree(root, path, path.ParentPath())

    const { eventTransaction, error } = virtualTree.Handler(new Event(EventTypes.Create, eventFolderPath, folderPath), new ExtraPayload(v4()))

    unitJS.value(error).isNull()
    unitJS.value(eventTransaction).isInstanceOf(EventTransaction)
    unitJS.assert.equal(1, virtualTree.FileTree.Subs.length)

    const { eventTransaction: eventTransaction2, error: error2 } = virtualTree.Handler(new Event(EventTypes.Create, eventFilePath, filePath), new ExtraPayload(v4()))

    unitJS.value(error2).isNull()
    unitJS.value(eventTransaction2).isInstanceOf(EventTransaction)
    unitJS.assert.equal(2, virtualTree.FileTree.Subs.length)

    const { eventTransaction: eventTransaction3, error: error3 } = virtualTree.Handler(new Event(EventTypes.Rename, eventFilePath, renameEventFilePath))

    unitJS.value(error3).isNull()
    unitJS.value(eventTransaction3).isInstanceOf(EventTransaction)
    const searchedNode = virtualTree.SearchByPath(renameEventFilePath.String())
    unitJS.assert.equal('test-2.txt', searchedNode.Name)
    unitJS.assert.equal(rootUUID, searchedNode.ParentUUID)

    const { eventTransaction: eventTransaction4, error: error4 } = virtualTree.Handler(new Event(EventTypes.Create, moveFolderEventPath, moveFolderPath), new ExtraPayload(v4()))

    unitJS.value(error4).isNull()
    unitJS.value(eventTransaction4).isInstanceOf(EventTransaction)
    unitJS.assert.equal(3, virtualTree.FileTree.Subs.length)

    const { eventTransaction: eventTransaction5, error: error5  } = virtualTree.Handler(new Event(EventTypes.Move, renameEventFilePath, moveFolderEventPath))

    unitJS.value(error5).isNull()
    unitJS.value(eventTransaction5).isInstanceOf(EventTransaction)
    const searched = virtualTree.SearchByPath(movedFilePath.ExcludePath(new VirtualPath(rootFolder, true)).String())
    unitJS.assert.equal(eventTransaction4.UUID, searched.ParentUUID)
    unitJS.value(virtualTree.SearchByPath(renameEventFilePath.String())).isNull()

    const { eventTransaction: eventTransaction6, error: error6 } = virtualTree.Handler(new Event(EventTypes.Remove, eventFolderPath))

    unitJS.value(error6).isNull()
    unitJS.value(eventTransaction6).isInstanceOf(EventTransaction)
    unitJS.value(virtualTree.SearchByUUID(eventTransaction6.UUID)).isNull()

    const { eventTransaction: eventTransaction7, error: error7 } = virtualTree.Handler(new Event(EventTypes.Write, movedFilePath))

    unitJS.value(error7).isInstanceOf(Error)
    unitJS.value(eventTransaction7).isNull()

    const { eventTransaction: eventTransaction8, error: error8 } = virtualTree.Handler(new Event(EventTypes.Create, moveFolderEventPath, moveFolderPath), new ExtraPayload(v4()))

    unitJS.value(error8).is(new Error(ErrFileNodeExists))
    unitJS.value(eventTransaction8).isNull()

    const { eventTransaction: eventTransaction9, error: error9 } = virtualTree.Handler(new Event(EventTypes.Remove, eventFolderPath))

    unitJS.value(error9).is(new Error(ErrFileNodeNotFound))
    unitJS.value(eventTransaction9).isNull()

    const { eventTransaction: eventTransaction10, error: error10 } = virtualTree.Handler(new Event(EventTypes.Rename, eventFilePath, renameEventFilePath))

    unitJS.value(error10).is(new Error(ErrFileNodeNotFound))
    unitJS.value(eventTransaction10).isNull()

    const { eventTransaction: eventTransaction11, error: error11  } = virtualTree.Handler(new Event(EventTypes.Move, renameEventFilePath, moveFolderEventPath))

    unitJS.value(error11).is(new Error(ErrFileNodeNotFound))
    unitJS.value(eventTransaction11).isNull()

    const { fileNode: fileNode12, error: error12  } = virtualTree.Write(movedFilePath)
    unitJS.value(error12).isNull()
    unitJS.value(fileNode12).isNull()

    virtualTree.PrintTree('FS Shadow')
  })

  it('.Restore()', () => {
    const dummyTree = makeDummyTree(),
      virtualTree = new VirtualTree(new FileNode(), new VirtualPath('/tmp')).Restore(dummyTree)

    unitJS.assert.equal(dummyTree, virtualTree.FileTree)
  })
})

describe('NewVirtualWatcher Tests', () => {
  it('initialize ', () => {
    const virtualWatcher = NewVirtualPathWatcher('/FSShadow')

    unitJS.value(virtualWatcher.error).isNull()
    unitJS.value(virtualWatcher.watcher).isInstanceOf(VirtualTree)
  })
})