/**
 * React的调解中心，用于触发组件的挂载及更新方法
 */

var ReactReconciler = {
  mountComponent: function(
    internalInstance,
    transaction,
    hostParent,
    hostContainerInfo,
  ) {
    var markup = internalInstance.mountComponent(
      transaction,
      hostParent,
      hostContainerInfo,
    )

    return markup
  },

  getHostNode: function(internalInstance) {
    return internalInstance.getHostNode()
  },

  unmountComponent: function(internalInstance, safely) {
    internalInstance.unmountComponent(safely)
  },

  receiveComponent: function(
    internalInstance,
    nextElement,
    transaction
  ) {
    var prevElement = internalInstance._currentElement

    if (nextElement === prevElement) {
      return
    }

    internalInstance.receiveComponent(nextElement, transaction)

  },

  performUpdateIfNecessary: function(
    internalInstance,
    transaction,
    updateBatchNumber
  ) {
    if (internalInstance._updateBatchNumber !== updateBatchNumber) {
      return
    }

    internalInstance.performUpdateIfNecessary(transaction)
  }

}


module.exports = ReactReconciler
