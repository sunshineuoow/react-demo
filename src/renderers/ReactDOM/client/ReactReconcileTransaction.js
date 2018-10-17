var CallbackQueue = require('../../shared/utils/CallbackQueue')
var PooledClass = require('../../../utils/PooledClass')
var Transaction = require('../../shared/utils/Transaction')
var ReactUpdateQueue = require('../../shared/stack/recociler/ReactUpdateQueue')

var SELECTION_RESTORATION = {
  initialize: function() {},
  close: function() {}
}

var EVENT_SUPPRESSION = {
  initialize: function() {},
  close: function() {}
}

/**
 * 在这个transaction期间提供一个收集`componentDidMount`和`componentDidUpdate`回调队列
 */
var ON_DOM_READY_QUEUEING = {
  /**
   * 初始化内部的`onDOMReady`队列
   */
  initialize: function() {
    this.reactMountReady.reset()
  },

  /**
   * DOM已经加载后，执行所有的注册的`onDOMReady`回调
   */
  close: function() {
    this.reactMountReady.notifyAll()
  }
}

var TRANACTION_WRAPPERS = [
  SELECTION_RESTORATION,
  EVENT_SUPPRESSION,
  ON_DOM_READY_QUEUEING
]

function ReactReconcileTransaction(useCreateElement) {
  this.reinitializeTransaction()

  this.renderToStaticMarkup = false
  this.reactMountReady = CallbackQueue.getPooled(null)
  this.useCreateElement = useCreateElement
}


var Mixin = {

  getTransactionWrappers: function() {
    return TRANACTION_WRAPPERS
  },

  getReactMountReady: function() {
    return this.reactMountReady
  },

  getUpdateQueue: function() {
    return ReactUpdateQueue
  },

  checkpoint: function() {
    return this.reactMountReady.checkpoint()
  },

  rollback: function(checkpoint) {
    this.reactMountReady.rollback(checkpoint)
  },

  destructor: function() {
    CallbackQueue.release(this.reactMountReady)
    this.reactMountReady = null
  }
}

Object.assign(ReactReconcileTransaction.prototype, Transaction, Mixin)

PooledClass.addPoolingTo(ReactReconcileTransaction)

module.exports = ReactReconcileTransaction
