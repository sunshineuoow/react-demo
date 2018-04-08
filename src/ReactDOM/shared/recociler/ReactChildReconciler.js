var instantiateReactComponent = require('./instantiateReactComponent')
var traverseAllChildren = require('../../../utils/traverseAllChildren')

function instantiateChild(childInstances, child, name) {
  var keyUnique = childInstances[name] === undefined
  if (child != null && keyUnique) {
    childInstances[name] = instantiateReactComponent(child, true)
  }
}


var ReactChildReconciler = {
  instantiateChildren: function(
    nestedChildNodes,
  ) {

    if (nestedChildNodes === null) {
      return null
    }
    var childInstances = {}

    traverseAllChildren(nestedChildNodes, instantiateChild, childInstances)

    return childInstances
  }
}

module.exports = ReactChildReconciler
