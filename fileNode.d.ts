import { ExtraPayload, MetaData } from './types'
import { IPath } from './path'

export declare class FileNode {
  Subs: FileNode[]
  Name: string
  UUID: string
  ParentUUID: string
  Meta: MetaData
  constructor(
    subs: FileNode[],
    name: string,
    uUID: string,
    parentUUID: string,
    meta: MetaData,
  )
  FromJSON(value: string): { fileNode?: FileNode; error?: Error }
  FromObject(obj: Record<string, any>): { fileNode?: FileNode; error?: Error }
  ToJSON(): string
  ToObject(): {
    subs: Record<string, any>[]
    name: string
    uuid: string
    parent_uuid: string
    meta: {
      is_dir: boolean
      sum: string
      size: number
      created_at: number
      permission: string
      utc_created_at: number
    }
  }
  Move(fromPath: IPath, toPath: IPath): Promise<{ fileNode: FileNode }>
  Rename(fromPath: IPath, toPath: IPath): Promise<{ fileNode: FileNode }>
  Remove(fromPath: IPath): Promise<{ fileNode: FileNode }>
  RemoveByUUID(uUID: string, parentUUID?: string): Promise<{ fileNode: FileNode }>
  UpdateWithExtra(extra: ExtraPayload): FileNode
  Create(fromPath: IPath, absolutePath: IPath): Promise<{ fileNode: FileNode }>
  Search(path: string): FileNode|null
  SearchByUUID(uUID: string): FileNode|null
}
