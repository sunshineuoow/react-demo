// ReactDOM组件

var ReactMultiChild = require('./recociler/ReactMultiChild')


var CONTENT_TYPES = {string: true, number: true}

function ReactDOMComponent(element) {
  var tag = element.type
  this._currentElement = element
  this._tag = tag.toLowerCase()
  this._namespaceURI = null
  this._rootNodeID = 0
  this._domID = 0
}

ReactDOMComponent.Mixin = {
  mountComponent: function(
    hostParent,
    hostContainerInfo,
  ) {
    var props = this._currentElement.props

    var mountImage

    var tagContent = this._createContentMarkup(props)
    mountImage = '<' + this._currentElement.type + '>' + tagContent + '</' + this._currentElement.type + '>'

    return mountImage
  },

  _createContentMarkup(
    props,
  ) {
    var ret = ''

    var contentToUse = CONTENT_TYPES[typeof props.children]
      ? props.children
      : null
    var childrenToUse = contentToUse != null ? null : props.children
    if (contentToUse != null) {
      ret = contentToUse
    } else if (childrenToUse != null) {
      var mountImages = this.mountChildren(
        childrenToUse,
      )

      ret = mountImages.join('')
    }

    return ret
  },
}

Object.assign(
  ReactDOMComponent.prototype,
  ReactDOMComponent.Mixin,
  ReactMultiChild.Mixin
)

module.exports = ReactDOMComponent
