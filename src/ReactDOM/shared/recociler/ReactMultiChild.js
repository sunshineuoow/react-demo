var ReactReconciler = require('./ReactReconciler')
var ReactChildReconciler = require('./ReactChildReconciler')

var ReactMultiChild = {
  Mixin: {
    _reconcilerInstantiateChildren: function(
      nestedChildren,
    ) {
      return ReactChildReconciler.instantiateChildren(
        nestedChildren,
      )
    },

    mountChildren: function(nestedChildren) {
      var children = this._reconcilerInstantiateChildren(
        nestedChildren,
      )
      this._renderedChildren = children


      var mountImages = []
      var index = 0
      for (var name in children) {
        if (children.hasOwnProperty(name)) {
          var child = children[name]
          var mountImage = ReactReconciler.mountComponent(
            child,
            this,
            this._hostContainerInfo,
          )
          child._mountIndex = index++
          mountImages.push(mountImage)
        }
      }

      return mountImages
    }
  }
}

module.exports = ReactMultiChild
