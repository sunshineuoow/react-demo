// React组件类
var ReactNoopUpdateQueue = require('./ReactNoopUpdateQueue')

function ReactComponent(props, updater) {
  this.props = props
  this.refs = {}
  this.updater = updater || ReactNoopUpdateQueue
}

ReactComponent.prototype.isReactComponent = true

ReactComponent.prototype.setState = function(partialState, callback) {
  this.updater.enqueueSetState(this, partialState)
  if (callback) {
    this.updater.enqueueCallback(this, callbac, 'setState')
  }
}

module.exports = {
  Component: ReactComponent
}
