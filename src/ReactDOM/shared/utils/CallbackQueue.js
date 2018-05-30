var PooledClass = require('../../../utils/PooledClass')

class CallbackQueue {
  constructor(arg) {
    this._callbacks = null
    this._contexts = null
    this.arg = arg
  }

  enqueue(callback, context) {
    this._callbacks = this._callbacks || []
    this._callbacks.push(callback)
    this._contexts = this._contexts || []
    this._contexts.push(context)
  }

  notifyAll() {
    var callbacks = this._callbacks
    var contexts = this._contexts
    var arg = this.arg
    if (callbacks && contexts) {
      this._callbacks = null
      this._contexts = null
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i].call(contexts[i], arg)
      }
      callbacks.length = 0
      contexts.length = 0
    }
  }

  checkpoint() {
    return this._callbacks ? this._callbacks.length : 0
  }

  rollback(len) {
    if (this._callbacks && this._contexts) {
      this._callbacks.length = len
      this._contexts.length = len
    }
  }

  reset() {
    this._callbacks = null
    this._contexts = null
  }

  destructor() {
    this.reset()
  }
}

module.exports = PooledClass.addPoolingTo(CallbackQueue)
