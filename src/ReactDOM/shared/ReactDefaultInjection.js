
var ReactComponentBrowserEnvironment = require('./ReactComponentBrowserEnvironment')
var ReactDOMComponent = require('./ReactDOMComponent')
var ReactDOMEmptyComponent = require('./ReactDOMEmptyComponent')
var ReactDOMTextComponent = require('./ReactDOMTextComponent')
var ReactDefaultBatchingStrategy = require('./recociler/ReactDefaultBatchingStrategy')
var ReactInjection = require('./ReactInjection')
var ReactReconcileTransaction = require('../client/ReactReconcileTransaction')

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

  ReactInjection.Updates.injectReconcileTransaction(ReactReconcileTransaction)
  ReactInjection.Updates.injectBatchingStrategy(ReactDefaultBatchingStrategy)

  ReactInjection.Component.injectEnvironment(ReactComponentBrowserEnvironment)
}


module.exports = {
  inject: inject
}
