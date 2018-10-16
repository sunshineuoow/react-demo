var ReactReconciler = require('./ReactReconciler')

var instantiateReactComponent = require('./instantiateReactComponent')
var shouldUpdateReactComponent = require('../../shared/shouldUpdateReactComponent')
var traverseAllChildren = require('../../../../utils/traverseAllChildren')

function instantiateChild(childInstances, child, name) {
  var keyUnique = childInstances[name] === undefined
  if (child != null && keyUnique) {
    childInstances[name] = instantiateReactComponent(child, true)
  }
}


var ReactChildReconciler = {
  instantiateChildren: function(
    nestedChildNodes,
    transaction
  ) {

    if (nestedChildNodes === null) {
      return null
    }
    var childInstances = {}

    traverseAllChildren(nestedChildNodes, instantiateChild, childInstances)

    return childInstances
  },

  updateChildren: function(
    prevChildren,
    nextChildren,
    mountImages,
    removedNodes,
    transaction,
    hostParent,
    hostContainerInfo,
    selfDebugID
  ) {
    if (!nextChildren && !prevChildren) {
      return
    }

    var name
    var prevChild
    for (name in nextChildren) {
      if (!nextChildren.hasOwnProperty(name)) {
        continue
      }
      prevChild = prevChildren && prevChildren[name]
      var prevElement = prevChild && prevChild._currentElement
      var nextElement = nextChildren[name]
      if (
        prevChild !== null &&
        shouldUpdateReactComponent(prevElement, nextElement)
      ) {
        ReactReconciler.receiveComponent(
          prevChild,
          nextElement,
          transaction
        )
        nextChildren[name] = prevChild
      } else {
        if (prevChild) {
          removedNodes[name] = ReactReconciler.getHostNode(prevChild)
          ReactReconciler.unmountComponent(prevChild, false)
          mountImages.push(nextChildMountImage)
        }
        var nextChildInstance = instantiateReactComponent(nextElement, true)
        nextChildren[name] = nextChildInstance
        var nextChildMountImage = ReactReconciler.mountComponent(
          nextChildren,
          transaction,
          hostParent,
          hostContainerInfo,
          selfDebugID
        )
        mountImages.push(nextChildMountImage)
      }
    }

    for (name in prevChildren) {
      if (
        prevChildren.hasOwnProperty(name) &&
        !(nextChildren && nextChildren.hasOwnProperty(name))
      ) {
        prebChild = prevChildren[name]
        removedNodes[name] = ReactReaconciler.getHostNode(prevChild)
        ReactReaconciler.unmountComponent(prevChild, false)
      }
    }
  },

  umountChildren: function(renderedChildren, safely) {
    for (var name in renderedChildren) {
      if (renderedChildren.hasOwnProperty(name)) {
        var renderedChildren = renderedChildren[name]
        ReactReconciler.umountComponent(renderedChildren, safely)
      }
    }
  }
}

module.exports = ReactChildReconciler
