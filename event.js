import { Path } from './path.js' // eslint-disable-line
import VirtualPath from './virtualPath.js' // eslint-disable-line

export const Remove = 'remove',
  Write = 'write',
  Create = 'create',
  Rename = 'rename',
  Move = 'move'

export const ValidEvents = [Remove, Write, Create, Rename, Move]

export class Event {
  Type = Create
  /**
   * @type {?(Path|VirtualPath)}
   */
  FromPath
  /**
   * @type {?(Path|VirtualPath)}
   */
  ToPath = null

  /**
   * @param {string} type
   * @param {?(Path|VirtualPath)} fromPath
   * @param {?(Path|VirtualPath)} toPath
   */
  constructor(type, fromPath, toPath = null) {
    if (Object.values(ValidEvents).indexOf(type) === -1) {
      throw new Error('Invalid event type')
    }

    this.Type = type
    this.FromPath = fromPath
    this.ToPath = toPath
  }

  /**
   * @return {string}
   */
  String() {
    let s = `event ${this.FromPath.String()}`
    if (this.Type === Rename) {
      s += ` -> ${this.ToPath.String()}`
    }
    s += ` [${this.Type}]`

    return s
  }
}
