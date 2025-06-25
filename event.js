const { ErrArguments } = require('./errors')
const { Path } = require('./path')
const EventTypes = {
  Remove: 'remove',
  Write: 'write',
  Create: 'create',
  Rename: 'rename',
  Move: 'move'
}

class Event {
  Type = EventTypes.Create
  FromPath = new Path()
  ToPath = new Path()

  constructor(type = EventTypes.Create, fromPath = new Path(), toPath = new Path()) {
    if (Object.values(EventTypes).indexOf(type) === -1) {
      throw new Error(ErrArguments)
    }

    this.Type = type
    this.FromPath = fromPath
    this.ToPath = toPath
  }

  String() {
    let s = `event ${this.FromPath.String()}`
    if (this.Type === EventTypes.Rename) {
      s += ` -> ${this.ToPath.String()}`
    }
    s += ` [${this.Type}]`

    return s
  }
}

module.exports = {
  EventTypes,
  Event
}