var ReactCompositeComponent = require('./ReactCompositeComponent')
var ReactEmptyComponent = require('./ReactEmptyComponent')
var ReactHostComponent = require('./ReactHostComponent')

var ReactCompositeComponentWrapper = function(element) {
  this.construct(element)
}

function isInternalComponentType(type) {
  return (
    typeof type === 'function' &&
    typeof type.prototype !== 'undefined' &&
    typeof type.prototype.mountComponent === 'function' &&
    typeof type.prototype.receiveComponent === 'function'
  )
}

function instantiateReactComponent(node, shouldHaveDebugID) {
  var instance

  if (node === null || node === false) {
    instance = ReactEmptyComponent.create(instantiateReactComponent)
  } else if (typeof node === 'object') {
    var element = node
    var type = element.type

    if (typeof type === 'string') {
      instance = ReactHostComponent.createInternalComponent(element)
    } else if (isInternalComponentType(element.type)) {
      instance = new element.type(element)
    } else {
      instance = new ReactCompositeComponentWrapper(element)
    }
  } else if (typeof node === 'string' || typeof node === 'number') {
    instance = ReactHostComponent.createInstanceForText(node)
  } else {

  }

  instance._mountIndex = 0
  instance._mountImage = null

  
  return instance
}

Object.assign(
  ReactCompositeComponentWrapper.prototype,
  ReactCompositeComponent,
  {
    _instantiateReactComponent: instantiateReactComponent
  }
)

module.exports = instantiateReactComponent
