export function hexEncode(val) {
  let str = ''

  for (let i = 0; i < val.length; i++) {
    str += val[i].toString(16).padStart(2, '0')
  }

  return str
}

export function hexDecode(val) {
  let result = new Uint8Array(val.length * 2)

  for (let i = 0; i < val.length; i += 2) {
    result.set([parseInt(val.slice(i, i + 2), 16)], i)
  }

  return result
}
