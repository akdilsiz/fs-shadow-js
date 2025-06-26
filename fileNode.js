import { MetaData, ExtraPayload } from './types.js'
import { Path, Separator } from './path.js'
import {
  ErrToFileNodeNotFound,
  ErrFileNodeExists,
  ErrFileNodeNotFound,
  ErrSubsNodeNotFound,
  ErrFileExists, ErrArguments
} from './errors.js'

export default class FileNode {
  Subs = []
  Name = ''
  UUID = ''
  ParentUUID = ''
  Meta = new MetaData()

  constructor(subs = [],
              name = '',
              uUID = '',
              parentUUID = '',
              meta = new MetaData()) {
    this.Subs = subs
    this.Name = name
    this.UUID = uUID
    this.ParentUUID = parentUUID
    this.Meta = meta
  }

  ToJSON() {
    return JSON.stringify({
      subs: this.Subs,
      name: this.Name,
      uuid: this.UUID,
      parent_uuid: this.ParentUUID,
      meta: this.Meta.ToObject()
    })
  }

  FromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)

      this.Subs = []
      for (let i = 0; i < parsed.subs.length; i++) {
        const { fileNode, error } = new FileNode().FromObject(parsed.subs[i])
        if (error) {
          return { fileNode: null, error: error }
        }
        this.Subs.push(fileNode)
      }

      this.Name = parsed.name
      this.UUID = parsed.uuid
      this.ParentUUID = parsed.parent_uuid
      const { metaData, error } = new MetaData().FromObject(parsed.meta)
      if (error) {
        return { fileNode: null, error: error }
      }
      this.Meta = metaData

      return { fileNode: this, error: null }
    } catch (e) {
      return { fileNode: null, error: e}
    }
  }

  ToObject() {
    return {
      subs: this.Subs,
      name: this.Name,
      uuid: this.UUID,
      parent_uuid: this.ParentUUID,
      meta: this.Meta.ToObject()
    }
  }

  FromObject(obj) {
    try {
      if (!(obj instanceof Object)) {
        return { fileNode: null, error: new Error(ErrArguments) }
      }

      this.Subs = []
      for (let i = 0; i < obj.subs.length; i++) {
        const { fileNode, error } = new FileNode().FromObject(obj.subs[i])
        if (error) {
          return { fileNode: null, error: null }
        }
        this.Subs.push(fileNode)
      }
      this.Name = obj.name
      this.UUID = obj.uuid
      this.ParentUUID = obj.parent_uuid
      const { metaData, error } = new MetaData().FromObject(obj.meta)
      if (error) {
        return { fileNode: null, error: error }
      }
      this.Meta = metaData

      return { fileNode: this, error: null }
    } catch (e) {
      return { fileNode: null, error: e }
    }
  }

  Move(fromPath = new Path(), toPath = new Path()) {
    let toNode = this.Search(toPath.String())
    if (toNode === null) {
      return { fileNode: null, error: new Error(ErrToFileNodeNotFound) }
    }

    for (let i = 0; i < toNode.Subs.length; i++) {
      if (fromPath.String() === toNode.Subs[i].Name) {
        return { fileNode: null, error: new Error(ErrFileNodeExists) }
      }
    }

    const { fileNode, error } = this.Remove(fromPath)
    if (error) {
      return { fileNode: null, error: error }
    }

    fileNode.ParentUUID = toNode.UUID
    toNode.Subs.push(fileNode)
    return { fileNode: fileNode, error: null }
  }
  Rename(fromPath = new Path(), toPath = new Path()) {
    const parentNode = this.Search(fromPath.ParentPath().String())
    if (parentNode === null) {
      return { fileNode: null, error: new Error(ErrFileNodeNotFound) }
    }

    for (let i = 0; i < parentNode.Subs; i++) {
      if (toPath.Name() === parentNode.Subs[i]) {
        return ErrFileNodeExists
      }
    }

    const node = this.Search(fromPath.String())
    if (node === null) {
      return { fileNode: null, error: new Error(ErrFileNodeNotFound) }
    }

    node.Name = toPath.Name()
    return { fileNode: node, error: null }
  }
  Remove(fromPath = new Path()) {
    const fileName = fromPath.Name(),
      parentNode = this.Search(fromPath.ParentPath().String())

    return this._remove(parentNode, fileName)
  }
  RemoveByUUID(uUID = '', parentUUID = '') {
    const parentNode = this.SearchByUUID(parentUUID)
    return this._remove(parentNode, uUID, 'uuid')
  }
  _remove(parentNode = new FileNode(), value = '', searchField = '') {
    if (parentNode === null || parentNode.Name.length === 0) {
      return { fileNode: null, error: new Error(ErrFileNodeNotFound)}
    }
    if (parentNode.Subs.length === 0) {
      return { fileNode: null, error: new Error(ErrSubsNodeNotFound) }
    }
    let lookupValue = '',
      deletedNode = null
    for (let i = 0; i < parentNode.Subs.length; i++) {
      if (searchField.length > 0 && searchField === 'uuid') {
        lookupValue = parentNode.Subs[i].UUID
      } else {
        lookupValue = parentNode.Subs[i].Name
      }

      if (lookupValue === value) {
        deletedNode = parentNode.Subs[i]
        parentNode.Subs = [...parentNode.Subs.slice(0, i), ...parentNode.Subs.slice(i+1, parentNode.Subs.length)]
        break
      }
    }

    if (deletedNode === null) {
      return { fileNode: null, error: new Error(ErrFileNodeNotFound)}
    }

    return { fileNode: deletedNode, error: null }
  }
  UpdateWithExtra(extra = new ExtraPayload()) {
    this.UUID = extra.UUID
    this.Meta.IsDir = extra.IsDir
    this.Meta.Size = extra.Size
    this.Meta.Sum = extra.Sum
    this.Meta.CreatedAt = extra.CreatedAt
    this.Meta.Permission = extra.Permission
  }
  Create(fromPath = new Path(), absolutePath = new Path()) {
    let sum = ''

    const parentNode = this.Search(fromPath.ParentPath().String())
    if (parentNode === null) {
      return { fileNode: this, error: null }
    }

    for (let i = 0; i < parentNode.Subs.length; i++) {
      if (parentNode.Subs[i].Name === fromPath.Name()) {
        return { fileNode: null, error: fromPath.IsDir() ? new Error(ErrFileExists) : new Error(ErrFileNodeExists) }
      }
    }

    const absolutePathInfo = absolutePath.Info(),
      meta = new MetaData(absolutePath.IsDir(),
        sum,
        absolutePathInfo.Size,
        absolutePathInfo.CreatedAt,
        absolutePathInfo.Permission),
      node = new FileNode([],
        fromPath.Name(),
        '',
        parentNode.UUID,
        meta)
    parentNode.Subs.push(node)
    return { fileNode: node, error: null }
  }
  Search(path = '') {
    const pathExp = path.split(Separator)
    if (pathExp.length === 1 && this.Name === pathExp[0]) {
      return this
    }
    let newPath, node, wantedNode = null
    if (pathExp.length !== 1 && this.Name === pathExp[0]) {
      newPath = pathExp.slice(1, pathExp.length).join(Separator)
      for (let i = 0; i < this.Subs.length; i++) {
        node = this.Subs[i].Search(newPath)
        if (node !== null) {
          wantedNode = node
          break
        }
      }
      if (wantedNode !== null) {
        return wantedNode
      }
    }

    return null
  }
  SearchByUUID(uUID = '') {
    if (this.UUID === uUID) {
      return this
    }
    if (!this.Subs.length) {
      return null
    }
    let node, wantedNode = null
    for (let i = 0; i < this.Subs.length; i++) {
      node = this.Subs[i].SearchByUUID(uUID)
      if (node !== null) {
        wantedNode = node
        break
      }
    }
    if (wantedNode !== null) {
      return wantedNode
    }
    return null
  }
}
