class FMap {
  m = new Map()

  has(key) {
    return this.m.has(key)
  }


  size(key) {
    if (!this.has(key)) return 0

    return this.m.get(key).length
  }

  get(key) {
    return this.m.get(key)
  }

  getLast(key) {
    if (this.has(key)) {
      return this.get(key)[this.size(key) > 0 ? this.size(key) - 1 : 0]
    }

    return null
  }

  set(key, value) {
    this.m.set(key, value)

    return this
  }

  setLast(key, value) {
    if (this.m.has(key)) {
      this.m.set(key, [...this.m.get(key).slice(0, this.size(key)-1), value])
    }
  }

  append(key, value) {
    if (this.m.has(key)) {
      this.m.set(key, [...this.m.get(key), value])

      return this
    }

    this.m.set(key, [value])

    return this
  }

  remove(key) {
    if (this.m.has(key)) {
      this.m.delete(key)
    }

    return this
  }

  clear() {
    this.m.clear()
  }
}

module.exports = {
  FMap,
}