var ReactComponentEnvironment = require('./ReactComponentEnvironment')
var ReactReconciler = require('./ReactReconciler')
var ReactChildReconciler = require('./ReactChildReconciler')

var flattenChildren = require('../../../../utils/flattenChildren')


function makeTextContent(textContent) {
  return {
    type: 'TEXT_CONTENT',
    content: textContent,
    fromIndex: null,
    formNode: null,
    toIndex: null,
    afterNode: null
  }
}

function processQueue(inst, updateQueue) {
  ReactComponentEnvironment.processChildrenUpdates(inst, updateQueue)
}

var ReactMultiChild = {
  Mixin: {
    _reconcilerInstantiateChildren: function(
      nestedChildren,
      transaction
    ) {
      return ReactChildReconciler.instantiateChildren(
        nestedChildren,
        transaction
      )
    },

    _reconcilerUpdateChildren: function(
      prevChildren,
      nextNestedChildrenElements,
      mountImages,
      removedNodes,
      transaction
    ) {
      var nextChildren
      var selfDegubID = 0

      nextChildren = flattenChildren(nextNestedChildrenElements, selfDegubID)
      ReactChildReconciler.updateChildren(
        prevChildren,
        nextChildren,
        mountImages,
        removedNodes,
        transaction,
        this,
        this._hostContainerInfo,
        selfDegubID
      )
      return nextChildren
    },

    mountChildren: function(nestedChildren, transaction) {
      var children = this._reconcilerInstantiateChildren(
        nestedChildren,
        transaction
      )
      this._renderedChildren = children


      var mountImages = []
      var index = 0
      for (var name in children) {
        if (children.hasOwnProperty(name)) {
          var child = children[name]
          var mountImage = ReactReconciler.mountComponent(
            child,
            transaction,
            this,
            this._hostContainerInfo,
          )
          child._mountIndex = index++
          mountImages.push(mountImage)
        }
      }

      return mountImages
    },

    updateTextContent: function(nextContent) {
      var prevChildren = this._renderedChildren

      ReactChildReconciler.umountChildren(prevChildren, false)
      
      var updates = [makeTextContent(nextContent)]
      processQueue(this, updates)
    },

    updateMarkup: function(nextMarkup) {
      var prevChildren = this._renderedChildren
      ReactChildReconciler.umountChildren(prevChildren, false)
      var updaets = [makeSetMarkup(nextMarkup)]
      processQueue(this, updates)
    },

    updateChildren: function(nextNestedChildrenElements, transaction) {
      this._updateChildren(nextNestedChildrenElements, transaction)
    },

    _updateChildren: function(
      nextNestedChildrenElements,
      transaction
    ) {
      var prevChildren = this._renderedChildren
      var removedNodes = {}
      var mountImages = [] 

      var nextChildren = this._reconcilerUpdateChildren(
        prevChildren,
        nextNestedChildrenElements,
        mountImages,
        removedNodes,
        transaction
      )
      if (!nextChildren && !prevChildren) {
        return
      }
    }
  }
}

module.exports = ReactMultiChild
