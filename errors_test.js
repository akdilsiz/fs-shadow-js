const unitJS = require('unit.js')
const {
  ErrArguments,
  ErrToFileNodeNotFound,
  ErrFileNodeExists,
  ErrFileNodeNotFound,
  ErrSubsNodeNotFound,
  ErrFileExists
} = require('./errors')

describe('Errors Tests', () => {
  it('Arguments Error', () => {
    unitJS.assert.equal('arguments error', ErrArguments.message)
  })

  it('ToFileNodeNotFound Error', () => {
    unitJS.assert.equal('to FileNode not found', ErrToFileNodeNotFound.message)
  })

  it('FileNodeExists Error', () => {
    unitJS.assert.equal('FileNode already exists', ErrFileNodeExists.message)
  })

  it('FileNodeNotFount Error', () => {
    unitJS.assert.equal('FileNode not found', ErrFileNodeNotFound.message)
  })

  it('SubsNodeNotFount Error', () => {
    unitJS.assert.equal('subs nodes not found', ErrSubsNodeNotFound.message)
  })

  it('FileExists Error', () => {
    unitJS.assert.equal('this file already exists', ErrFileExists.message)
  })
})