var EventListener = require('fbjs/lib/EventListener')
var EventPropagators = require('../../../shared/stack/event/EventPropagators')
var ReactDOMComponentTree = require('../ReactDOMComponentTree')
var SyntheticAnimationEvent = require('../syntheticEvents/SyntheticAnimationEvent')
var SyntheticClipboardEvent = require('../syntheticEvents/SyntheticClipboardEvent')
var SyntheticEvent = require('../../../shared/stack/event/SyntheticEvent')
var SyntheticFocusEvent = require('../syntheticEvents/SyntheticFocusEvent')
var SyntheticMouseEvent = require('../syntheticEvents/SyntheticMouseEvent')
var SyntheticDragEvent = require('../syntheticEvents/SyntheticDragEvent')
var SyntheticTouchEvent = require('../syntheticEvents/SyntheticTouchEvent')
var SyntheticTransitionEvent = require('../syntheticEvents/SyntheticTransactionEvent')
var SyntheticUIEvent = require('../syntheticEvents/SyntheticUIEvent')
var SyntheticWheelEvent = require('../syntheticEvents/SyntheticWheelEvent')

var emptyFunction = require('fbjs/lib/emptyFunction')


/**
 * 将
 * ['abort', ...]
 * 转换为为
 * eventTypes = {
 *   'abort': {
 *     phasedRegistrationNames: {
 *       bubbled: 'onAbort',
 *       captured: 'onAbortCapture',
 *     },
 *     dependencies: ['topAbort'],
 *   },
 *   ...
 * };
 * topLevelEventsToDispatchConfig = {
 *   'topAbort': { sameConfig }
 * };
 */
var eventTypes = {}
var topLevelEventsToDispatchConfig = {}
var arr = [
  'abort',
  'animationEnd',
  'animationIteration',
  'animationStart',
  'blur',
  'canPlay',
  'canPlayThrough',
  'click',
  'contextMenu',
  'copy',
  'cut',
  'doubleClick',
  'drag',
  'dragEnd',
  'dragEnter',
  'dragExit',
  'dragLeave',
  'dragOver',
  'dragStart',
  'drop',
  'durationChange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'focus',
  'input',
  'invalid',
  'keyDown',
  'keyPress',
  'keyUp',
  'load',
  'loadedData',
  'loadedMetadata',
  'loadStart',
  'mouseDown',
  'mouseMove',
  'mouseOut',
  'mouseOver',
  'mouseUp',
  'paste',
  'pause',
  'play',
  'playing',
  'progress',
  'rateChange',
  'reset',
  'scroll',
  'seeked',
  'seeking',
  'stalled',
  'submit',
  'suspend',
  'timeUpdate',
  'touchCancel',
  'touchEnd',
  'touchMove',
  'touchStart',
  'transitionEnd',
  'volumeChange',
  'waiting',
  'wheel'
]
arr.forEach(event => {
  var capitalizedEvent = event[0].toUpperCase() + event.slice(1)
  var onEvent = 'on' + capitalizedEvent
  var topEvent = 'top' + capitalizedEvent

  var type = {
    phasedRegistrationNames: {
      bubbled: onEvent,
      captured: onEvent + 'Capture'
    },
    dependencies: [topEvent]
  }
  eventTypes[event] = type
  topLevelEventsToDispatchConfig[topEvent] = type
})

var onClickListeners = {}

function getDictionaryKey(inst) {
  // Prevents V8 performance issue:
  // https://github.com/facebook/react/pull/7232
  return '.' + inst._rootNodeID
}

function isInteractive(tag) {
  return tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea'
}

