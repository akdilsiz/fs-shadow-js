import { EventType } from './event'
import { MetaData } from './types'
import { FileNode } from './fileNode'

export declare class EventTransaction {
  Name: string
  Type: EventType
  UUID: string
  ParentUUID: string
  Meta: MetaData
  constructor(
    name: string,
    type: EventType,
    uUID: string,
    parentUUID: string,
    meta: MetaData,
  )
  Encode(): {encoded?: Uint8Array, error?: Error}
  Decode(encoded: Uint8Array): {eventTransaction?: EventTransaction, error?: Error}
  ToFileNode(): FileNode
}
