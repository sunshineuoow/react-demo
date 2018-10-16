/**
 * 从修饰键转换为事件中的关联属性
 * @see http://www.w3.org/TR/DOM-Level-3-Events/#keys-Modifiers
 */

var modifierKeyToProp = {
  Alt: 'altKey',
  Control: 'ctrlKey',
  Meta: 'metaKey',
  Shift: 'shiftKey'
}

// IE8 does not implement getModifierState so we simply map it to the only
// modifier keys exposed by the event itself, does not support Lock-keys.
// Currently, all major browsers except Chrome seems to support Lock-keys.
function modifierStateGetter(keyArg) {
  var syntheticEvent = this
  var nativeEvent = syntheticEvent.nativeEvent
  if (nativeEvent.getModifierState) {
    return nativeEvent.getModifierState(keyArg)
  }
  var keyProp = modifierKeyToProp[keyArg]
  return keyProp ? !!nativeEvent[keyProp] : false
}

function getEventModifierState(nativeEvent) {
  return modifierStateGetter
}

module.exports = getEventModifierState
