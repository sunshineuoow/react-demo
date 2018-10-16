/**
 * 通过计算浏览器DOM API的不一致性，从原生浏览器事件中获取目标节点
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */
function getEventTarget(nativeEvent) {
  var target = nativeEvent.target || nativeEvent.srcElement || window

  // Normalize SVG <use> element events #4963
  if (target.correspondingUseElement) {
    target = target.correspondingUseElement
  }

  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === 3 ? target.parentNode : target
}

module.exports = getEventTarget
