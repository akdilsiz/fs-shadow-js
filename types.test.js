import unitJS from 'unit.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { v4 } from 'uuid'
import { ErrArguments } from './errors.js'
import { DateTypes, MetaData, ExtraPayload } from './types.js'
import { hexEncode } from './util.js'

describe('Types Tests', () => {
  it('DateTypes', () => {
    unitJS.assert.equal(DateTypes.MILLI, 0)
    unitJS.assert.equal(DateTypes.NANO, 1)
  })

  it('MetaData is valid arguments', () => {
    const createdAt = new Date(Date.now()),
      metaData = new MetaData(
        true,
        hexEncode(
          sha256
            .create()
            .update(new TextEncoder().encode('sumSHA256'))
            .digest(),
        ),
        123,
        createdAt.getSeconds(),
        'permission',
      )

    unitJS.assert.equal(true, metaData.IsDir)
    unitJS.assert.equal(
      metaData.Sum,
      hexEncode(
        sha256.create().update(new TextEncoder().encode('sumSHA256')).digest(),
      ),
    )
    unitJS.assert.equal(metaData.Size, 123)
    unitJS.assert.equal(metaData.CreatedAt, createdAt.getSeconds())
    unitJS.assert.equal(metaData.Permission, 'permission')
  })

  it('MetaData .ToJSON()', () => {
    const createdAt = new Date(Date.now()),
      utcCreatedAt = new Date(
        Date.UTC(
          createdAt.getUTCFullYear(),
          createdAt.getUTCMonth(),
          createdAt.getUTCDate(),
          createdAt.getUTCHours(),
          createdAt.getUTCMinutes(),
          createdAt.getUTCSeconds(),
          createdAt.getUTCMilliseconds(),
        ),
      ),
      metaData = new MetaData(
        true,
        hexEncode(
          sha256
            .create()
            .update(new TextEncoder().encode('sumSHA256'))
            .digest(),
        ),
        123,
        createdAt.getSeconds(),
        'permission',
      )

    metaData.SetUTCCreatedAt(utcCreatedAt.getSeconds())
    const value = `{"is_dir":true,"sum":"${hexEncode(sha256.create().update(new TextEncoder().encode('sumSHA256')).digest())}","size":123,"created_at":${createdAt.getSeconds()},"permission":"permission","utc_created_at":${utcCreatedAt.getSeconds()}}`

    unitJS.assert.equal(value, metaData.ToJSON())
  })

  it('MetaData .FromJSON()', () => {
    const createdAt = new Date(Date.now()),
      value = `{"is_dir":true,"sum":"${hexEncode(sha256.create().update(new TextEncoder().encode('sumSHA256-2')).digest())}","size":12345,"created_at":${createdAt.getSeconds()},"permission":"permission2"}`,
      { metaData, error } = new MetaData().FromJSON(value)

    unitJS.value(error).isNull()
    unitJS.assert.equal(true, metaData.IsDir)
    unitJS.assert.equal(
      hexEncode(
        sha256
          .create()
          .update(new TextEncoder().encode('sumSHA256-2'))
          .digest(),
      ),
      metaData.Sum,
    )
    unitJS.assert.equal(12345, metaData.Size)
    unitJS.assert.equal(createdAt.getSeconds(), metaData.CreatedAt)
    unitJS.assert.equal('permission2', metaData.Permission)
  })

  it('Should be SyntaxError MetaData .FromJSON()', () => {
    const createdAt = new Date(Date.now()),
      value = `{"is_dir":true"size":12345,"created_at":${createdAt.getSeconds()},"permission":"permission2"}`,
      { metaData, error } = new MetaData().FromJSON(value)

    unitJS.value(metaData).isNull()
    unitJS.bool(error instanceof SyntaxError).isTrue()
  })

  it('Should be ErrArguments MetaData .FromJSON() if size is negative', () => {
    const createdAt = new Date(Date.now()),
      value = `{"is_dir":true,"sum":"${hexEncode(sha256.create().update(new TextEncoder().encode('sumSHA256-2')).digest())}","size":-1,"created_at":${createdAt.getSeconds()},"permission":"permission2"}`,
      { metaData, error } = new MetaData().FromJSON(value)

    unitJS.value(metaData).isNull()
    unitJS.assert.equal(ErrArguments, error.message)
  })

  it('Should be ErrArguments MetaData .FromJSON() if created_at is negative', () => {
    const value = `{"is_dir":true,"sum":"${hexEncode(sha256.create().update(new TextEncoder().encode('sumSHA256-2')).digest())}","size":123,"created_at":-1,"permission":"permission2"}`,
      { metaData, error } = new MetaData().FromJSON(value)

    unitJS.value(metaData).isNull()
    unitJS.assert.equal(ErrArguments, error.message)
  })

  it('Should be ErrArguments MetaData is invalid size', () => {
    const createdAt = new Date(Date.now())

    unitJS
      .exception(() => {
        new MetaData(
          true,
          hexEncode(
            sha256
              .create()
              .update(new TextEncoder().encode('sumSHA256'))
              .digest(),
          ),
          -1,
          createdAt.getSeconds(),
          'permission',
        )
      })
      .is(new Error(ErrArguments))
  })

  it('Should be ErrArguments MetaData is invalid createdAt', () => {
    unitJS
      .exception(() => {
        new MetaData(
          true,
          hexEncode(
            sha256
              .create()
              .update(new TextEncoder().encode('sumSHA256'))
              .digest(),
          ),
          123,
          -1,
          'permission',
        )
      })
      .is(new Error(ErrArguments))
  })

  it('ExtraPayload is valid arguments', () => {
    const uid = v4(),
      createdAt = new Date(Date.now()),
      extraPayload = new ExtraPayload(
        uid,
        true,
        hexEncode(
          sha256
            .create()
            .update(new TextEncoder().encode('sumSHA256'))
            .digest(),
        ),
        123,
        createdAt.getSeconds(),
        'permission',
      )

    unitJS.assert.equal(uid, extraPayload.UUID)
    unitJS.assert.equal(true, extraPayload.IsDir)
    unitJS.assert.equal(
      extraPayload.Sum,
      hexEncode(
        sha256.create().update(new TextEncoder().encode('sumSHA256')).digest(),
      ),
    )
    unitJS.assert.equal(extraPayload.Size, 123)
    unitJS.assert.equal(extraPayload.CreatedAt, createdAt.getSeconds())
    unitJS.assert.equal(extraPayload.Permission, 'permission')
  })

  it('ExtraPayload .ToJSON()', () => {
    const uid = v4(),
      createdAt = new Date(Date.now()),
      utcCreatedAt = new Date(
        Date.UTC(
          createdAt.getUTCFullYear(),
          createdAt.getUTCMonth(),
          createdAt.getUTCDate(),
          createdAt.getUTCHours(),
          createdAt.getUTCMinutes(),
          createdAt.getUTCSeconds(),
          createdAt.getUTCMilliseconds(),
        ),
      ),
      extraPayload = new ExtraPayload(
        uid,
        true,
        hexEncode(
          sha256
            .create()
            .update(new TextEncoder().encode('sumSHA256'))
            .digest(),
        ),
        123,
        createdAt.getSeconds(),
        'permission',
      )

    extraPayload.SetUTCCreatedAt(utcCreatedAt.getSeconds())
    const value = `{"UUID":"${uid}","IsDir":true,"Sum":"${hexEncode(sha256.create().update(new TextEncoder().encode('sumSHA256')).digest())}","Size":123,"CreatedAt":${createdAt.getSeconds()},"Permission":"permission","UTCCreatedAt":${utcCreatedAt.getSeconds()}}`

    unitJS.assert.equal(value, extraPayload.ToJSON())
  })

  it('ExtraPayload .FromJSON()', () => {
    const uid = v4(),
      createdAt = new Date(Date.now()),
      value = `{"UUID":"${uid}","IsDir":true,"Sum":"${hexEncode(sha256.create().update(new TextEncoder().encode('sumSHA256-2')).digest())}","Size":12345,"CreatedAt":${createdAt.getSeconds()},"Permission":"permission2"}`,
      { extraPayload, error } = new ExtraPayload().FromJSON(value)

    unitJS.value(error).isNull()
    unitJS.assert.equal(uid, extraPayload.UUID)
    unitJS.assert.equal(true, extraPayload.IsDir)
    unitJS.assert.equal(
      hexEncode(
        sha256
          .create()
          .update(new TextEncoder().encode('sumSHA256-2'))
          .digest(),
      ),
      extraPayload.Sum,
    )
    unitJS.assert.equal(12345, extraPayload.Size)
    unitJS.assert.equal(createdAt.getSeconds(), extraPayload.CreatedAt)
    unitJS.assert.equal('permission2', extraPayload.Permission)
  })

  it('Should be SyntaxError ExtraPayload .FromJSON()', () => {
    const value = `"invalid`,
      { extraPayload, error } = new ExtraPayload().FromJSON(value)

    unitJS.value(extraPayload).isNull()
    unitJS.bool(error instanceof SyntaxError).isTrue()
  })

  it('Should be ErrArguments ExtraPayload .FromJSON() if size is negative', () => {
    const uid = v4(),
      createdAt = new Date(Date.now()),
      value = `{"UUID":"${uid}","IsDir":true,"Sum":"${hexEncode(sha256.create().update(new TextEncoder().encode('sumSHA256')).digest())}","Size":-1,"CreatedAt":${createdAt.getSeconds()},"Permission":"permission2"}`,
      { extraPayload, error } = new ExtraPayload().FromJSON(value)

    unitJS.value(extraPayload).isNull()
    unitJS.assert.equal(ErrArguments, error.message)
  })

  it('Should be ErrArguments ExtraPayload .FromJSON() if created_at is negative', () => {
    const uid = v4(),
      value = `{"UUID":"${uid}","IsDir":true,"Sum":"${hexEncode(sha256.create().update(new TextEncoder().encode('sumSHA256')).digest())}","Size":123,"CreatedAt":-1,"Permission":"permission"}`,
      { extraPayload, error } = new ExtraPayload().FromJSON(value)

    unitJS.value(extraPayload).isNull()
    unitJS.assert.equal(ErrArguments, error.message)
  })

  it('Should be ErrArguments ExtraPayload is invalid size', () => {
    const uid = v4(),
      createdAt = new Date(Date.now())

    unitJS
      .exception(() => {
        new ExtraPayload(
          uid,
          true,
          hexEncode(
            sha256
              .create()
              .update(new TextEncoder().encode('sumSHA256'))
              .digest(),
          ),
          -1,
          createdAt.getSeconds(),
          'permission',
        )
      })
      .is(new Error(ErrArguments))
  })

  it('Should be ErrArguments ExtraPayload is invalid createdAt', () => {
    unitJS
      .exception(() => {
        new ExtraPayload(
          v4(),
          true,
          hexEncode(
            sha256
              .create()
              .update(new TextEncoder().encode('sumSHA256'))
              .digest(),
          ),
          123,
          -1,
          'permission',
        )
      })
      .is(new Error(ErrArguments))
  })
})
