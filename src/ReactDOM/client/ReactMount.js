// React将虚拟dom挂载到dom树的核心
var DOMLazyTree = require('../client/utils/DOMLazyTree')
var DOMproperty = require('../shared/DOMProperty')
var React = require('../../React/React')
var ReactDOMComponentTree = require('./ReactDOMComponentTree')
var ReactDOMContainerInfo = require('../shared/ReactDOMContainerInfo')
var ReactDOMFeatureFlags = require('../shared/ReactDOMFeatureFlags')
var ReactReconciler = require('../shared/recociler/ReactReconciler')
var ReactUpdateQueue = require('../shared/recociler/ReactUpdateQueue')
var ReactUpdates = require('../shared/recociler/ReactUpdates')

var instantiateReactComponent = require('../shared/recociler/instantiateReactComponent')
var setInnerHTML = require('../../utils/setInnerHTML')

var ATTR_NAME = DOMproperty.ID_ATTRIBUTE_NAME

var instancesByReactRootID = {}

function getReactRootElementInContainer(container) {
  if (!container) {
    return null
  }

  if (container.nodeType === 9) {
    return container.documentElement
  } else {
    return container.firstChild
  }
}

function internalGetID(node) {
  return (node.getAttribute && node.getAttribute(ATTR_NAME)) || ''
}

// 将组件挂载到节点上
function mountComponentIntoNode(
  wrapperInstance,
  container,
  transaction, 
  shouldReuseMarkup 
) {
  var markup = ReactReconciler.mountComponent(
    wrapperInstance,
    transaction,
    null,
    ReactDOMContainerInfo(wrapperInstance, container),
    0
  )

  wrapperInstance._renderedComponent._topLevelWrapper = wrapperInstance
  ReactMount._mountImageIntoNode(
    markup,
    container,
    wrapperInstance,
    shouldReuseMarkup,
    transaction
  )
}

// 批量将组件挂载至节点，调用mountComponentIntoNode方法
function batchedMountComponentIntoNode(
  componentInstance,
  container,
  shouldReuseMarkup
) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(
    !shouldReuseMarkup && ReactDOMFeatureFlags.useCreateElement,
  )
  transaction.perform(
    mountComponentIntoNode,
    null,
    componentInstance,
    container,
    transaction,
    shouldReuseMarkup
  )

  ReactUpdates.ReactReconcileTransaction.release(transaction)
}

function hasNonRootReactChild(container) {
  var rootEl = getReactRootElementInContainer(container)
  if (rootEl) {
    var inst = ReactDOMComponentTree.getInstanceFromNode(rootEl)
    return !!(inst && inst._hostParent)
  }
}

// question
var topLevelRootCounter = 1
var TopLevelWrapper = function() {
  this.rootID = topLevelRootCounter++
}
TopLevelWrapper.prototype.isReactComponent = {}
TopLevelWrapper.prototype.render = function() {
  return this.props.child
}
TopLevelWrapper.isReactTopLevelWrapper = true

var ReactMount = {
  TopLevelWrapper: TopLevelWrapper,

  // 渲染新的根节点组件，通过instantiateReactComponent将react元素变为不同的组件
  _renderNewRootComponent: function(
    nextElement,
    container,
    shouldReuseMarkup
  ) {
    var componentInstance = instantiateReactComponent(nextElement, false)

    ReactUpdates.batchedUpdates(
      batchedMountComponentIntoNode,
      componentInstance,
      container,
      shouldReuseMarkup
    )

    var wrapperID = componentInstance._instance.rootID
    instancesByReactRootID[wrapperID] = componentInstance

    return componentInstance
  },

  // 将子树写入Container，返回组件，调用_renderNewRootComponent方法渲染一个新的根组件
  _renderSubtreeIntoContainer: function(
    parentComponent,
    nextElement,
    container,
    callback
  ) {
    var nextWrappedElement = React.createElement(TopLevelWrapper, {
      child: nextElement
    })

    var prevComponent = getReactRootElementInContainer(container)

    
    var reactRootElement = getReactRootElementInContainer(container)
    var contanierHasReactMarkup =
      reactRootElement && !!internalGetID(reactRootElement)
    var containerHasNonRootReactChild = hasNonRootReactChild(container)
    
    var shouldReuseMarkup = 
      contanierHasReactMarkup &&
      !prevComponent &&
      !containerHasNonRootReactChild
      
    var component = ReactMount._renderNewRootComponent(
      nextWrappedElement,
      container,
      shouldReuseMarkup,
    )._renderedComponent


    if (callback) {
      callback.call(component)
    }
    return component
  },

  // render方法，本质是调用了_renderSubtreeIntoContainer
  render: function(nextElement, container, callback) {
    return ReactMount._renderSubtreeIntoContainer(
      null,
      nextElement,
      container,
      callback
    )
  },

  _mountImageIntoNode: function(
    markup,
    container,
    instance,
    shouldReuseMarkup,
    transaction
  ) {

    if (shouldReuseMarkup) {

    }
    
    if (transaction.useCreateElement) {
      while (container.lastChild) {
        container.removeChild(container.lastChild)
      }
      DOMLazyTree.insertTreeBefore(container, markup, null)
    } else {
      setInnerHTML(container, markup)
      ReactDOMComponentTree.precacheNode(instance, container.firstChild)
    }
  }
}

module.exports = ReactMount
