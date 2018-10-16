// ReactDOM纯文本组件

var ReactDOMTextComponent = function(text) {
  this._currentElement = text
  this._stringText = '' + text

  this._domID = 0
  this._mountIndex = 0
  this._closingComment = null
  this._commentNodes = null
}

Object.assign(ReactDOMTextComponent.prototype, {
  mountComponent: function(
    hostParent,
    hostContainerInfo,
  ) {
    var domID = hostContainerInfo._idCounter++
    var openingValue = ' react-text: ' + domID + ''
    var closingValue = ' /react-text '

    var escapedText = this._stringText

    return (
      '<!--' +
      openingValue +
      '-->' +
      escapedText +
      '<!--' +
      closingValue +
      '-->'
    )
  },


})

module.exports = ReactDOMTextComponent
