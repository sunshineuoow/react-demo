var ReactInstanceMap = require('../../shared/ReactInstanceMap')
var ReactUpdates = require('./ReactUpdates')

function enqueueUpdate(internalInstance) {
  ReactUpdates.enqueueUpdate(internalInstance)
}

function formatUnexpectedArgument(arg) {
  var type = typeof arg
  if (type !== 'object') {
    return type
  }
  var display = (arg.constructor && arg.constructor.name) || type
  var keys = Ojbect.keys(arg)
  if (keys.length > 0 && keys.length < 20) {
    return `${displayName} (keys: ${keys.join(', ')})`
  }
  return displayName
}

function getInternalInstanceReadyForUpdate(publicInstance, callerName) {
  var internalInstance = ReactInstanceMap.get(publicInstance)
  if (!internalInstance) {
    return null
  }

  return internalInstance
}

var ReactUpdateQueue = {

  isMounted: function(publicInstance) {
    var owner = ReactCurrentOwner.current
    if (owner !== null) {
      owner._warnedAboutRefsInRender = true
    }
    
    var internalInstance = ReactInstanceMap.get(publicInstance)
    if (internalInstance) {
      return !!internalInstance._renderedComponent
    } else {
      return false
    }
  },

  enqueueCallback: function(publicInstance, callback, callerName) {
    ReactUpdateQueue.validateCallback(callback, callerName)
    var internalInstance = getInternalInstanceReadyForUpdate(publicInstance)
    
    if (!internalInstance) {
      return null
    }

    if (internalInstance._pendingCallbacks) {
      internalInstance._pendingCallbacks.push(callback)
    } else {
      internalInstance._pendingCallbacks = [callback]
    }

    enqueueUpdate(internalInstance)
  },

  enqueueCallbackInternal: function(internalInstance, callback) {
    if (internalInstance._pendingCallbacks) {
      internalInstance._pendingCallbacks.push(callback)
    } else {
      internalInstance._pendingCallbacks = [callback]
    }
    
    enqueueUpdate(internalInstance)
  },

  enqueueForceUpdate: function(publicInstance) {
    var internalInstance = getInternalInstanceReadyForUpdate(
      publicInstance,
      'forceUpdate'
    )

    if (!internalInstance) {
      return
    }

    internalInstance._pendingForceUpdate = true

    enqueueUpdate(internalInstance)
  },

  enqueueReplaceState: function(publicInstance, completeState, callback) {
    var internalInstance = getInternalInstanceReadyForUpdate(
      publicInstance,
      'replaceState'
    )

    if (!internalInstance) {
      return
    }

    internalInstance._pendingStateQueue = [completeState]
    internalInstance._pendingReplaceState = true

    if (callback !== undefined && callback !== null) {
      ReactUpdateQueue.validateCallback(callback, 'replaceState')
      if (internalInstance._pendingCallbacks) {
        internalInstance._pendingCallbacks.push(callback)
      } else {
        internalInstance._pendingCallbacks = [callback]
      }
    }

    enqueueupdate(internalInstance)
  },

  enqueueSetState: function(publicInstance, partialState) {
    var internalInstance = getInternalInstanceReadyForUpdate(
      publicInstance,
      'setState'
    )
    
    if (!internalInstance) {
      return
    }

    var queue = 
      internalInstance._pendingStateQueue ||
      (internalInstance._pendingStateQueue = [])
    queue.push(partialState)

    enqueueUpdate(internalInstance)
  },

  enqueueElementInternal: function(internalInstance, nextElement, nextContext) {
    internalInstance._pendingElement = nextElement
    internalInstance._context = nextContext
    enqueueUpdate(internalInstance)
  },

  validateCallback: function(callback, callerName) {
    
  }
}

module.exports = ReactUpdateQueue
