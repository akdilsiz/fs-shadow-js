const unitJS = require('unit.js')
const { ErrArguments } = require('./errors')
const { Separator, Path, FileInfo } = require('./path')

describe('Seperator', () => {
  it('valid', () => {
    unitJS.assert.equal('/', Separator)
  })
})

describe('Path Tests', () => {
  it('all', () => {
    const p = new Path()

    unitJS.assert.equal(false, p.IsVirtual())
    unitJS.assert.equal(false, p.IsDir())
    unitJS.assert.equal(false, p.Exists())
    unitJS.assert.equal('', p.Name())
    unitJS.assert.equal('', p.String())
    unitJS.value(p.ParentPath()).is(new Path())
    unitJS.value(p.ExcludePath(new Path())).is(new Path())
    unitJS.value(p.Info()).is(new FileInfo())
  })
})

describe('FileInfo Tests', () => {
  it('with valid params', () => {
    const fileInfo = new FileInfo(true, 2, 3, 'permission')

    unitJS.assert.equal(true, fileInfo.IsDir)
    unitJS.assert.equal(2, fileInfo.Size)
    unitJS.assert.equal(3, fileInfo.CreatedAt)
    unitJS.assert.equal('permission', fileInfo.Permission)
  })

  it('Should be throw ErrArguments with invalid size ', () => {
    unitJS.error(() => {
      new FileInfo(true, -1, 0, 'perm')
    }).is(ErrArguments)
  })

  it('.ToJSON()', () => {
    const jsonValue = `{"IsDir":true,"Size":3,"CreatedAt":4,"Permission":"perm1"}`,
      fileInfo = new FileInfo(true, 3, 4, 'perm1')

    unitJS.assert.equal(jsonValue, fileInfo.ToJSON())
  })

  it('.FromJSON()', () => {
    const jsonValue = `{"IsDir":true,"Size":3,"CreatedAt":4,"Permission":"perm1"}`,
      { fileInfo, error } = new FileInfo().FromJSON(jsonValue)

    unitJS.value(error).isNull()
    unitJS.assert.equal(true, fileInfo.IsDir)
    unitJS.assert.equal(3, fileInfo.Size)
    unitJS.assert.equal(4, fileInfo.CreatedAt)
    unitJS.assert.equal('perm1', fileInfo.Permission)
  })

  it('Should be SyntaxError .FromJSON() is invalid json string', () => {
    const { fileInfo, error } = new FileInfo().FromJSON('invalid')

    unitJS.value(error).isInstanceOf(Error)
    unitJS.value(fileInfo).isNull()
  })

  it('Should be SyntaxError .FromJSON() is invalid CreatedAt', () => {
    const jsonValue = `{"IsDir":true,"Size":3,"CreatedAt":-1,"Permission":"perm1"}`,
      { fileInfo, error } = new FileInfo().FromJSON(jsonValue)

    unitJS.value(error).is(ErrArguments)
    unitJS.value(fileInfo).isNull()
  })
})