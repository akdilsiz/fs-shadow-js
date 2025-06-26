import { ErrArguments } from './errors.js'
import { Path } from './path.js'
export const Remove = 'remove',
  Write = 'write',
  Create = 'create',
  Rename = 'rename',
  Move = 'move'

export const ValidEvents = [Remove, Write, Create, Rename, Move]

export class Event {
  Type = Create
  FromPath = new Path()
  ToPath = new Path()

  constructor(type = Create, fromPath = new Path(), toPath = new Path()) {
    if (Object.values(ValidEvents).indexOf(type) === -1) {
      throw new Error(ErrArguments)
    }

    this.Type = type
    this.FromPath = fromPath
    this.ToPath = toPath
  }

  String() {
    let s = `event ${this.FromPath.String()}`
    if (this.Type === Rename) {
      s += ` -> ${this.ToPath.String()}`
    }
    s += ` [${this.Type}]`

    return s
  }
}
