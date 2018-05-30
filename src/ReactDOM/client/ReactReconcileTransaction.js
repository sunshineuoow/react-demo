var CallbackQueue = require('../shared/utils/CallbackQueue')
var PooledClass = require('../../utils/PooledClass')
var Transaction = require('../shared/utils/Transaction')
var ReactUpdateQueue = require('../shared/recociler/ReactUpdateQueue')

var SELECTION_RESTORATION = {
  initialize: function() {},
  close: function() {}
}

var EVENT_SUPPRESSION = {
  initialize: function() {},
  close: function() {}
}

var ON_DOM_READY_QUEUEING = {
  initialize: function() {
    this.reactMountReady.reset()
  },
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
