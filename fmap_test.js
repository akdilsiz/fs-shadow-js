const unitJS = require("unit.js")
const { FMap } = require("./fmap")

describe('FMap', () => {
  it('set/2', () => {
    const fmap = new FMap()

    fmap.set('k1', ['v1'])

    unitJS.assert.equal(fmap.size('k1'), 1)
  })

  it('has/1', () => {
    const fmap = new FMap()

    fmap.set('k1', ['v1'])

    unitJS.assert.equal(fmap.has('k1'), true)
  })

  it('get/1', () => {
    const fmap = new FMap(),
      val = ['v1']

    fmap.set('k1', val)

    unitJS.assert.equal(fmap.get('k1'), val)
  })


  it('getLast/1', () => {
    const fmap = new FMap()

    fmap.set('k1', ['v1', 'v2'])

    unitJS.assert.equal(fmap.getLast('k1'), 'v2')
  })

  it('append/2', () => {
    const fmap = new FMap()

    fmap.append('k1', 'vk1')

    unitJS.assert.equal(fmap.size('k1'), 1)
    unitJS.assert.equal(fmap.getLast('k1'), 'vk1')
  })

  it('append/2 already setted', () => {
    const fmap = new FMap()

    fmap.set('k1', ['v1']).append('k1', 'v3')

    unitJS.assert.equal(fmap.size('k1'), 2)
  })

  it('remove/1', () => {
    const fmap = new FMap()

    fmap.set('k1', ['v1']).append('k1', 'v3').remove('k1')

    unitJS.assert.equal(fmap.size('k1'), 0)
  })
})