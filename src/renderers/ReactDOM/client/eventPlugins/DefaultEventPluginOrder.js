/**
 * 注入到`EventPluginHub`的模块，指定了`EventPlugin`的确定性排序。
 * 一个便捷的方法来无需打包每个插件即可推断插件。
 * 这比插件按照它们注入的顺序排序要好，因为排序会受到包装顺序的影响。
 * `ResoonderEventPlugin`必须在`SimpleEventPlugin`之前发生，
 * 以便`SimpleEventPlugin`处理函数中阻止默认事件。
 */
var DefaultEventPluginOrder = [
  'ResponderEventPlugin',
  'SimpleEventPlugin',
  'TapEventPlugin',
  'EnterLeaveEventPlugin',
  'ChangeEventPlugin',
  'SelectEventPlugin',
  'BeforeInputEventPlugin',
]

module.exports = DefaultEventPluginOrder