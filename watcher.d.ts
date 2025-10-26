import { ExtraPayload } from './types'
import { VirtualTree } from './watcherVirtual'
import { EventTransaction } from './eventTransaction'

export declare function NewVirtualWatcher(rootUUID: string, fsPath?: string, extra?: ExtraPayload): Promise<{watcher: VirtualTree, eventTransaction: EventTransaction}>
