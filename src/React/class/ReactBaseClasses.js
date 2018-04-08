// React组件
function ReactComponent(props, updater) {
  this.props = props
  this.refs = {}
  this.updater = updater || null
}

ReactComponent.prototype.isReactComponent = true

ReactComponent.prototype.setState = function(partialState, callback) {

}

module.exports = {
  Component: ReactComponent
}
