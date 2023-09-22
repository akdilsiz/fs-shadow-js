const unitJS = require('unit.js')
const { v4 } = require('uuid')
const VirtualPath = require('./virtualPath')
const { ExtraPayload, MetaData } = require('./types')
const { Watcher } = require('./watcher')
const { Event, EventTypes } = require('./event')
const EventTransaction = require('./eventTransaction')
const FileNode = require('./fileNode')
const { VirtualTree, NewVirtualPathWatcher } = require('./watcherVirtual')

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

  it('.Handler() with Create', () => {
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
      root = new FileNode([], rootPath.Name(), rootUUID, '', new MetaData(true)),
      virtualTree = new VirtualTree(root, path, path.ParentPath())

    const { eventTransaction, error } = virtualTree.Handler(new Event(EventTypes.Create, eventFolderPath, folderPath))

    unitJS.value(error).isNull()
    unitJS.value(eventTransaction).isInstanceOf(EventTransaction)
    unitJS.assert.equal(1, virtualTree.FileTree.Subs.length)

    const { eventTransaction: eventTransaction2, error: error2 } = virtualTree.Handler(new Event(EventTypes.Create, eventFilePath, filePath))

    unitJS.value(error2).isNull()
    unitJS.value(eventTransaction2).isInstanceOf(EventTransaction)
    unitJS.assert.equal(2, virtualTree.FileTree.Subs.length)

    const { eventTransaction: eventTransaction3, error: error3 } = virtualTree.Handler(new Event(EventTypes.Rename, eventFilePath, renameEventFilePath))

    unitJS.value(error3).isNull()
    unitJS.value(eventTransaction3).isInstanceOf(EventTransaction)
    const searchedNode = virtualTree.SearchByPath(renameEventFilePath.String())
    unitJS.assert.equal('test-2.txt', searchedNode.Name)
    unitJS.assert.equal(rootUUID, searchedNode.ParentUUID)

    const { eventTransaction: eventTransaction4, error: error4 } = virtualTree.Handler(new Event(EventTypes.Remove, eventFolderPath))

    unitJS.value(error4).isNull()
    unitJS.value(eventTransaction4).isInstanceOf(EventTransaction)
    unitJS.value(virtualTree.SearchByPath(eventFolderPath.String())).isNull()

    virtualTree.PrintTree('FS Shadow')
  })
})

describe('NewVirtualWatcher Tests', () => {
  it('initialize ', () => {
    const virtualWatcher = NewVirtualPathWatcher('/FSShadow')

    unitJS.value(virtualWatcher.error).isNull()
    unitJS.value(virtualWatcher.watcher).isInstanceOf(VirtualTree)
  })
})