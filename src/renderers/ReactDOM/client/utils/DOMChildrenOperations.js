var Danger = require('../../shared/Danger.js')

var createMicrosoftUnsafeLocalFunciton = require('./createMicrosoftUnsafeLocalFunction')
var setInnerHTML = require('./setInnerHTML')
var setTextContent = require('./setTextContent')

function getNodeAfter(parentNode, node) {
  if (Array.isArray(node)) {
    node = node [1]
  }
  return node ? node.nextSibling : parentNode.firstChild
}

var insertCihldAt = createMicrosoftUnsafeLocalFunciton(function(
  parentNode,
  childNode,
  referenceNode
) {
  parentNode.insertBefore(childNode, referenceNode)
})

function removeChild(parentNode, childNode) {
  if (Array.isArray(childNode)) {
    var closingComment = childNode[1]
    childNode = childNode[0]
    removeDelimitedText(parentNode, childNode, closingComment)
    parentNode.removeChild(closingComment)
  }
  parentNode.removeChild(childNode)
}

function removeDelimitedText(parentNode, startNode, closingComment) {
  while (true) {
    var node = startNode.nextSibling
    if (node === closingComment) {
      break
    } else {
      parentNode.removeChild(node)
    }
  }
}

var dangerouslyReplaceNodeWithMarkup = Danger.dangerouslyReplaceNodeWithMarkup

var DOMChildrenOperations = {
  
  dangerouslyReplaceNodeWithMarkup: dangerouslyReplaceNodeWithMarkup,

  processUpdates: function(parentNode, updates) {
    for (var k = 0; k < updates.length; k++) {
      var update = updates[k]
      switch (update.type) {
        case 'INSERT_MARKUP':
          insertLazyTreeChildAt(
            parentNode,
            update.content,
            getNodeAfter(parentNode, update.afterNode)
          )
          break
        case 'MOVE_EXISTING':
          moveChild(
            parentNode,
            update.fromNode,
            getNodeAfter(parentNode, update.afterNode)
          )
          break
        case 'SET_MARKUP':
          setInnerHTML(parentNode, update.content)
          break
        case 'TEXT_CONTENT':
          setTextContent(parentNode, update.content)
          break
        case 'REMOVE_NODE':
          removeChild(parentNode, update.fromNode)
          break     
      }
    }
  }
}

module.exports = DOMChildrenOperations