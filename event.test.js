import unitJS from 'unit.js'
import { ErrArguments } from './errors.js'
import { Remove, Write, Create, Rename, Move, Event } from './event.js'
import { VirtualPath } from './virtualPath.js'

describe('Event Tests', () => {
  it('EventTypes', () => {
    unitJS.assert.equal('remove', Remove)
    unitJS.assert.equal('write', Write)
    unitJS.assert.equal('create', Create)
    unitJS.assert.equal('rename', Rename)
    unitJS.assert.equal('move', Move)
  })

  it('EventTransaction with valid arguments', () => {
    const from = new VirtualPath('from', false),
      to = new VirtualPath('to', true),
      event = new Event(Create, from, to)

    unitJS.assert.equal(Create, event.Type)
    unitJS.assert.equal(from, event.FromPath)
    unitJS.assert.equal(to, event.ToPath)
  })

  it('Should be ErrArguments EventTransaction is invalid type', () => {
    const from = new VirtualPath('from', false),
      to = new VirtualPath('to', true)

    unitJS
      .error(() => {
        new Event('invalid', from, to)
      })
      .is(new Error(ErrArguments))
  })

  it('EventTransaction String()', () => {
    const from = new VirtualPath('from', false),
      to = new VirtualPath('to', true),
      event = new Event(Create, from, to)

    unitJS.assert.equal('event from [create]', event.String())
  })

  it('EventTransaction Rename type String()', () => {
    const from = new VirtualPath('from', false),
      to = new VirtualPath('to', true),
      event = new Event(Rename, from, to)

    unitJS.assert.equal('event from -> to [rename]', event.String())
  })
})
