import unitJS from 'unit.js'
import { v4 } from 'uuid'
import { ErrArguments } from './errors.js'
import { MetaData, ExtraPayload } from './types.js'
import FileNode from './fileNode.js'
import VirtualPath from './virtualPath.js'

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

describe('FileNode Tests', () => {
  it('with valid arguments', () => {
    const uUID = v4(),
      parentUUID = v4(),
      metaData = new MetaData(true, 'sum', 1, 1, 'permission'),
      subs = [],
      fileNode = new FileNode(subs, 'node1', uUID, parentUUID, metaData)

    unitJS.assert.equal(subs, fileNode.Subs)
    unitJS.assert.equal('node1', fileNode.Name)
    unitJS.assert.equal(uUID, fileNode.UUID)
    unitJS.assert.equal(parentUUID, fileNode.ParentUUID)
    unitJS.assert.equal(metaData, fileNode.Meta)
  })

  it('.ToJSON()', () => {
    const uUID = v4(),
      parentUUID = v4(),
      metaData = new MetaData(true, 'sum', 1, 1, 'permission'),
      subs = [],
      valueJson = JSON.stringify({
        subs: subs,
        name: 'node1',
        uuid: uUID,
        parent_uuid: parentUUID,
        meta: {
          is_dir: true,
          sum: 'sum',
          size: 1,
          created_at: 1,
          permission: 'permission',
          utc_created_at: 1,
        }
      }),
      fileNodeJson = new FileNode(subs, 'node1', uUID, parentUUID, metaData).ToJSON()

    unitJS.assert.equal(valueJson, fileNodeJson)
  })

  it('.FromJSON()', () => {
    const uUID = v4(),
      parentUUID = v4(),
      subs = [],
      valueJson = JSON.stringify({
        subs: subs,
        name: 'node1',
        uuid: uUID,
        parent_uuid: parentUUID,
        meta: {
          is_dir: true,
          sum: 'sum',
          size: 1,
          created_at: 2,
          permission: 'permission',
          utc_created_at: 2,
        }
      }),
      { fileNode, error} = new FileNode().FromJSON(valueJson)

    unitJS.value(error).isNull()
    unitJS.value(fileNode.Subs).is([])
    unitJS.assert.equal('node1', fileNode.Name)
    unitJS.assert.equal(uUID, fileNode.UUID)
    unitJS.assert.equal(parentUUID, fileNode.ParentUUID)
    unitJS.assert.equal(true, fileNode.Meta.IsDir)
    unitJS.assert.equal('sum', fileNode.Meta.Sum)
    unitJS.assert.equal(1, fileNode.Meta.Size)
    unitJS.assert.equal(2, fileNode.Meta.CreatedAt)
    unitJS.assert.equal('permission', fileNode.Meta.Permission)
  })

  it('.FromJSON() with subs', () => {
    const uUID = v4(),
      parentUUID = v4(),
      subUUID = v4(),
      subs = [new FileNode([], 'subNode', subUUID, uUID).ToObject()],
      valueJson = JSON.stringify({
        subs: subs,
        name: 'node1',
        uuid: uUID,
        parent_uuid: parentUUID,
        meta: {
          is_dir: true,
          sum: 'sum',
          size: 1,
          created_at: 2,
          permission: 'permission',
          utc_created_at: 2,
        }
      }),
      { fileNode, error} = new FileNode().FromJSON(valueJson)

    unitJS.value(error).isNull()
    unitJS.value(fileNode.Subs).hasLength(1)
    unitJS.assert.equal('subNode', fileNode.Subs[0].Name)
    unitJS.assert.equal(subUUID, fileNode.Subs[0].UUID)
    unitJS.assert.equal(uUID, fileNode.Subs[0].ParentUUID)
    unitJS.assert.equal(false, fileNode.Subs[0].Meta.IsDir)
    unitJS.assert.equal('', fileNode.Subs[0].Meta.Sum)
    unitJS.assert.equal(0, fileNode.Subs[0].Meta.Size)
    unitJS.assert.equal(0, fileNode.Subs[0].Meta.CreatedAt)
    unitJS.assert.equal('', fileNode.Subs[0].Meta.Permission)

    unitJS.assert.equal('node1', fileNode.Name)
    unitJS.assert.equal(uUID, fileNode.UUID)
    unitJS.assert.equal(parentUUID, fileNode.ParentUUID)
    unitJS.assert.equal(true, fileNode.Meta.IsDir)
    unitJS.assert.equal('sum', fileNode.Meta.Sum)
    unitJS.assert.equal(1, fileNode.Meta.Size)
    unitJS.assert.equal(2, fileNode.Meta.CreatedAt)
    unitJS.assert.equal('permission', fileNode.Meta.Permission)
  })

  it('.ToObject()', () => {
    const uUID = v4(),
      parentUUID = v4(),
      metaData = new MetaData(true, 'sum', 2, 3, 'permission'),
      subs = [],
      fileNode = new FileNode(subs, 'node1', uUID, parentUUID, metaData).ToObject()

    unitJS.value(fileNode.subs).is([])
    unitJS.assert.equal('node1', fileNode.name)
    unitJS.assert.equal(uUID, fileNode.uuid)
    unitJS.assert.equal(parentUUID, fileNode.parent_uuid)
    unitJS.value(fileNode.meta).is(metaData.ToObject())
  })

  it('.FromObject()', () => {
    const uUID = v4(),
      parentUUID = v4(),
      subUUID = v4(),
      subs = [new FileNode([], 'subNode', subUUID, uUID).ToObject()],
      value = {
        subs: subs,
        name: 'node1',
        uuid: uUID,
        parent_uuid: parentUUID,
        meta: {
          is_dir: true,
          sum: 'sum',
          size: 1,
          created_at: 2,
          permission: 'permission'
        }
      },
      { fileNode, error} = new FileNode().FromObject(value)

    unitJS.value(error).isNull()
    unitJS.value(fileNode.Subs).hasLength(1)
    unitJS.assert.equal('subNode', fileNode.Subs[0].Name)
    unitJS.assert.equal(subUUID, fileNode.Subs[0].UUID)
    unitJS.assert.equal(uUID, fileNode.Subs[0].ParentUUID)
    unitJS.assert.equal(false, fileNode.Subs[0].Meta.IsDir)
    unitJS.assert.equal('', fileNode.Subs[0].Meta.Sum)
    unitJS.assert.equal(0, fileNode.Subs[0].Meta.Size)
    unitJS.assert.equal(0, fileNode.Subs[0].Meta.CreatedAt)
    unitJS.assert.equal('', fileNode.Subs[0].Meta.Permission)

    unitJS.assert.equal('node1', fileNode.Name)
    unitJS.assert.equal(uUID, fileNode.UUID)
    unitJS.assert.equal(parentUUID, fileNode.ParentUUID)
    unitJS.assert.equal(true, fileNode.Meta.IsDir)
    unitJS.assert.equal('sum', fileNode.Meta.Sum)
    unitJS.assert.equal(1, fileNode.Meta.Size)
    unitJS.assert.equal(2, fileNode.Meta.CreatedAt)
    unitJS.assert.equal('permission', fileNode.Meta.Permission)
  })

  it('Should be error FileNode .FromObject() is invalid object value', () => {
    const { fileNode, error} = new FileNode().FromObject('string')

    unitJS.value(error).is(new Error(ErrArguments))
    unitJS.value(fileNode).isNull()
  })

  it('Should be error FileNode .FromObject() is invalid object', () => {
    const
      { fileNode, error} = new FileNode().FromObject({})

    unitJS.value(error).isInstanceOf(Error)
    unitJS.value(fileNode).isNull()
  })

  it('Should be error FileNode .FromObject() is invalid met adata', () => {
    const uUID = v4(),
      parentUUID = v4(),
      subUUID = v4(),
      subs = [new FileNode([], 'subNode', subUUID, uUID).ToObject()],
      value = {
        subs: subs,
        name: 'node1',
        uuid: uUID,
        parent_uuid: parentUUID,
        meta: ''
      },
      { fileNode, error} = new FileNode().FromObject(value)

    unitJS.value(error).is(new Error(ErrArguments))
    unitJS.value(fileNode).isNull()
  })

  it('FileNode', () => {
    const parentPath = '/tmp',
      testFolder = `${parentPath}/fs-shadow`,
      rootPath = new VirtualPath(testFolder, true),
      folder = `${testFolder}/test`,
      folderPath = new VirtualPath(folder, true),
      eventFolderPath = folderPath.ExcludePath(new VirtualPath(parentPath, true)),
      emptyFile = `${testFolder}/test.txt`,
      filePath = new VirtualPath(emptyFile, false),
      eventFilePath = filePath.ExcludePath(new VirtualPath(parentPath, true)),
      renameFilePath = new VirtualPath(`${testFolder}/test-2.txt`, false),
      renameEventFilePath = renameFilePath.ExcludePath(new VirtualPath(parentPath, true)),
      root = new FileNode([], rootPath.Name(), '', '', new MetaData(true))

    const { fileNode: createdFolderNode, error } = root.Create(eventFolderPath, folderPath)

    unitJS.value(error).isNull()
    unitJS.assert.equal(1, root.Subs.length)
    const folderNode = root.Subs[0]
    unitJS.assert.equal(folderNode, createdFolderNode)
    unitJS.assert.equal(true, folderNode.Meta.IsDir)

    // Create
    const { fileNode: createdFileNode, error: error2 } = root.Create(eventFilePath, filePath)
    unitJS.value(error2).isNull()
    unitJS.assert.equal(2, root.Subs.length)
    const fileNode = root.Subs[1]
    unitJS.assert.equal(false, fileNode.Meta.IsDir)
    unitJS.assert.equal(fileNode, createdFileNode)

    // Search
    const searchedFileNode = root.Search(eventFilePath.String())
    unitJS.assert.equal('test.txt', searchedFileNode.Name)

    // Rename
    const oldName = fileNode.Name
    const { fileNode: renamedFileNode, error: error3 } = root.Rename(eventFilePath, renameEventFilePath)
    unitJS.value(error3).isNull()
    unitJS.assert.notEqual(oldName, fileNode.Name)
    unitJS.assert.equal(renamedFileNode.Name, 'test-2.txt')

    // Remove
    const { fileNode: removedFileNode, error: error4 } = root.Remove(eventFolderPath)
    unitJS.value(error4).isNull()
    unitJS.assert.equal('test', removedFileNode.Name)
    unitJS.value(root.Search(eventFolderPath.String())).isNull()
  })

  it('.UpdateWithExtra()', () => {
    const uUID = v4(),
      fileNode = new FileNode([], 'test', uUID),
      newUUID = v4()

    fileNode.UpdateWithExtra(new ExtraPayload(newUUID, true, '', 1024))

    unitJS.assert.equal(newUUID, fileNode.UUID)
  })

  it('.DeleteByUUID() ', () => {
    const tree = makeDummyTree(),
      treeSubLength = tree.Subs.length,
      nodeUUID = tree.Subs[0].UUID,
      { error } = tree.RemoveByUUID(nodeUUID, tree.UUID)

    unitJS.value(error).isNull()
    unitJS.assert.equal(treeSubLength-1, tree.Subs.length)
  })

  it('.SearchByUUID() ', () => {
    const tree = makeDummyTree(),
      nodeUUID = tree.Subs[2].UUID,
      node = tree.SearchByUUID(nodeUUID)

    unitJS.assert.equal(tree.Subs[2], node)
  })

  it('.Move()', () => {
    const tree = makeDummyTree(),
      fromPath = new VirtualPath('alphabet/d', true),
      toPath = new VirtualPath('alphabet/a', true),
      { error } = tree.Move(fromPath, toPath),
      node = tree.Search('alphabet/a')

    unitJS.value(error).isNull()
    unitJS.assert.equal(1, node.Subs.length)
  })

  it('.Remove()', () => {
    const tree = makeDummyTree(),
      treeSubLength = tree.Subs.length,
      nodeUUID = tree.Subs[1].UUID,
      { fileNode, error } = tree.RemoveByUUID(nodeUUID, tree.UUID)

    unitJS.value(error).isNull()
    unitJS.assert.equal(nodeUUID, fileNode.UUID)
    unitJS.assert.equal(treeSubLength-1, tree.Subs.length)

    const nodeName = tree.Subs[1].Name,
      { fileNode: fileNode2, error: error2 } = tree.Remove(new VirtualPath(`alphabet/${nodeName}`, true))

    unitJS.value(error2).isNull()
    unitJS.assert.equal(nodeName, fileNode2.Name)
    unitJS.assert.equal(treeSubLength-2, tree.Subs.length)
  })
})