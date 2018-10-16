var EventListener = require('fbjs/lib/EventListener')
var ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment')
var PooledClass = require('../../../utils/PooledClass')
var ReactDOMComponentTree = require('./ReactDOMComponentTree')
var ReactUpdates = require('../../shared/stack/recociler/ReactUpdates')

var getEventTarget = require('./utils/getEventTarget')
var getUnboundedScrollPosition = require('fbjs/lib/getUnboundedScrollPosition')

/**
 * 找到完全包含传入实例的根节点的React组件(用于整个React树彼此嵌套时使用)。
 * 如果React树没有嵌套，而返回null
 */
function findParent(inst) {
  // TODO: It may be a good idea to cache this to prevent unnecessary DOM
  // traversal, but caching is difficult to do correctly without using a
  // mutation observer to listen for all DOM changes.
  while (inst._hostParent) {
    inst = inst._hostParent
  }
  var rootNode = ReactDOMComponentTree.getNodeFromInstance(inst)
  var container = rootNode.parentNode
  return ReactDOMComponentTree.getClosestInstanceFromNode(container)
}

// 用于在顶级回调中存储祖先层次结构
function TopLevelCallbackBookKeeping(topLevelType, nativeEvent) {
  this.topLevelType = topLevelType
  this.nativeEvent = nativeEvent
  this.ancestors = []
}
Object.assign(TopLevelCallbackBookKeeping.prototype, {
  destructor: function() {
    this.topLevelType = null
    this.nativeEvent = null
    this.ancestors.length = 0
  }
})
PooledClass.addPoolingTo(TopLevelCallbackBookKeeping, PooledClass.twoArgumentPooler)

function handleTopLevelImpl(bookKeeping) {
  var nativeEventTarget = getEventTarget(bookKeeping.nativeEvent)
  var targetInst = ReactDOMComponentTree.getClosestInstanceFromNode(nativeEventTarget)

  // Loop through the hierarchy, in case there's any nested components.
  // It's important that we build the array of ancestors before calling any
  // event handlers, because event handlers can modify the DOM, leading to
  // inconsistencies with ReactMount's node cache. See #1105.
  var ancestor = targetInst
  do {
    bookKeeping.ancestors.push(ancestor)
    ancestor = ancestor && findParent(ancestor)
  } while (ancestor)

  for (var i = 0; i < bookKeeping.ancestors.length; i++) {
    targetInst = bookKeeping.ancestors[i]
    ReactEventListener._handleTopLevel(
      bookKeeping.topLevelType,
      targetInst,
      bookKeeping.nativeEvent,
      getEventTarget(bookKeeping.nativeEvent)
    )
  }
}

function scrollValueMonitor(cb) {
  var scrollPosition = getUnboundedScrollPosition(window)
  cb(scrollPosition)
}

var ReactEventListener = {
  _enabled: true,
  _handleTopLevel: null,

  WINDOW_HANDLE: ExecutionEnvironment.canUseDOM ? window : null,

  setHandleTopLevel: function(handleTopLevel) {
    ReactEventListener._handleTopLevel = handleTopLevel
  },

  setEnabled: function(enabled) {
    ReactEventListener._enabled = !!enabled
  },

  isEnabled: function() {
    return ReactEventListener._enabled
  },

  /**
   * 通过事件冒泡捕获顶级事件
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {object} element Element on which to attach listener.
   * @return {?object} An object with a remove function which will forcefully
   *                  remove the listener.
   * @internal
   */
  trapBubbledEvent: function(topLevelType, handlerBaseName, element) {
    if (!element) {
      return null
    }
    return EventListener.listen(element, handlerBaseName, ReactEventListener.dispatchEvent.bind(null, topLevelType))
  },

  /**
   * 通过事件捕获捕获顶级事件
   *
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {string} handlerBaseName Event name (e.g. "click").
   * @param {object} element Element on which to attach listener.
   * @return {?object} An object with a remove function which will forcefully
   *                  remove the listener.
   * @internal
   */
  trapCapturedEvent: function(topLevelType, handlerBaseName, element) {
    if (!element) {
      return null
    }
    return EventListener.capture(element, handlerBaseName, ReactEventListener.dispatchEvent.bind(null, topLevelType))
  },

  monitorScrollValue: function(refresh) {
    var callback = scrollValueMonitor.bind(null, refresh)
    EventListener.listen(window, 'scroll', callback)
  },

  dispatchEvent: function(topLevelType, nativeEvent) {
    if (!ReactEventListener._enabled) {
      return
    }

    var bookKeeping = TopLevelCallbackBookKeeping.getPooled(topLevelType, nativeEvent)
    try {
      // Event queue being processed in the same cycle allows
      // `preventDefault`.
      ReactUpdates.batchedUpdates(handleTopLevelImpl, bookKeeping)
    } finally {
      TopLevelCallbackBookKeeping.release(bookKeeping)
    }
  }
}

module.exports = ReactEventListener