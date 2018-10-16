var EventPluginRegistry = require('../../shared/stack/event/EventPluginRegistry')
var ReactEventEmitterMixin = require('../../shared/stack/recociler/ReactEventEmitterMixin')

var getVendorPrefixedEventName = require('./utils/getVendorPrefixedEventName')

/**
 * `ReactBrowserEventEmitter`事件处理简介:
 *
 *  - 顶级委派用于捕获绝大部分原生浏览器事件。这仅仅发生在主线程中，并且是ReactEventListener的责任，
 *    ReactEventListener是被注入的并且因此可以支持可插入的事件源。这是主线程中唯一执行的工作。
 *
 *  - 我们对事件进行规范化和删除重复数据，用于解决浏览器的怪癖问题。这可以在工作线程中完成。
 *
 *  - 将这些原生事件(以及用于捕获他的顶级类型)转发到`EventPluginHub`，如果它们想要提取任何合成事件，它们将询问插件
 *
 *  - `EventPluginHub`然后将通过使用`dispatches`注释它们来处理每个事件，`dispatches`指的是一系列该事件的监听者和ID
 *
 *  - `EventPluginHub`然后派发事件
 *
 * React和事件系统的概览:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | ReactEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |  w   +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */

var hasEventPageXY
var alreadyListeningTo = {}
var isMonitoringScrollValue = false
var reactTopListenersCounter = 0

// 对于像`submit`这种不会持续冒泡的事件(我们在`document`节点更低的节点捕获)
// 在`document`绑定将导致重复事件，因此我们不在此处包含它们
var topEventMapping = {
  topAbort: 'abort',
  topAnimationEnd: getVendorPrefixedEventName('animationend') || 'animationend',
  topAnimationIteration: getVendorPrefixedEventName('animationiteration') || 'animationiteration',
  topAnimationStart: getVendorPrefixedEventName('animationstart') || 'animationstart',
  topBlur: 'blur',
  topCanPlay: 'canplay',
  topCanPlayThrough: 'canplaythrough',
  topChange: 'change',
  topClick: 'click',
  topCompositionEnd: 'compositionend',
  topCompositionStart: 'compositionstart',
  topCompositionUpdate: 'compositionupdate',
  topContextMenu: 'contextmenu',
  topCopy: 'copy',
  topCut: 'cut',
  topDoubleClick: 'dblclick',
  topDrag: 'drag',
  topDragEnd: 'dragend',
  topDragEnter: 'dragenter',
  topDragExit: 'dragexit',
  topDragLeave: 'dragleave',
  topDragOver: 'dragover',
  topDragStart: 'dragstart',
  topDrop: 'drop',
  topDurationChange: 'durationchange',
  topEmptied: 'emptied',
  topEncrypted: 'encrypted',
  topEnded: 'ended',
  topError: 'error',
  topFocus: 'focus',
  topInput: 'input',
  topKeyDown: 'keydown',
  topKeyPress: 'keypress',
  topKeyUp: 'keyup',
  topLoadedData: 'loadeddata',
  topLoadedMetadata: 'loadedmetadata',
  topLoadStart: 'loadstart',
  topMouseDown: 'mousedown',
  topMouseMove: 'mousemove',
  topMouseOut: 'mouseout',
  topMouseOver: 'mouseover',
  topMouseUp: 'mouseup',
  topPaste: 'paste',
  topPause: 'pause',
  topPlay: 'play',
  topPlaying: 'playing',
  topProgress: 'progress',
  topRateChange: 'ratechange',
  topScroll: 'scroll',
  topSeeked: 'seeked',
  topSeeking: 'seeking',
  topSelectionChange: 'selectionchange',
  topStalled: 'stalled',
  topSuspend: 'suspend',
  topTextInput: 'textInput',
  topTimeUpdate: 'timeupdate',
  topTouchCancel: 'touchcancel',
  topTouchEnd: 'touchend',
  topTouchMove: 'touchmove',
  topTouchStart: 'touchstart',
  topTransitionEnd: getVendorPrefixedEventName('transitionend') || 'transitionend',
  topVolumeChange: 'volumechange',
  topWaiting: 'waiting',
  topWheel: 'wheel'
}

/**
 * 确保不与页面上其他可能的React实例冲突
 */
var topListenersIDKey = '_reactListenersID' + String(Math.random()).slice(2)

function getListeningForDocument(mountAt) {
  // In IE8, `mountAt` is a host object and doesn't have `hasOwnProperty`
  // directly.
  if (!Object.prototype.hasOwnProperty.call(mountAt, topListenersIDKey)) {
    mountAt[topListenersIDKey] = reactTopListenersCounter++
    alreadyListeningTo[mountAt[topListenersIDKey]] = {}
  }
  return alreadyListeningTo[mountAt[topListenersIDKey]]
}

/**
 *
 * `ReactBrowserEventEmitter`用于添加顶级事件监听者。例如：
 *
 *   EventPluginHub.putListener('myID', 'onClick', myFunction);
 *
 * 这将在`myID`上分配`('onClick', myFunction)`的'注册'
 *
 * @internal
 */
