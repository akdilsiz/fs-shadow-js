import { encode, decode } from '@msgpack/msgpack'
import { ErrArguments } from './errors.js'
import { Create, ValidEvents } from './event.js'
import { MetaData } from './types.js'
import FileNode from './fileNode.js'

export default class EventTransaction {
  Name = ''
  Type = Create
  UUID = ''
  ParentUUID = ''
  Meta = new MetaData()
  constructor(name = '', type = Create, uUID = '',
              parentUUID = '', meta = new MetaData()) {
    if (Object.values(ValidEvents).indexOf(type) === -1) {
      throw new Error(ErrArguments)
    }

    this.Name = name
    this.Type = type
    this.UUID = uUID
    this.ParentUUID = parentUUID
    this.Meta = meta
  }

  /**
   * @return {{encoded: ?Uint8Array, error: ?Error}}
   */
  Encode() {
    try {
      if (!(this.Meta instanceof MetaData)) {
        return { encoded: null, error: new Error(ErrArguments) }
      }

      return {
        encoded: encode({
          Name: this.Name,
          Type: this.Type,
          UUID: this.UUID,
          ParentUUID: this.ParentUUID,
          Meta: {
            IsDir: this.Meta.IsDir,
            Sum: this.Meta.Sum,
            Size: this.Meta.Size,
            CreatedAt: this.Meta.CreatedAt,
            Permission: this.Meta.Permission
          }
        }),
          error: null
      }
    } catch (e) {
      return { encoded: null, error: e }
    }
  }

  /**
   * @param {Uint8Array} encoded
   * @return {{eventTransaction: ?EventTransaction, error: ?Error}}
   */
  Decode(encoded) {
    try {
      const decoded = decode(encoded)

      this.Name = decoded.Name
      this.Type = decoded.Type
      this.UUID = decoded.UUID
      this.ParentUUID = decoded.ParentUUID
      this.Meta = new MetaData(decoded.Meta.IsDir,
        decoded.Meta.Sum,
        decoded.Meta.Size,
        decoded.Meta.CreatedAt,
        decoded.Meta.Permission)

      return { eventTransaction: this, error: null }
    } catch (e) {
      return { eventTransaction: null, error: e }
    }
  }

  /**
   * @return {FileNode}
   * @constructor
   */
  ToFileNode() {
    return new FileNode([], this.Name, this.UUID, this.ParentUUID, this.Meta)
  }
}
