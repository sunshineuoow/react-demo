/**
 * React的调解中心，用于触发组件的挂载及更新方法
 */

var ReactRef = require('./ReactRef')

/**
 * 用当前组合组件调用ReactRef.attachRefs，拆分以避免挂载在mount-ready队列中分配
 */
function attachRefs() {
  ReactRef.attachRefs(this, this._currentElement)
}

var ReactReconciler = {
  /**
   * 初始化组件，渲染内容，并且注册事件监听
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {?object} the containing host component instance
   * @param {?object} info about the host container
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function(
    internalInstance,
    transaction,
    hostParent,
    hostContainerInfo,
    context,
    parentDebugID // root和生产环境下为0
  ) {

    var markup = internalInstance.mountComponent(
      transaction,
      hostParent,
      hostContainerInfo,
      context,
      parentDebugID
    )
    if (
      internalInstance._currentElement &&
      internalInstance._currentElement.ref != null
    ) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance)
    }

    return markup
  },

  /**
   * 返回一个可以传递给RecatComponentEnvironment.replaceNodeWithMarkup的值
   */
  getHostNode: function(internalInstance) {
    return internalInstance.getHostNode()
  },

  /**
   * 释放所有mountComponent分配的资源
   *
   * @final
   * @internal
   */
  unmountComponent: function(internalInstance, safely) {
    ReactRef.detachRefs(internalInstance, internalInstance._currentElement)
    internalInstance.unmountComponent(safely)
  },

  /**
   * 用一个新元素更新组件
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactElement} nextElement
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @internal
   */
  receiveComponent: function(
    internalInstance,
    nextElement,
    transaction,
    context
  ) {
    var prevElement = internalInstance._currentElement

    if (nextElement === prevElement && context === internalInstance._context) {
      // 元素在所有者渲染后是不可变的，我们可以在这里做一个简单的身份比较来确定这是不是一个多余的调度
      // 状态时可变的，但是这些改变应当触发将重新创建元素的所有者的更新
      // 我们明确检查所有者的存在，因为在复合之外创建的元素可能会深度变异和复用

      // TODO: Bailing out early is just a perf optimization right?
      // TODO: Removing the return statement should affect correctness?
      return
    }

    var refsChanged = ReactRef.shouldUpdateRefs(prevElement, nextElement)

    if (refsChanged) {
      ReactRef.detachRefs(internalInstance, prevElement)
    }

    internalInstance.receiveComponent(nextElement, transaction)

    if (
      refsChanged &&
      internalInstance._currentElement &&
      internalInstance._currentElement.ref != null
    ) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance)
    }
  },

  /**
   * 刷新组件中的任务脏更改
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function(
    internalInstance,
    transaction,
    updateBatchNumber
  ) {
    if (internalInstance._updateBatchNumber !== updateBatchNumber) {
      // 组件的入队编号应当始终是当前编号或者后续编号
      return
    }

    internalInstance.performUpdateIfNecessary(transaction)
  }

}


module.exports = ReactReconciler
