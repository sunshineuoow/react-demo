var ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment')

/**
 * 使用定义的样式属性生成标准的供应前缀和事件名称的映射
 * Generate a mapping of standard vendor prefixes using the defined style property and event name.
 *
 * @param {string} styleProp
 * @param {string} eventName
 * @returns {object}
 */
function makePrefixMap(styleProp, eventName) {
  var prefixes = {}

  prefixes[styleProp.toLowerCase()] = eventName.toLowerCase()
  prefixes['Webkit' + styleProp] = 'webkit' + eventName
  prefixes['Moz' + styleProp] = 'moz' + eventName
  prefixes['ms' + styleProp] = 'MS' + eventName
  prefixes['O' + styleProp] = 'o' + eventName.toLowerCase()

  return prefixes
}

/**
 * 可配置的供应商前缀列表中的事件名称列表
 */
var vendorPrefixes = {
  animationend: makePrefixMap('Animation', 'AnimationEnd'),
  animationiteration: makePrefixMap('Animation', 'AnimationIteration'),
  animationstart: makePrefixMap('Animation', 'AnimationStart'),
  transitionend: makePrefixMap('Transition', 'TransitionEnd')
}

/**
 * 已检测并且添加了前缀的事件名称(如果可用)
 */
var prefixedEventNames = {}

/**
 * 用于检查前缀的元素
 */
var style = {}

/**
 * 如果DOM存在
 */
if (ExecutionEnvironment.canUseDOM) {
  style = document.createElement('div').style

  // On some platforms, in particular some releases of Android 4.x,
  // the un-prefixed "animation" and "transition" properties are defined on the
  // style object but the events that fire will still be prefixed, so we need
  // to check if the un-prefixed events are usable, and if not remove them from the map.
  if (!('AnimationEvent' in window)) {
    delete vendorPrefixes.animationend.animation
    delete vendorPrefixes.animationiteration.animation
    delete vendorPrefixes.animationstart.animation
  }

  // Same as above
  if (!('TransitionEvent' in window)) {
    delete vendorPrefixes.transitionend.transition
  }
}

/**
 * 尝试确定正确地供应商前缀事件名称。
 *
 * @param {string} eventName
 * @returns {string}
 */
function getVendorPrefixedEventName(eventName) {
  if (prefixedEventNames[eventName]) {
    return prefixedEventNames[eventName]
  } else if (!vendorPrefixes[eventName]) {
    return eventName
  }

  var prefixMap = vendorPrefixes[eventName]

  for (var styleProp in prefixMap) {
    if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) {
      return (prefixedEventNames[eventName] = prefixMap[styleProp])
    }
  }

  return ''
}

module.exports = getVendorPrefixedEventName
