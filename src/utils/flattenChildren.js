const traverseAllChildren = require('./traverseAllChildren')

function flattenSingleChildIntoContext(
  traverseContext,
  child,
  name,
  selfDebugID
) {
  if (traverseContext && typeof traverseContext === 'object') {
    const result = traverseContext
    const KeyUnique = result[name] === undefined
    if (KeyUnique && child != null) {
      result[name] = child
    }
  }
}

function flattenChildren(
  children,
  selfDebugID
) {
  if (children == null) {
    return children
  }
  var result = {}
  traverseAllChildren(children, flattenSingleChildIntoContext, result)
  return result
}

module.exports = flattenChildren