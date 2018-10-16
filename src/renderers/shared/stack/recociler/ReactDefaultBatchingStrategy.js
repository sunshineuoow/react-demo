var ReactUpdates = require('./ReactUpdates')
var Transaction = require('../../utils/Transaction')

var RESET_BATHCED_UPDATES = {
  initialize: function() {},
  close: function() {
    ReactDefaultbatchingStrategy.isBatchingUpdates = false
  }
}

var FLUSH_BATCHED_UPDATES = {
  initialize: function() {},
  close: ReactUpdates.flushBatchedUpdates.bind(ReactUpdates)
}

var TRANSACTION_WRAPPERS = [FLUSH_BATCHED_UPDATES, RESET_BATHCED_UPDATES]

function ReactDefaultBatchingStrategyTransaction() {
  this.reinitializeTransaction()
}

Object.assign(ReactDefaultBatchingStrategyTransaction.prototype, Transaction, {
  getTransactionWrappers: function() {
    return TRANSACTION_WRAPPERS
  }
})

var transaction = new ReactDefaultBatchingStrategyTransaction()

var ReactDefaultbatchingStrategy = {
  isBatchingUpdates: false,

  batchedUpdates: function(callback, a, b, c, d, e) {
    var alreadyBatchingUpdates = ReactDefaultbatchingStrategy.isBatchingUpdates

    ReactDefaultbatchingStrategy.isBatchingUpdates = true

    if (alreadyBatchingUpdates) {
      return callback(a, b, c, d, e)
    } else {
      return transaction.perform(callback, null, a, b, c, d, e)
    }
  }
}

module.exports = ReactDefaultbatchingStrategy
