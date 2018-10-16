
var DefaultEventPluginOrder = require('../client/eventPlugins/DefaultEventPluginOrder')
var ReactComponentBrowserEnvironment = require('./ReactComponentBrowserEnvironment')
var ReactDOMComponent = require('./ReactDOMComponent')
var ReactDOMComponentTree = require('../client/ReactDOMComponentTree')
var ReactDOMEmptyComponent = require('./ReactDOMEmptyComponent')
var ReactDOMTreeTraversal = require('../client/ReactDOMTreeTraversal')
var ReactDOMTextComponent = require('./ReactDOMTextComponent')
var ReactDefaultBatchingStrategy = require('../../shared/stack/recociler/ReactDefaultBatchingStrategy')
var ReactEventListener = require('../client/ReactEventListener')
var ReactInjection = require('./ReactInjection')
var ReactReconcileTransaction = require('../client/ReactReconcileTransaction')
var SimpleEventPlugin = require('../client/eventPlugins/SimpleEventPlugin')

var alreadyInjected = false

function inject() {
  if (alreadyInjected) {
    return
  }
  alreadyInjected = true

  ReactInjection.EventEmitter.injectReactEventListener(ReactEventListener)

  /**
   * 注入模块解决DOM层次结构和插件排序
   */
  ReactInjection.EventPluginHub.injectEventPluginOrder(DefaultEventPluginOrder)
  ReactInjection.EventPluginUtils.injectComponentTree(ReactDOMComponentTree)
  ReactInjection.EventPluginUtils.injectTreeTraversal(ReactDOMTreeTraversal)

  /**
   * Some important event plugins included by default (without having to require
   * them).
   */
  ReactInjection.EventPluginHub.injectEventPluginsByName({
    SimpleEventPlugin: SimpleEventPlugin
  })

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
