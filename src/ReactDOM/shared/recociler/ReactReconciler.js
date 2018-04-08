// 调用组件实例的mountComponent方法，将其挂载至dom
var ReactReconciler = {
  mountComponent: function(
    internalInstance,
    hostParent,
    hostContainerInfo,
  ) {
    console.log(internalInstance)
    var markup = internalInstance.mountComponent(
      hostParent,
      hostContainerInfo,
    )

    console.log(markup, 'markup')
    return markup
  }

}


module.exports = ReactReconciler
