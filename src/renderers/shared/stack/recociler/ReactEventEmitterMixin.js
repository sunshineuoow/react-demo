var EventPluginHub = require('../event/EventPluginHub')

function runEventQueueInBatch(events) {
  EventPluginHub.enqueueEvents(events)
  EventPluginHub.processEventQueue(false)
}

var ReactEventEmitterMixin = {
  /**
   * 将一个触发的顶级事件传递给`EventPluginHub`，其中插件有机会创建要派发的`ReactEvent`
   */
  handleTopLevel: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var events = EventPluginHub.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget)
    runEventQueueInBatch(events)
  }
}

module.exports = ReactEventEmitterMixin
