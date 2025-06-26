import unitJS from 'unit.js'
import { FMap } from './fmap.js'

describe('FMap', () => {
  it('set/2', () => {
    const fMap = new FMap()

    fMap.set('k1', ['v1'])

    unitJS.assert.equal(fMap.size('k1'), 1)
  })

  it('has/1', () => {
    const fMap = new FMap()

    fMap.set('k1', ['v1'])

    unitJS.assert.equal(fMap.has('k1'), true)
  })

  it('get/1', () => {
    const fMap = new FMap(),
      val = ['v1']

    fMap.set('k1', val)

    unitJS.assert.equal(fMap.get('k1'), val)
  })


  it('getLast/1', () => {
    const fMap = new FMap()

    fMap.set('k1', ['v1', 'v2'])

    unitJS.assert.equal(fMap.getLast('k1'), 'v2')
  })

  it('append/2', () => {
    const fMap = new FMap()

    fMap.append('k1', 'vk1')

    unitJS.assert.equal(fMap.size('k1'), 1)
    unitJS.assert.equal(fMap.getLast('k1'), 'vk1')
  })

  it('append/2 already setted', () => {
    const fMap = new FMap()

    fMap.set('k1', ['v1']).append('k1', 'v3')

    unitJS.assert.equal(fMap.size('k1'), 2)
  })

  it('remove/1', () => {
    const fMap = new FMap()

    fMap.set('k1', ['v1']).append('k1', 'v3').remove('k1')

    unitJS.assert.equal(fMap.size('k1'), 0)
  })
})