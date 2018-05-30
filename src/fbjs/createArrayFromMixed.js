function toArray(obj) {
  const length = obj.length

  if (obj.hasOwnProperty) {
    try {
      return Array.prototype.slice.call(obj)
    } catch (e) {
      // IE < 9 does not support Array#clide on collections objects
    }
  }

  const ret = Array(length)
  for (let ii = 0; ii < length; ii++) {
    ret[ii] = obj[ii]
  }
  return ret
}

function hasArrayNature(obj) {
  return (
    // 不是 null/false
    !!obj &&
    // Safari中，NodeLists是function，arrays是object
    (typeof obj === 'object' || typeof obj === 'function') &&
    // 类数组
    ('length' in obj) &&
    // 不是window对象
    !('setInterval' in obj) &&
    // DOM节点不应当被认为是类数组
    // 一个select元素有length和item属性(IE8内)
    (typeof obj.nodeType !== 'number') &&
    (
      // 真实数组
      Array.isArray(obj) ||
      // arguments
      ('callee' in obj) ||
      // HTMLCollection/NodeList
      ('item' in obj)
    )
  )
}


function createArrayFromMixed(obj) {
  if (!hasArrayNature(obj)) {
    return [obj]
  } else if (Array.isArray(obj)) {
    return obj.slice()
  } else {
    return toArray(obj)
  }
}

module.exports = createArrayFromMixed