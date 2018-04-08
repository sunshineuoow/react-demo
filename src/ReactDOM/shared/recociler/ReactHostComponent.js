var genericComponentClass = null
var textComponentClass = null

var ReactHostComponentInjection = {
  injectGenericComponentClass: function(componentClass) {
    genericComponentClass = componentClass
  },
  injectTextComponentClass: function(componentClass) {
    textComponentClass = componentClass
  }
}

function createInternalComponent(element) {
  return new genericComponentClass(element)
}

function createInstanceForText(text) {
  return new textComponentClass(text)
}

function isTextComponent(component) {
  return component instanceof textComponentClass
}

var ReactHostComponent = {
  createInternalComponent: createInternalComponent,
  createInstanceForText: createInstanceForText,
  isTextComponent: isTextComponent,
  injection: ReactHostComponentInjection
}

module.exports = ReactHostComponent
