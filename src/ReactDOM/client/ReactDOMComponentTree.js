var DOMProperty = require('../shared/DOMProperty')
var ReactDOMComponentFlags = require('../shared/ReactDOMComponentFlags')

var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME
var Flags = ReactDOMComponentFlags

var internalInstanceKey = 
  '__reactInternalInsatnce$' + Math.random().toString(36).slice(2)

function shouldPrecacheNode(node, nodeID) {
  return (
    (node.nodeType === 1 && node.getAttribute(ATTR_NAME) === String(nodeID)) ||
    (node.nodeType === 8 &&
      node.nodeValue === ' react-text: ' + nodeID + ' ') ||
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
  getNodeFromInstance: getNodeFromInstance,
  precacheNode: precacheNode
}

module.exports = ReactDOMComponentTree