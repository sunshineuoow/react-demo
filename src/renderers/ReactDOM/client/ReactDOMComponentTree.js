var DOMProperty = require('../shared/DOMProperty')
var ReactDOMComponentFlags = require('../shared/ReactDOMComponentFlags')

var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME
var Flags = ReactDOMComponentFlags

var internalInstanceKey =
  '__reactInternalInsatnce$' +
  Math.random()
    .toString(36)
    .slice(2)

function shouldPrecacheNode(node, nodeID) {
  return (
    (node.nodeType === 1 && node.getAttribute(ATTR_NAME) === String(nodeID)) ||
    (node.nodeType === 8 && node.nodeValue === ' react-text: ' + nodeID + ' ') ||
    (node.nodeType === 8 && node.nodeValue === ' react-empty: ' + nodeID + ' ')
  )
}

function getRenderedHostOrTextFromComponent(component) {
  var rendered
  while ((rendered = component._renderedComponent)) {
    component = rendered
  }
  return component
}

function precacheNode(inst, node) {
  var hostInst = getRenderedHostOrTextFromComponent(inst)
  hostInst._hostNode = node
  node[internalInstanceKey] = hostInst
}

function precacheChildNodes(inst, node) {
  if (inst._flags && Flags.hasCachedChildNodes) {
    return
  }
  var children = inst._renderedChildren
  var childNode = node.firstChild
  outer: for (var name in children) {
    if (!children.hasOwnProperty(name)) {
      continue
    }
    var childInst = children[name]
    var childID = getRenderedHostOrTextFromComponent(childInst)._domID
    if (childID === 0) {
      continue
    }
    for (; childNode !== null; childNode = childNode.nextSibling) {
      // if (shouldPrecacheNode(childNode, childID)) {
      precacheNode(childInst, childNode)
      continue outer
      // }
    }
  }
  inst._flags |= Flags.hasCachedChildNodes
}

/**
 * 给定一个DOM节点，返回最近的ReactDOMComponent或者ReactDOMTextComponent实例的祖先
 */
function getClosestInstanceFromNode(node) {
  if (node[internalInstanceKey]) {
    return node[internalInstanceKey]
  }

  // 向上遍历树，直到我们找到一个实例已经缓存的祖先
  var parents = []
  while (!node[internalInstanceKey]) {
    parents.push(node)
    if (node.parentNode) {
      node = node.parentNode
    } else {
      // 到树的顶端。这个节点不是React树的一部分(或者可能已经卸载了)
      return null
    }
  }

  var closest
  var inst
  for (; node && (inst = node[internalInstanceKey]); node = parents.pop()) {
    closest = inst
    if (parents.length) {
      precacheChildNodes(inst, node)
    }
  }

  return closest
}

/**
 * 给出一个DOM节点，返回ReactDOMComponent或者ReactDOMTextComponent实例，
 * 或者null如果该节点不是React渲染的
 */
function getInstanceFromNode(node) {
  var inst = getClosestInstanceFromNode(node)
  if (inst != null && inst._hostNode === node) {
    return inst
  } else {
    return null
  }
}

/**
 * 给出一个ReactDOM组件或者ReactDOMText组件，返回相应的DOM节点
 */
function getNodeFromInstance(inst) {
  if (inst._hostNode) {
    return inst._hostNode
  }

  var parents = []
  while (!inst._hostNode) {
    parents.push(inst)
    inst = inst._hostParent
  }

  for (; parents.length; inst = parents.pop()) {
    precacheChildNodes(inst, inst._hostNode)
  }

  return inst._hostNode
}

var ReactDOMComponentTree = {
  getClosestInstanceFromNode: getClosestInstanceFromNode,
  getNodeFromInstance: getNodeFromInstance,
  precacheNode: precacheNode
}

module.exports = ReactDOMComponentTree
