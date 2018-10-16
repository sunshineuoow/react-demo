/**
 * @param {array} arr 一个数组或者单个项目的累计。与`accumulate`配对时很有用。
 * 这是一个简单的工具，允许我们对项目的集合进行推断，但是处理了当只有一个项目时的情况(我们不需要分配数组)
 */
function forEachAccumulated(arr, cb, scope) {
  if (Array.isArray(arr)) {
    arr.forEach(cb, scope)
  } else if (arr) {
    cb.call(scope, arr)
  }
}

module.exports = forEachAccumulated
