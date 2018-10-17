var SyntheticEvent = require('../../../shared/stack/event/SyntheticEvent')

/**
 * @interface Event
 * @see http://www.w3.org/TR/clipboard-apis/
 */
var ClipboardEventInterface = {
  clipboardData: function(event) {
    return 'clipboardData' in event ? event.clipboardData : window.clipboardData
  }
}

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticUIEvent}
 */
function SyntheticClipboardEvent(dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget) {
  return SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent, nativeEventTarget)
}

SyntheticEvent.augmentClass(SyntheticClipboardEvent, ClipboardEventInterface)

module.exports = SyntheticClipboardEvent
