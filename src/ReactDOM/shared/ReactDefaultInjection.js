var ReactDOMComponent = require('./ReactDOMComponent')
var ReactDOMEmptyComponent = require('./ReactDOMEmptyComponent')
var ReactDOMTextComponent = require('./ReactDOMTextComponent')
var ReactInjection = require('./ReactInjection')

var alreadyInjected = false

function inject() {
  if (alreadyInjected) {
    return
  }
  alreadyInjected = true

  ReactInjection.HostComponent.injectGenericComponentClass(ReactDOMComponent)

  ReactInjection.HostComponent.injectTextComponentClass(ReactDOMTextComponent)

  ReactInjection.EmptyComponent.injectEmptyComponentFactory(function(
    instantiate
  ) {
    return new ReactDOMEmptyComponent(instantiate)
  })
}


module.exports = {
  inject: inject
}
