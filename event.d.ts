import { IPath } from './path'

export declare type EventType = string

export declare const Remove: EventType,
  Write: EventType,
  Create: EventType,
  Rename: EventType,
  Move: EventType;

export declare const ValidEvents: EventType[];

export declare class Event {
  Type: EventType
  FromPath: IPath
  ToPath?: IPath
  constructor(type: EventType, fromPath: IPath, toPath?: IPath)
  String(): string
}
