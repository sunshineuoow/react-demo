// React将虚拟dom挂载到dom树的核心

var React = require('../../React/React')
var ReactDOMContainerInfo = require('../shared/ReactDOMContainerInfo')
var ReactReconciler = require('../shared/recociler/ReactReconciler')
var instantiateReactComponent = require('../shared/recociler/instantiateReactComponent')
var setInnerHTML = require('../../utils/setInnerHTML')

var instancesByReactRootID = {}

// 将组件挂载到节点上
function mountComponentIntoNode(
  wrapperInstance,
  container,
) {
  var markup = ReactReconciler.mountComponent(
    wrapperInstance,
    null,
    ReactDOMContainerInfo(wrapperInstance, container),
    0
  )

  wrapperInstance._renderedComponent._topLevelWrapper = wrapperInstance
  ReactMount._mountImageIntoNode(
    markup,
    container,
    wrapperInstance,
  )
}

// 批量将组件挂载至节点，调用mountComponentIntoNode方法
function batchedMountComponentIntoNode(
  componentInstance,
  container,
) {
  mountComponentIntoNode(componentInstance, container)
}

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
  ) {
    var componentInstance = instantiateReactComponent(nextElement, false)

    console.log(componentInstance, 'react Mount')


    batchedMountComponentIntoNode(componentInstance, container)

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
    var component = ReactMount._renderNewRootComponent(
      nextWrappedElement,
      container
    )


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
    container
  ) {
    setInnerHTML(container, markup)
  }
}

module.exports = ReactMount
