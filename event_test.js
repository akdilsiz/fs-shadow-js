const unitJS = require('unit.js')
const { ErrArguments } = require('./errors')
const { EventTypes, Event } = require('./event')
const VirtualPath = require('./virtualPath')
describe('Event Tests', () => {
  it('EventTypes', () => {
    unitJS.assert.equal('remove', EventTypes.Remove)
    unitJS.assert.equal('write', EventTypes.Write)
    unitJS.assert.equal('create', EventTypes.Create)
    unitJS.assert.equal('rename', EventTypes.Rename)
    unitJS.assert.equal('move', EventTypes.Move)
  })

  it('EventTransaction with valid arguments', () => {
    const from = new VirtualPath('from', false),
      to = new VirtualPath('to', true),
      event = new Event(
        EventTypes.Create,
        from,
        to
      )

    unitJS.assert.equal(EventTypes.Create, event.Type)
    unitJS.assert.equal(from, event.FromPath)
    unitJS.assert.equal(to, event.ToPath)
  })

  it('Should be ErrArguments EventTransaction is invalid type', () => {
    const from = new VirtualPath('from', false),
      to = new VirtualPath('to', true)

    unitJS.error(() => {
      new Event(
        'invalid',
        from,
        to
      )
    }).is(ErrArguments)
  })

  it('EventTransaction String()', () => {
    const from = new VirtualPath('from', false),
      to = new VirtualPath('to', true),
      event = new Event(
        EventTypes.Create,
        from,
        to
      )

    unitJS.assert.equal('event from [create]', event.String())
  })

  it('EventTransaction Rename type String()', () => {
    const from = new VirtualPath('from', false),
      to = new VirtualPath('to', true),
      event = new Event(
        EventTypes.Rename,
        from,
        to
      )

    unitJS.assert.equal('event from -> to [rename]', event.String())
  })
})