var SimpleEventPlugin = {
  eventTypes: eventTypes,

  extractEvents: function(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType]
    if (!dispatchConfig) {
      return null
    }
    switch (topLevelType) {
      case 'topAbort':
      case 'topCanPlay':
      case 'topCanPlayThrough':
      case 'topDurationChange':
      case 'topEmptied':
      case 'topEncrypted':
      case 'topEnded':
      case 'topError':
      case 'topInput':
      case 'topInvalid':
      case 'topLoad':
      case 'topLoadedData':
      case 'topLoadedMetadata':
      case 'topLoadStart':
      case 'topPause':
      case 'topPlay':
      case 'topPlaying':
      case 'topProgress':
      case 'topRateChange':
      case 'topReset':
      case 'topSeeked':
      case 'topSeeking':
      case 'topStalled':
      case 'topSubmit':
      case 'topSuspend':
      case 'topTimeUpdate':
      case 'topVolumeChange':
      case 'topWaiting':
        // HTML Events
        // @see http://www.w3.org/TR/html5/index.html#events-0
        EventConstructor = SyntheticEvent
        break
      case 'topKeyPress':
        // Firefox creates a keypress event for function keys too. This removes
        // the unwanted keypress events. Enter is however both printable and
        // non-printable. One would expect Tab to be as well (but it isn't).
        if (getEventCharCode(nativeEvent) === 0) {
          return null
        }
      /* falls through */
      case 'topKeyDown':
      case 'topKeyUp':
        EventConstructor = SyntheticKeyboardEvent
        break
      case 'topBlur':
      case 'topFocus':
        EventConstructor = SyntheticFocusEvent
        break
      case 'topClick':
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        if (nativeEvent.button === 2) {
          return null
        }
      /* falls through */
      case 'topDoubleClick':
      case 'topMouseDown':
      case 'topMouseMove':
      case 'topMouseUp':
      // TODO: Disabled elements should not respond to mouse events
      /* falls through */
      case 'topMouseOut':
      case 'topMouseOver':
      case 'topContextMenu':
        EventConstructor = SyntheticMouseEvent
        break
      case 'topDrag':
      case 'topDragEnd':
      case 'topDragEnter':
      case 'topDragExit':
      case 'topDragLeave':
      case 'topDragOver':
      case 'topDragStart':
      case 'topDrop':
        EventConstructor = SyntheticDragEvent
        break
      case 'topTouchCancel':
      case 'topTouchEnd':
      case 'topTouchMove':
      case 'topTouchStart':
        EventConstructor = SyntheticTouchEvent
        break
      case 'topAnimationEnd':
      case 'topAnimationIteration':
      case 'topAnimationStart':
        EventConstructor = SyntheticAnimationEvent
        break
      case 'topTransitionEnd':
        EventConstructor = SyntheticTransitionEvent
        break
      case 'topScroll':
        EventConstructor = SyntheticUIEvent
        break
      case 'topWheel':
        EventConstructor = SyntheticWheelEvent
        break
      case 'topCopy':
      case 'topCut':
      case 'topPaste':
        EventConstructor = SyntheticClipboardEvent
        break
    }

    var event = EventConstructor.getPooled(dispatchConfig, targetInst, nativeEvent, nativeEventTarget)
    EventPropagators.accumulateTwoPhaseDispatches(event)
    return event
  },

  didPutListener: function(inst, registrationName, listener) {
    // Mobile Safari does not fire properly bubble click events on
    // non-interactive elements, which means delegated click listeners do not
    // fire. The workaround for this bug involves attaching an empty click
    // listener on the target node.
    // http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
    if (registrationName === 'onClick' && !isInteractive(inst._tag)) {
      var key = getDictionaryKey(inst)
      var node = ReactDOMComponentTree.getNodeFromInstance(inst)
      if (!onClickListeners[key]) {
        onClickListeners[key] = EventListener.listen(node, 'click', emptyFunction)
      }
    }
  },

  willDeleteListener: function(inst, registrationName) {
    if (registrationName === 'onClick' && !isInteractive(inst._tag)) {
      var key = getDictionaryKey(inst)
      onClickListeners[key].remove()
      delete onClickListeners[key]
    }
  }
}

module.exports = SimpleEventPlugin