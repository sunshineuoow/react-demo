// ReactDOM空组件

var ReactDOMEmptyComponent = function(instantiate) {
  this._currentElement = null
  this._hostNode = null
  this._hostParent = null
  this._hostContainerInfo = null
  this._domID = null
}

Object.assign(ReactDOMEmptyComponent.prototype, {
  mountComponent: function(
    hostParent,
    hostContainerInfo
  ) {
    var domID = hostContainerInfo._idCounter++
    this._domID = domID
    this._hostParent = hostParent
    this._hostContainerInfo = hostContainerInfo

    var nodeValue = ' react-empty: ' + this._domID + ' '
    return '<!--' + nodeValue + '-->'
  },
})

module.exports = ReactDOMEmptyComponent