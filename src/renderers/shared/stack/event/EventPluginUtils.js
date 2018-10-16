var ReactErrorUtils = require('../../utils/ReactErrorUtils')

/**
 * 注入的依赖:
 */

/**
 * - `ComponentTree`: [required] 可以在React实例和真实节点引用中转换的模块
 */
var ComponentTree
var TreeTraversal
var injection = {
  injectComponentTree: function(Injected) {
    ComponentTree = Injected
  },
  injectTreeTraversal: function(Injected) {
    TreeTraversal = Injected
  }
}

function isEndish(topLevelType) {
  return topLevelType === 'topMouseUp' || topLevelType === 'topTouchEnd' || topLevelType === 'topTouchCancel'
}

function isMoveish(topLevelType) {
  return topLevelType === 'topMouseMove' || topLevelType === 'topTouchMove'
}

function isStartish(topLevelType) {
  return topLevelType === 'topMouseDown' || topLevelType === 'topTouchStart'
}

/**
 * 派发事件给监听者
 * @param {SyntheticEvent} event SyntheticEvent to handle
 * @param {boolean} simulated If the event is simulated (changes exn behavior)
 * @param {function} listener Application-level callback
 * @param {*} inst Internal component instance
 */
function executeDispatch(event, simulated, listener, inst) {
  var type = event.type || 'unknown-event'
  event.currentTarget = EventPluginUtils.getNodeFromInstance(inst)
  if (simulated) {
    ReactErrorUtils.invokeGuardedCallbackWithCatch(type, listener, event)
  } else {
    ReactErrorUtils.invokeGuardedCallback(type, listener, event)
  }
  event.currentTarget = null
}

/**
 * 通过事件收集的派发器进行的标准/简单迭代
 */
function executeDispatchesInOrder(event, simulated) {
  var dispatchListeners = event._dispatchListeners
  var dispatchInstances = event._dispatchInstances
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break
      }
      // 监听者和实例是永远同步的两个平行数组
      executeDispatch(event, simulated, dispatchListeners[i], dispatchInstances[i])
    }
  } else if (dispatchListeners) {
    executeDispatch(event, simulated, dispatchListeners, dispatchInstances)
  }
  event._dispatchListeners = null
  event._dispatchInstances = null
}

/**
 * 通过事件收集的派发器进行的标准/简单迭代，但是在第一个派发执行返回true时停止，并且返回该派发者的id
 *
 * @return {?string} id of the first dispatch execution who's listener returns
 * true, or null if no listener returned true.
 */
function executeDispatchesInOrderStopAtTrueImpl(event) {
  var dispatchListeners = event._dispatchListeners
  var dispatchInstances = event._dispatchInstances
  if (Array.isArray(dispatchListeners)) {
    for (var i = 0; i < dispatchListeners.length; i++) {
      if (event.isPropagationStopped()) {
        break
      }
      // Listeners and Instances are two parallel arrays that are always in sync.
      if (dispatchListeners[i](event, dispatchInstances[i])) {
        return dispatchInstances[i]
      }
    }
  } else if (dispatchListeners) {
    if (dispatchListeners(event, dispatchInstances)) {
      return dispatchInstances
    }
  }
  return null
}

/**
 * @see executeDispatchesInOrderStopAtTrueImpl
 */
function executeDispatchesInOrderStopAtTrue(event) {
  var ret = executeDispatchesInOrderStopAtTrueImpl(event)
  event._dispatchInstances = null
  event._dispatchListeners = null
  return ret
}

/**
 * 一个'直接'的派发执行 - 事件上最多只能有一次派发的累计，否则会被视为错误。
 * 对于一个具有多个派发器的(冒泡)事件而言，追踪每个派发器执行的返回值并不是真的有意义，
 * 但是处理'直接'派发时确实有意义
 *
 * @return {*} The return value of executing the single dispatch.
 */
function executeDirectDispatch(event) {
  var dispatchListener = event._dispatchListeners
  var dispatchInstance = event._dispatchInstances
  event.currentTarget = dispatchListener ? EventPluginUtils.getNodeFromInstance(dispatchInstance) : null
  var res = dispatchListener ? dispatchListener(event) : null
  event.currentTarget = null
  event._dispatchListeners = null
  event._dispatchInstances = null
  return res
}

/**
 * @param {SyntheticEvent} event
 * @return {boolean} True if number of dispatches accumulated is greater than 0.
 */
function hasDispatches(event) {
  return !!event._dispatchListeners
}

/**
 * 创建自定义事件插件时很有用的常规工具
 */
var EventPluginUtils = {
  isEndish: isEndish,
  isMoveish: isMoveish,
  isStartish: isStartish,

  executeDirectDispatch: executeDirectDispatch,
  executeDispatchesInOrder: executeDispatchesInOrder,
  executeDispatchesInOrderStopAtTrue: executeDispatchesInOrderStopAtTrue,
  hasDispatches: hasDispatches,

  getInstanceFromNode: function(node) {
    return ComponentTree.getInstanceFromNode(node)
  },
  getNodeFromInstance: function(node) {
    return ComponentTree.getNodeFromInstance(node)
  },
  isAncestor: function(a, b) {
    return TreeTraversal.isAncestor(a, b)
  },
  getLowestCommonAncestor: function(a, b) {
    return TreeTraversal.getLowestCommonAncestor(a, b)
  },
  getParentInstance: function(inst) {
    return TreeTraversal.getParentInstance(inst)
  },
  traverseTwoPhase: function(target, fn, arg) {
    return TreeTraversal.traverseTwoPhase(target, fn, arg)
  },
  traverseEnterLeave: function(from, to, fn, argFrom, argTo) {
    return TreeTraversal.traverseEnterLeave(from, to, fn, argFrom, argTo)
  },

  injection: injection
}

module.exports = EventPluginUtils
