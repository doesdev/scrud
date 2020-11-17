'use strict'

const isObject = (o) => Object.prototype.toString.call(o) === '[object Object]'

const getKeys = (o) => isObject(o) ? Object.keys(o) : []

const getShape = (dataAry, sampleSize = 3) => {
  if (!Array.isArray(dataAry)) return null

  const shape = getKeys(dataAry[0])
  const keyed = shape.join('')
  if (!shape.length) return null

  const subAry = dataAry.slice(1, sampleSize)
  const matched = subAry.every((dataObj) => keyed === getKeys(dataObj).join(''))

  return matched ? shape : null
}

const compactify = (data) => {
  const shapeAry = getShape(data)

  if (!shapeAry) return { data }

  const shape = Object.fromEntries(shapeAry.map((k) => [k, true]))

  for (const item of data) {
    for (const key in item) {
      const v = item[key]
      if (shape[key] && !v && (v === null || v === undefined)) delete item[key]
    }
  }

  return { shape, data }
}

module.exports = { compactify }
