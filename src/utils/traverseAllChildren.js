var REACT_ELEMENT_TYPE = require('./ReactElementSymbol')

var getIteratorFn = require('./getIteratorFn')

var SEPARATOR = '.'
var SUBSEPARATOR = ':'

function getComponentKey(Componentm, index) {
  return index.toString(36)
}

function traverseAllChildrenImpl (
  children,
  nameSoFar,
  callback,
  traverseContext
) {
  var type = typeof children

  if (
    children === null ||
    type === 'string' ||
    type === 'number' ||
    (type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE)
  ) {
    callback(
      traverseContext,
      children,
      nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar
    )
    return 1
  }

  var child
  var nextName
  var subtreeCount = 0
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR


  if(Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i]
      nextName = nextNamePrefix + getComponentKey(child, i)
      subtreeCount += traverseAllChildrenImpl(
        child,
        nextName,
        callback,
        traverseContext
      )
    }
  }

  return subtreeCount
}

function traverseAllChildren(children, callback, traverseContext) {
  if (children === null) {
    return 0
  }

  return traverseAllChildrenImpl(children, '', callback ,traverseContext)
}

module.exports = traverseAllChildren
