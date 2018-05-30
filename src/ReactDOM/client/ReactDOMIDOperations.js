var DOMChildrenOperations = require('./utils/DOMChildrenOperations')
var ReactDOMComponentTree = require('../client/ReactDOMComponentTree')


var ReactDOMIDOperations = {
  dangerouslyProcessChildrenUpdates: function(parentInst, updates) {
    var node = ReactDOMComponentTree.getNodeFromInstance(parentInst)
    DOMChildrenOperations.processUpdates(node, updates)
  }
}

module.exports = ReactDOMIDOperations
