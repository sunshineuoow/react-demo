var CallbackQueue = require('../../utils/CallbackQueue')
var PooledClass = require('../../../../utils/PooledClass')
var ReactReconciler = require('../recociler/ReactReconciler')
var Transaction = require('../../utils/Transaction')

var dirtyComponents = []
var updateBatchNumber = 0
var asapCallbackQueue = CallbackQueue.getPooled()
var asapEnqueued = false

var batchingStrategy = null

var NESTED_UPDATES = {
  initialize: function() {
    this.dirtyComponentsLength = dirtyComponents.length
  },
  close: function() {
    if (this.dirtyComponentsLength !== dirtyComponents.length) {
      dirtyComponents.splice(0, this.dirtyComponentsLength)
      flushBatchedUpdates()
    } else {
      dirtyComponents.length = 0
    }
  }
}

var UPDATE_QUEUEING = {
  initialize: function() {
    this.callbackQueue.reset()
  },
  close: function() {
    this.callbackQueue.notifyAll()
  }
}

var TRANSACTION_WRAPPERS = [NESTED_UPDATES, UPDATE_QUEUEING]

function ReactUpdatesFlushTransaction() {
  this.reinitializeTransaction()
  this.dirtyComponentsLength = null
  this.callbackQueue = CallbackQueue.getPooled()
  this.reconcileTransaction = ReactUpdates.ReactReconcileTransaction.getPooled(true)
}

Object.assign(ReactUpdatesFlushTransaction.prototype, Transaction, {
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS
  },

  destructor: function() {
    this.dirtyComponentsLength = null
    CallbackQueue.release(this.callbackQueue)
    this.callbackQueue = null
    ReactUpdates.ReactReconcileTransaction.release(this.reconcileTransaction)
    this.reconcileTransaction = null
  },

  perform: function(method, scope, a) {
    // 本质上是执行了this.reconcileTransaction.perform(method, scope, a)，但是使用了这个Transaction的wrappers
    return Transaction.perform.call(
      this,
      this.reconcileTransaction.perform,
      this.reconcileTransaction,
      method,
      scope,
      a
    )
  }
})

PooledClass.addPoolingTo(ReactUpdatesFlushTransaction)

function batchedUpdates(callback, a, b, c, d, e) {
  return batchingStrategy.batchedUpdates(callback, a, b, c, d, e)
}

function mountOrderComparator(c1, c2) {
  return c1._mountOrder - c2._mountOrder
}

function runBatchedUpdates(transaction) {
  var len = transaction.dirtyComponentsLength
  
  dirtyComponents.sort(mountOrderComparator)

  updateBatchNumber++

  for (var i = 0; i < len; i++) {
    var component = dirtyComponents[i]
    var callbacks = component._pendingCallbacks
    component._pendingCallbacks = null

    ReactReconciler.performUpdateIfNecessary(
      component,
      transaction.reconcileTransaction,
      updateBatchNumber
    )

    if (callbacks) {
      for (var j = 0; j < callbacks.length; j++) {
        transaction.callbackQueue.enqueue(
          callbacks[j],
          component.getPublicInstance()
        )
      }
    }
  }
}

var flushBatchedUpdates = function() {
  while (dirtyComponents.length || asapEnqueued) {
    if (dirtyComponents.length) {
      var transaction = ReactUpdatesFlushTransaction.getPooled()
      transaction.perform(runBatchedUpdates, null, transaction)
      ReactUpdatesFlushTransaction.release(transaction)
    }

    if (asapEnqueued) {
      asapEnqueued = false
      var queue = asapCallbackQueue
      asapCallbackQueue = CallbackQueue.getPooled()
      queue.notifyAll()
      CallbackQueue.release(queue)
    }
  }
}

function enqueueUpdate(component) {
  if (!batchingStrategy.isBatchingUpdates) {
    batchingStrategy.batchedUpdates(enqueueUpdate, component)
    return
  }

  dirtyComponents.push(component)
  if (component._updateBatchNumber == null) {
    component._updateBatchNumber = updateBatchNumber + 1
  }
}

function asap(callback, context) {
  asapCallbackQueue.enqueue(callback, context)
  asapEnqueued = true
}

var ReactUpdatesInjection = {
  injectReconcileTransaction: function(ReconcileTransaction) {
    ReactUpdates.ReactReconcileTransaction = ReconcileTransaction
  },

  injectBatchingStrategy: function(_batchingStrategy) {
    batchingStrategy = _batchingStrategy
  }
}

var ReactUpdates = {
  ReactReconcileTransaction: null,

  batchedUpdates: batchedUpdates,
  enqueueUpdate: enqueueUpdate,
  flushBatchedUpdates: flushBatchedUpdates,
  injection: ReactUpdatesInjection,
  asap: asap
}

module.exports = ReactUpdates
