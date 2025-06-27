import unitJS from 'unit.js'
import { v4 } from 'uuid'
import { ErrFileNodeExists, ErrFileNodeNotFound} from './errors.js'
import VirtualPath from './virtualPath.js'
import { ExtraPayload, MetaData } from './types.js'
import { Remove, Write, Create, Rename, Move, Event } from './event.js'
import EventTransaction from './eventTransaction.js'
import FileNode from'./fileNode.js'
import { VirtualTree, NewVirtualPathWatcher } from './watcherVirtual.js'

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

  it('.Handler() with events', async () => {
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

    const { eventTransaction } = await virtualTree.Handler(new Event(Create, eventFolderPath, folderPath), new ExtraPayload(v4()))

    unitJS.value(eventTransaction).isInstanceOf(EventTransaction)
    unitJS.assert.equal(1, virtualTree.FileTree.Subs.length)

    const { eventTransaction: eventTransaction2 } = await virtualTree.Handler(new Event(Create, eventFilePath, filePath), new ExtraPayload(v4()))

    unitJS.value(eventTransaction2).isInstanceOf(EventTransaction)
    unitJS.assert.equal(2, virtualTree.FileTree.Subs.length)

    const { eventTransaction: eventTransaction3 } = await virtualTree.Handler(new Event(Rename, eventFilePath, renameEventFilePath))

    unitJS.value(eventTransaction3).isInstanceOf(EventTransaction)
    const searchedNode = virtualTree.SearchByPath(renameEventFilePath.String())
    unitJS.assert.equal('test-2.txt', searchedNode.Name)
    unitJS.assert.equal(rootUUID, searchedNode.ParentUUID)

    const { eventTransaction: eventTransaction4 } = await virtualTree.Handler(new Event(Create, moveFolderEventPath, moveFolderPath), new ExtraPayload(v4()))

    unitJS.value(eventTransaction4).isInstanceOf(EventTransaction)
    unitJS.assert.equal(3, virtualTree.FileTree.Subs.length)

    const { eventTransaction: eventTransaction5  } = await virtualTree.Handler(new Event(Move, renameEventFilePath, moveFolderEventPath))

    unitJS.value(eventTransaction5).isInstanceOf(EventTransaction)
    const searched = virtualTree.SearchByPath(movedFilePath.ExcludePath(new VirtualPath(rootFolder, true)).String())
    unitJS.assert.equal(eventTransaction4.UUID, searched.ParentUUID)
    unitJS.value(virtualTree.SearchByPath(renameEventFilePath.String())).isNull()

    const { eventTransaction: eventTransaction6 } = await virtualTree.Handler(new Event(Remove, eventFolderPath))

    unitJS.value(eventTransaction6).isInstanceOf(EventTransaction)
    unitJS.value(virtualTree.SearchByUUID(eventTransaction6.UUID)).isNull()

    await virtualTree.Handler(new Event(Write, movedFilePath))
      .catch((err) => {
        unitJS.value(err).isInstanceOf(Error)
      })

    await virtualTree.Handler(new Event(Create, moveFolderEventPath, moveFolderPath), new ExtraPayload(v4()))
      .catch((err) => {
        unitJS.value(err).is(new Error(ErrFileNodeExists))
      })

     await virtualTree.Handler(new Event(Remove, eventFolderPath))
      .catch((err) => {
        unitJS.value(err).is(new Error(ErrFileNodeNotFound))
      })

    await virtualTree.Handler(new Event(Rename, eventFilePath, renameEventFilePath))
      .catch((err) => {
        unitJS.value(err).is(new Error(ErrFileNodeNotFound))
      })

    await virtualTree.Handler(new Event(Move, renameEventFilePath, moveFolderEventPath))
      .catch((err) => {
        unitJS.value(err).is(new Error(ErrFileNodeNotFound))
      })

    await virtualTree.Write(movedFilePath)
      .catch((err) => {
        unitJS.assert.equal(err.message, 'unhandled event')
      })

    virtualTree.PrintTree('FS Shadow')
  })

  it('.Restore()', () => {
    const dummyTree = makeDummyTree(),
      virtualTree = new VirtualTree(new FileNode(), new VirtualPath('/tmp')).Restore(dummyTree)

    unitJS.assert.equal(dummyTree, virtualTree.FileTree)
  })
})

describe('NewVirtualWatcher Tests', () => {
  it('initialize ', async () => {
    const virtualWatcher = await NewVirtualPathWatcher('/FSShadow')
    unitJS.value(virtualWatcher.watcher).isInstanceOf(VirtualTree)
  })
})