var ReactBrowserEventEmitter = Object.assign({}, ReactEventEmitterMixin,
  {
    /**
     * 可注入事件后端
     */
    ReactEventListener: null,

    injection: {
      /**
       * @param {object} ReactEventListener
       */
      injectReactEventListener: function(ReactEventListener) {
        ReactEventListener.setHandleTopLevel(ReactBrowserEventEmitter.handleTopLevel)
        ReactBrowserEventEmitter.ReactEventListener = ReactEventListener
      }
    },

    /**
     * 设置任何已经创建的回调是否可用
     * Sets whether or not any created callbacks should be enabled.
     *
     * @param {boolean} enabled True if callbacks should be enabled.
     */
    setEnabled: function(enabled) {
      if (ReactBrowserEventEmitter.ReactEventListener) {
        ReactBrowserEventEmitter.ReactEventListener.setEnabled(enabled)
      }
    },

    /**
     * @return {boolean} True if callbacks are enabled.
     */
    isEnabled: function() {
      return !!(ReactBrowserEventEmitter.ReactEventListener && ReactBrowserEventEmitter.ReactEventListener.isEnabled())
    },

    /**
     * 我们在document对象上监听冒泡的touch事件。
     *
     * Firefox v8.01 (and possibly others) exhibited strange behavior when
     * mounting `onmousemove` events at some node that was not the document
     * element. The symptoms were that if your mouse is not moving over something
     * contained within that mount point (for example on the background) the
     * top-level listeners for `onmousemove` won't be called. However, if you
     * register the `mousemove` on the document object, then it will of course
     * catch all `mousemove`s. This along with iOS quirks, justifies restricting
     * top-level listeners to the document object only, at least for these
     * movement types of events and possibly all events.
     *
     * @see http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
     *
     * Also, `keyup`/`keypress`/`keydown` do not bubble to the window on IE, but
     * they bubble to document.
     *
     * @param {string} registrationName Name of listener (e.g. `onClick`).
     * @param {object} contentDocumentHandle Document which owns the container
     */
    listenTo: function(registrationName, contentDocumentHandle) {
      var mountAt = contentDocumentHandle
      var isListening = getListeningForDocument(mountAt)
      var dependencies = EventPluginRegistry.registrationNameDependencies[registrationName]

      for (var i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i]
        if (!(isListening.hasOwnProperty(dependency) && isListening[dependency])) {
          if (dependency === 'topWheel') {
            if (isEventSupported('wheel')) {
              ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topWheel', 'wheel', mountAt)
            } else if (isEventSupported('mousewheel')) {
              ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topWheel', 'mousewheel', mountAt)
            } else {
              // Firefox needs to capture a different mouse scroll event.
              // @see http://www.quirksmode.org/dom/events/tests/scroll.html
              ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topWheel', 'DOMMouseScroll', mountAt)
            }
          } else if (dependency === 'topScroll') {
            if (isEventSupported('scroll', true)) {
              ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent('topScroll', 'scroll', mountAt)
            } else {
              ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
                'topScroll',
                'scroll',
                ReactBrowserEventEmitter.ReactEventListener.WINDOW_HANDLE
              )
            }
          } else if (dependency === 'topFocus' || dependency === 'topBlur') {
            if (isEventSupported('focus', true)) {
              ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent('topFocus', 'focus', mountAt)
              ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent('topBlur', 'blur', mountAt)
            } else if (isEventSupported('focusin')) {
              // IE has `focusin` and `focusout` events which bubble.
              // @see http://www.quirksmode.org/blog/archives/2008/04/delegating_the.html
              ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topFocus', 'focusin', mountAt)
              ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent('topBlur', 'focusout', mountAt)
            }

            // to make sure blur and focus event listeners are only attached once
            isListening.topBlur = true
            isListening.topFocus = true
          } else if (topEventMapping.hasOwnProperty(dependency)) {
            ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(
              dependency,
              topEventMapping[dependency],
              mountAt
            )
          }

          isListening[dependency] = true
        }
      }
    },

    trapBubbledEvent: function(topLevelType, handlerBaseName, handle) {
      return ReactBrowserEventEmitter.ReactEventListener.trapBubbledEvent(topLevelType, handlerBaseName, handle)
    },

    trapCapturedEvent: function(topLevelType, handlerBaseName, handle) {
      return ReactBrowserEventEmitter.ReactEventListener.trapCapturedEvent(topLevelType, handlerBaseName, handle)
    },

    /**
     * Protect against document.createEvent() returning null
     * Some popup blocker extensions appear to do this:
     * https://github.com/facebook/react/issues/6887
     */
    supportsEventPageXY: function() {
      if (!document.createEvent) {
        return false
      }
      var ev = document.createEvent('MouseEvent')
      return ev != null && 'pageX' in ev
    },

    /**
     * Listens to window scroll and resize events. We cache scroll values so that
     * application code can access them without triggering reflows.
     *
     * ViewportMetrics is only used by SyntheticMouse/TouchEvent and only when
     * pageX/pageY isn't supported (legacy browsers).
     *
     * NOTE: Scroll events do not bubble.
     *
     * @see http://www.quirksmode.org/dom/events/scroll.html
     */
    ensureScrollValueMonitoring: function() {
      if (hasEventPageXY === undefined) {
        hasEventPageXY = ReactBrowserEventEmitter.supportsEventPageXY()
      }
      if (!hasEventPageXY && !isMonitoringScrollValue) {
        var refresh = ViewportMetrics.refreshScrollValues
        ReactBrowserEventEmitter.ReactEventListener.monitorScrollValue(refresh)
        isMonitoringScrollValue = true
      }
    }
  }
)

module.exports = ReactBrowserEventEmitter