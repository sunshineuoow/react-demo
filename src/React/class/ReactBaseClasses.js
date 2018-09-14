// React组件类
var ReactNoopUpdateQueue = require('./ReactNoopUpdateQueue')

function ReactComponent(props, context, updater) {
  this.props = props
  this.context = context
  this.refs = {}
  // 初始化默认的updater，但是真正的updater是由renderer注入的
  this.updater = updater || ReactNoopUpdateQueue
}

ReactComponent.prototype.isReactComponent = true

ReactComponent.prototype.setState = function(partialState, callback) {
  this.updater.enqueueSetState(this, partialState)
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'setState')
  }
}

function ReactPureComponent(props, context, updater) {
  this.props = props
  this.context = context
  this.refs = {}
  this.updater = updater || ReactNoopUpdateQueue
}

// Question: 为什么不直接使用合并原型的方式，而采用继承+合并原型
// PureComponent 继承 Component
function ComponentDummy() {}
ComponentDummy.prototype = ReactComponent.prototype
ReactPureComponent.prototype = new ComponentDummy()
ReactPureComponent.prototype.constructor = ReactPureComponent
// 这些方法阻止额外的原型链搜索
Object.assign(ReactComponent.prototype, ReactComponent.prototype)
ReactPureComponent.prototype.isPureReactComponent = true

module.exports = {
  Component: ReactComponent,
  PureComponent: ReactPureComponent
}
