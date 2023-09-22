const unitJS = require('unit.js')
const VirtualPath = require('./virtualPath')
const { FileInfo } = require('./path')

describe('VirtualPath Tests', () => {
  it('all', () => {
    const virtualPath = new VirtualPath('rootPath/vPath', true)

    unitJS.assert.equal(true, virtualPath.IsVirtual())
    unitJS.assert.equal(true, virtualPath.IsDir())
    unitJS.value(virtualPath.Info()).isInstanceOf(FileInfo)
    unitJS.assert.equal(true, virtualPath.Exists())
    unitJS.value(virtualPath.ParentPath()).is(new VirtualPath('rootPath', true))
    unitJS.value(virtualPath.ExcludePath(new VirtualPath('rootPath'))).is(new VirtualPath('vPath', true))
  })
})