var EventPluginRegistry = require('./EventPluginRegistry')
var EventPluginUtils = require('./EventPluginUtils')
var ReactErrorUtils = require('../../utils/ReactErrorUtils')

var accumulateInto = require('../../utils/accumulateInto')
var forEachAccumulated = require('../../utils/forEachAccumulated')

/**
 * 事件监听者的内部存储
 */
var listenerBank = {}

/**
 * 已经累计派发者并且等待其执行的事件队列
 */
var eventQueue = null

/**
 * 除非持久化，否则派发事件并且将其释放回池中
 *
 * @param {?object} event Synthetic event to be dispatched.
 * @param {boolean} simulated If the event is simulated (changes exn behavior)
 * @private
 */
var executeDispatchesAndRelease = function(event, simulated) {
  if (event) {
    EventPluginUtils.executeDispatchesInOrder(event, simulated)

    if (!event.isPersistent()) {
      event.constructor.release(event)
    }
  }
}
var executeDispatchesAndReleaseSimulated = function(e) {
  return executeDispatchesAndRelease(e, true)
}
var executeDispatchesAndReleaseTopLevel = function(e) {
  return executeDispatchesAndRelease(e, false)
}

var getDictionaryKey = function(inst) {
  // Prevents V8 performance issue:
  // https://github.com/facebook/react/pull/7232
  return '.' + inst._rootNodeID
}

function isInteractive(tag) {
  return tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea'
}

function shouldPreventMouseEvent(name, type, props) {
  switch (name) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
      return !!(props.disabled && isInteractive(type))
    default:
      return false
  }
}

/**
 * 这是用于安装和配置事件插件的统一接口
 *
 * 事件插件实现以下特性：
 *
 *   `extractEvents` {function(string, DOMEventTarget, string, object): *}
 *    必需。当顶级事件触发时，这个方法应当提取将依次入队和派发的合成事件
 *
 *   `eventTypes` {object}
 *    可选，触发事件的插件必需发布一个用于注册监听者的注册名映射。
 *    映射的值必须是包含`registrationName`或者`phasedRegistrationNames`的对象
 *
 *   `executeDispatch` {function(object, function, string)}、
 *    可选，允许插件覆盖事件的派发方式。默认情况下，监听者只是简单被调用
 *
 * 注入`EventsPluginHub`的每个插件都可以立即操作
 *
 * @public
 */
var EventPluginHub = {
  /**
   * 注入依赖的方法
   */
  injection: {
    /**
     * @param {array} InjectedEventPluginOrder
     * @public
     */
    injectEventPluginOrder: EventPluginRegistry.injectEventPluginOrder,

    /**
     * @param {object} injectedNamesToPlugins Map from names to plugin modules.
     */
    injectEventPluginsByName: EventPluginRegistry.injectEventPluginsByName
  },

  /**
   * 在`listenderBank[registrationName][key]`存储`listender`。是幂等的
   *
   * @param {object} inst The instance, which is the source of events.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @param {function} listener The callback to store.
   */
  putListener: function(inst, registrationName, listener) {
    var key = getDictionaryKey(inst)
    var bankForRegistrationName = listenerBank[registrationName] || (listenerBank[registrationName] = {})
    bankForRegistrationName[key] = listener

    var PluginModule = EventPluginRegistry.registrationNameModules[registrationName]
    if (PluginModule && PluginModule.didPutListener) {
      PluginModule.didPutListener(inst, registrationName, listener)
    }
  },

  /**
   * @param {object} inst The instance, which is the source of events.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   * @return {?function} The stored callback.
   */
  getListener: function(inst, registrationName) {
    // TODO: shouldPreventMouseEvent is DOM-specific and definitely should not
    // live here; needs to be moved to a better place soon
    var bankForRegistrationName = listenerBank[registrationName]
    if (shouldPreventMouseEvent(registrationName, inst._currentElement.type, inst._currentElement.props)) {
      return null
    }
    var key = getDictionaryKey(inst)
    return bankForRegistrationName && bankForRegistrationName[key]
  },

  /**
   * Deletes a listener from the registration bank.
   *
   * @param {object} inst The instance, which is the source of events.
   * @param {string} registrationName Name of listener (e.g. `onClick`).
   */
  deleteListener: function(inst, registrationName) {
    var PluginModule = EventPluginRegistry.registrationNameModules[registrationName]
    if (PluginModule && PluginModule.willDeleteListener) {
      PluginModule.willDeleteListener(inst, registrationName)
    }

    var bankForRegistrationName = listenerBank[registrationName]
    // TODO: This should never be null -- when is it?
    if (bankForRegistrationName) {
      var key = getDictionaryKey(inst)
      delete bankForRegistrationName[key]
    }
  },

  /**
   * 使用提供的ID删除DOM元素所有的监听者
   *
   * @param {object} inst The instance, which is the source of events.
   */
  deleteAllListeners: function(inst) {
    var key = getDictionaryKey(inst)
    for (var registrationName in listenerBank) {
      if (!listenerBank.hasOwnProperty(registrationName)) {
        continue
      }

      if (!listenerBank[registrationName][key]) {
        continue
      }

      var PluginModule = EventPluginRegistry.registrationNameModules[registrationName]
      if (PluginModule && PluginModule.willDeleteListener) {
        PluginModule.willDeleteListener(inst, registrationName)
      }

      delete listenerBank[registrationName][key]
    }
  },

  /**
   * 允许注册的插件从顶级原生浏览器事件中提取事件
   *
   * @return {*} An accumulation of synthetic events.
   * @internal
   */
  extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var events
    var plugins = EventPluginRegistry.plugins

    for (var i = 0; i < plugins.length; i++) {
      // Not every plugin in the ordering may be loaded at runtime.
      var possiblePlugin = plugins[i]
      if (possiblePlugin) {
        var extractedEvents = possiblePlugin.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget)
        if (extractedEvents) {
          events = accumulateInto(events, extractedEvents)
        }
      }
    }
    return events
  },

  /**
   * 入队一个当`processEventQueue`调用时应当派发的合成事件
   *
   * @param {*} events An accumulation of synthetic events.
   * @internal
   */
  enqueueEvents: function(events) {
    if (events) {
      eventQueue = accumulateInto(eventQueue, events)
    }
  },

  /**
   * 派发事件队列上所有的合成事件
   *
   * @internal
   */
  processEventQueue: function(simulated) {
    // Set `eventQueue` to null before processing it so that we can tell if more
    // events get enqueued while processing.
    var processingEventQueue = eventQueue
    eventQueue = null
    if (simulated) {
      forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseSimulated)
    } else {
      forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel)
    }
    // This would be a good time to rethrow if any of the event handlers threw.
    ReactErrorUtils.rethrowCaughtError()
  }
}

module.exports = EventPluginHub
