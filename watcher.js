import { ExtraPayload } from './types.js' // eslint-disable-line
import { NewVirtualPathWatcher } from './watcherVirtual.js'

/**
 * @param {string} rootUUID
 * @param {?string} fsPath
 * @param {?ExtraPayload} extra
 * @return {Promise<{watcher: VirtualTree, eventTransaction: EventTransaction}>}
 * @constructor
 */
export const NewVirtualWatcher = (rootUUID, fsPath, extra) => {
  return NewVirtualPathWatcher(rootUUID, fsPath, extra)
}
