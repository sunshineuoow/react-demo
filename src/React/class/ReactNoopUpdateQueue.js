// 初始化的空更新队列，之后会在渲染时被注册覆盖

var ReactNoopUpdateQueue = {

  isMounted: function(publicInstance) {
    return false;
  },

  enqueueCallback: function(publicInstance, callback) {},

  enqueueForceUpdate: function(publicInstance) {},

  enqueueReplaceState: function(publicInstance, completeState) {},

  enqueueSetState: function(publicInstance, partialState) {}
}

module.exports = ReactNoopUpdateQueue