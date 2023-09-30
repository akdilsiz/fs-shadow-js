const { encode, decode } = require('@msgpack/msgpack')
const { ErrArguments } = require('./errors')
const { EventTypes } = require('./event')
const { MetaData } = require('./types')
const FileNode = require('./fileNode')

class EventTransaction {
  Name = ''
  Type = EventTypes.Create
  UUID = ''
  ParentUUID = ''
  Meta = new MetaData()
  constructor(name = '', type = EventTypes.Create, uUID = '',
              parentUUID = '', meta = new MetaData()) {
    if (Object.values(EventTypes).indexOf(type) === -1) {
      throw ErrArguments
    }

    this.Name = name
    this.Type = type
    this.UUID = uUID
    this.ParentUUID = parentUUID
    this.Meta = meta
  }
  Encode() {
    try {
      if (!(this.Meta instanceof MetaData)) {
        return { encoded: null, error: ErrArguments }
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

  ToFileNode() {
    return new FileNode([], this.Name, this.UUID, this.ParentUUID, this.Meta)
  }
}

module.exports = EventTransaction