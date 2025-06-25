const unitJS = require('unit.js')
const { v4 } = require('uuid')
const { encode } = require('@msgpack/msgpack')
const { ErrArguments } = require('./errors')
const { MetaData } = require('./types')
const EventTransaction = require('./eventTransaction')
const { EventTypes } = require('./event')
const FileNode = require('./fileNode')
describe('EventTransaction Tests', () => {
  it('EventTransaction with valid arguments', () => {
    const uUID = v4(),
      parentUUID= v4(),
      metaData = new MetaData(false, 'sum', 1, 1, 'permission'),
      eventTransaction = new EventTransaction('transaction1',
        EventTypes.Create,
        uUID,
        parentUUID,
        metaData)

    unitJS.assert.equal('transaction1', eventTransaction.Name)
    unitJS.assert.equal(EventTypes.Create, eventTransaction.Type)
    unitJS.assert.equal(uUID, eventTransaction.UUID)
    unitJS.assert.equal(parentUUID, eventTransaction.ParentUUID)
    unitJS.assert.equal(metaData, eventTransaction.Meta)
  })

  it('Should be ErrArguments EventTransaction is invalid arguments', () => {
    const uUID = v4(),
      parentUUID= v4(),
      metaData = new MetaData(false, 'sum', 1, 1, 'permission')

    unitJS.error(() => {
      new EventTransaction('transaction1',
        'invalid',
        uUID,
        parentUUID,
        metaData)
    }).is(new Error(ErrArguments))
  })

  it('EventTransaction .Encode()', () => {
    const uUID = v4(),
      parentUUID= v4(),
      metaData = new MetaData(false, 'sum', 1, 1, 'permission'),
      eventTransaction = new EventTransaction('transaction1',
        EventTypes.Create,
        uUID,
        parentUUID,
        metaData),
      { encoded, error } = eventTransaction.Encode(),
      value = encode({
        Name: 'transaction1',
        Type: 'create',
        UUID: uUID,
        ParentUUID: parentUUID,
        Meta: {
          IsDir: metaData.IsDir,
          Sum: metaData.Sum,
          Size: metaData.Size,
          CreatedAt: metaData.CreatedAt,
          Permission: metaData.Permission
        }
      })

    unitJS.value(error).isNull()
    unitJS.value(encoded).isInstanceOf(Uint8Array)
    unitJS.number(encoded.length).isGreaterThan(0)
    unitJS.value(encoded).is(value)
  })

  it('Should be encode error EventTransaction .Encode() is invalid params', () => {
    const uUID = v4(),
      parentUUID= v4(),
      eventTransaction = new EventTransaction('transaction1',
        EventTypes.Create,
        uUID,
        parentUUID,
        {
          ToObject: () => {
            return {
              val: () => {
                try {

                } catch (e) {
                  console.log(e)
                }
              }
            }
          }
        }),
      { encoded, error } = eventTransaction.Encode()

    unitJS.value(encoded).isNull()
    unitJS.value(error).is(new Error(ErrArguments))
  })

  it('EventTransaction .Decode()', () => {
    const uUID = v4(),
      parentUUID= v4(),
      metaData = new MetaData(false, 'sum', 1, 1, 'permission'),
      eventTransaction = new EventTransaction('transaction1',
        EventTypes.Create,
        uUID,
        parentUUID,
        metaData),
      { encoded, error } = eventTransaction.Encode(),
      { eventTransaction: decodedEventTransaction, error: error2 } = new EventTransaction().Decode(encoded)

    unitJS.value(error).isNull()
    unitJS.value(error2).isNull()

    unitJS.value(decodedEventTransaction).isInstanceOf(EventTransaction)
    unitJS.assert.equal(decodedEventTransaction.Name, eventTransaction.Name)
    unitJS.assert.equal(decodedEventTransaction.Type, eventTransaction.Type)
    unitJS.assert.equal(decodedEventTransaction.UUID, eventTransaction.UUID)
    unitJS.assert.equal(decodedEventTransaction.ParentUUID, eventTransaction.ParentUUID)
    unitJS.assert.equal(decodedEventTransaction.Meta.IsDir, eventTransaction.Meta.IsDir)
    unitJS.assert.equal(decodedEventTransaction.Meta.Size, eventTransaction.Meta.Size)
    unitJS.assert.equal(decodedEventTransaction.Meta.Sum, eventTransaction.Meta.Sum)
    unitJS.assert.equal(decodedEventTransaction.Meta.CreatedAt, eventTransaction.Meta.CreatedAt)
    unitJS.assert.equal(decodedEventTransaction.Meta.Permission, eventTransaction.Meta.Permission)
  })

  it('Should be encode error EventTransaction .Decode() is invalid params', () => {
    const { eventTransaction, error } = new EventTransaction().Decode('selamss')

    unitJS.value(error).isInstanceOf(Error)
    unitJS.value(eventTransaction).isNull()
  })

  it('Should be error EventTransaction .Decode() is invalid meta data', () => {
    const uUID = v4(),
      parentUUID= v4(),
      eventTransaction = new EventTransaction('transaction1',
        EventTypes.Create,
        uUID,
        parentUUID,
        {
          ToObject: () => {
            return 'object'
          }
        }),
      { encoded, error } = eventTransaction.Encode(),
      { eventTransaction: decodedEventTransaction, error: error2 } = new EventTransaction().Decode(encoded)

    unitJS.value(error).is(new Error(ErrArguments))
    unitJS.value(decodedEventTransaction).isNull()
    unitJS.value(error2).isInstanceOf(Error)
  })

  it('Should be error EventTransaction .Decode() is invalid meta data size', () => {
    const uUID = v4(),
      parentUUID= v4(),
      encoded= encode({
        Name: 'transaction1',
        Type: EventTypes.Create,
        UUID: uUID,
        ParentUUID: parentUUID,
        Meta: {
            Size: -1,
            CreatedAt: -1,
            IsDir: false,
            Sum: '',
            Permission: ''
          }
        }),
      { eventTransaction: decodedEventTransaction, error: error2 } = new EventTransaction().Decode(encoded)

    unitJS.value(decodedEventTransaction).isNull()
    unitJS.value(error2).is(new Error(ErrArguments))
  })

  it('EventTransaction .ToFileNode()', () => {
    const uUID = v4(),
      parentUUID= v4(),
      metaData = new MetaData(false, 'sum', 1, 1, 'permission'),
      fileNode = new FileNode([], 'transaction1', uUID, parentUUID, metaData),
      eventTransactionFileNode = new EventTransaction('transaction1',
        EventTypes.Create,
        uUID,
        parentUUID,
        metaData).ToFileNode()

    unitJS.assert.equal(fileNode.ToJSON(), eventTransactionFileNode.ToJSON())
  })
})