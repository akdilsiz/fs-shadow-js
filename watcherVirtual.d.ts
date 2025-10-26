import { FileNode } from './fileNode'
import { VirtualPath } from './virtualPath'
import { Event, EventType } from './event'
import { ExtraPayload } from './types'
import { EventTransaction } from './eventTransaction'

export declare class VirtualTree {
  FileTree: FileNode
  Path: VirtualPath
  ParentPath?: VirtualPath
  constructor(fileTree: FileNode, path: VirtualPath, parentPath: VirtualPath)
  Handler(event: Event, extra?: ExtraPayload): Promise<{eventTransaction: EventTransaction}>
  Restore(tree: VirtualTree): VirtualTree
  SearchByPath(p: string): FileNode
  SearchByUUID(uUID: string): FileNode
  PrintTree(label?: string): void
  Create(fromPath: VirtualPath, extra?: ExtraPayload): Promise<{fileNode: FileNode}>
  Remove(fromPath: VirtualPath): Promise<{fileNode: FileNode}>
  Rename(fromPath: VirtualPath, toPath: VirtualPath): Promise<{fileNode: FileNode}>
  Move(fromPath: VirtualPath, toPath: VirtualPath): Promise<{fileNode: FileNode}>
  Write(_fromPath: VirtualPath): Promise<{fileNode: FileNode}>
  MakeEventTransaction(node: FileNode, event: EventType): EventTransaction
}

export declare function NewVirtualPathWatcher(uUID?: string, virtualPath?: VirtualPath, extra?: ExtraPayload): Promise<{watcher: VirtualTree, eventTransaction: EventTransaction}>
