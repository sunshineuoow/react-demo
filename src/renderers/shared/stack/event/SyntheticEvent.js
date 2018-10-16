var PooledClass = require('../../../../utils/PooledClass')
var emptyFunction = require('fbjs/lib/emptyFunction')
var didWarnForAddedNewProperty = false
var isProxySupported = typeof Proxy === 'function'

var shouldBeReleasedProperties = [
  'dispatchConfig',
  '_targetInst',
  'nativeEvent',
  'isDefaultPrevented',
  'isPropagationStopped',
  '_dispatchListeners',
  '_dispatchInstances'
]

/**
 * @interface Event
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var EventInterface = {
  type: null,
  target: null,
  // currentTarget会在派发时设置。这里拷贝它没有意义
  currentTarget: emptyFunction.thatReturnsNull,
  eventPhase: null,
  bubbles: null,
  cancelable: null,
  timeStamp: function(event) {
    return event.timeStamp || Date.now();
  },
  defaultPrevented: null,
  isTrusted: null,
}

/**
 * 合成事件通过事件插件派发,通常是一个顶级事件委托处理程序来响应。
 *
 * 这些系统应当使用池来减少垃圾收集的频率。这个系统应当检查`isPersistent`来决定这个事件在被派发后是否应当释放到池中。
 * 需要持久事件的用户应当调用`persist`。
 *
 * 合成事件(和子类)通过标准化浏览器怪癖实现了DOM等级3的事件API。子类没有必要实现一个DOM接口。
 * 自定义应用程序的特定事件也可以通过合成事件子类化。
 *
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {*} targetInst Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @param {DOMEventTarget} nativeEventTarget Target node.
 */
function SyntheticEvent(
  dispatchConfig,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  this.dispatchConfig = dispatchConfig
  this._targetInst = targetInst
  this.nativeEvent = nativeEvent

  var Interface = this.constructor.Interface
  for (var propName in Interface) {
    if (!Interface.hasOwnProperty(propName)) {
      continue
    }

    var normalize = Interface[propName]
    if (normalize) {
      this[propName] = normalize(nativeEvent)
    } else {
      if (propName === 'target') {
        this.target = nativeEventTarget
      } else {
        this[propName] = nativeEvent[propName]
      }
    }
  }

  var defaultPrevented = nativeEvent.defaultPrevented != null
    ? nativeEvent.defaultPrevented
    : nativeEvent.returnValue === false

  if (defaultPrevented) {
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue
  } else {
    this.isDefaultPrevented = emptyFunction.thatReturnsFalse
  }
  this.isPropagationStopped = emptyFunction.thatReturnsFalse
  return this
}

Object.assign(SyntheticEvent.prototype, {
  preventDefault: function() {
    this.defaultPrevented = true
    var event = this.nativeEvent
    if (!event) {
      return
    }

    if (event.preventDefault) {
      event.preventDefault()
    } else if (typeof event.returnValue !== 'unknown') {
      event.returnValue = false
    }
    this.isDefaultPrevented = emptyFunction.thatReturnsTrue
  },

  stopPopagation: function() {
    var event = this.nativeEvent
    if (!event) {
      return
    }

    if (event.stopPopagation) {
      event.stopPopagation()
    } else if (typeof event.cancelBubble !== 'unknown') {
      // ChangeEventPlugin会为IE注册一个`propertychange`事件。
      // 这个事件不支持冒泡或者取消，并且任何对于cancelBubble的引用都会抛出"Member not found"
      // 一个类型检查"unknown"用于规避这个issue
      event.cancelBubble = true
    }

    this.isPropagationStopped = emptyFunction.thatReturnsTrue
  },

  /**
   * 我们在每个事件循环结束后释放所有已经派发过的合成事件，并将它们添加至池中。
   * 这允许一种方法来保持不会被添加回池中的引用。
   */
  persist: function() {
    this.isPersistent = emptyFunction.thatReturnsTrue;
  },

  /**
   * 检查是否一个事件应当被释放回池中
   *
   * @return {boolean} True if this should not be released, false otherwise.
   */
  isPersistent: emptyFunction.thatReturnsFalse,

  /**
   * `PooledClass`寻找每个释放的实例上的`destructor`
   */
  destructor: function() {
    var Interface = this.constructor.Interface;
    for (var propName in Interface) {
      this[propName] = null;
    }
    for (var i = 0; i < shouldBeReleasedProperties.length; i++) {
      this[shouldBeReleasedProperties[i]] = null;
    }
  }
})

SyntheticEvent.Interface = EventInterface

/**
 * 创建子类时减少样板的辅助函数
 *
 * @param {function} Class
 * @param {?object} Interface
 */
SyntheticEvent.augmentClass = function(Class, Interface) {
  var Super = this;

  var E = function() {};
  E.prototype = Super.prototype;
  var prototype = new E();

  Object.assign(prototype, Class.prototype);
  Class.prototype = prototype;
  Class.prototype.constructor = Class;

  Class.Interface = Object.assign({}, Super.Interface, Interface);
  Class.augmentClass = Super.augmentClass;

  PooledClass.addPoolingTo(Class, PooledClass.fourArgumentPooler);
}

PooledClass.addPoolingTo(SyntheticEvent, PooledClass.fourArgumentPooler)


module.exports = SyntheticEvent
