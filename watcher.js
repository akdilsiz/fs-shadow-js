import { ExtraPayload } from './types.js'
import { NewVirtualPathWatcher } from './watcherVirtual.js'

export const NewVirtualWatcher = (rootUUID, fsPath = '', extra = new ExtraPayload()) => {
  return NewVirtualPathWatcher(rootUUID, fsPath, extra)
}