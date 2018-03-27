var ReactDOM = {
  render: render
}

function render(nextElement, container, callback) {
  return _renderSubtreeIntoContainer(
    null,
    nextElement,
    container,
    callback
  )
}

function _renderSubtreeIntoContainer(parentComponent, nextElement, container, callback) {
  if (typeof nextElement === 'string') {
    var textNode = document.createTextNode(nextElement)
    return container.appendChild(textNode)
  }

  var dom = document.createElement(nextElement.type)

  if (nextElement.props) {
    for (var propName in nextElement.props) {
      if (propName !== 'children') {
        var value = nextElement.props[propName]
        if (propName === 'className') propName = 'class'
        dom.setAttribute(propName, value)
      }
    }
  }
  if (Array.isArray(nextElement.props.children)) {
    nextElement.props.children.forEach(function (item) {
      _renderSubtreeIntoContainer(null, item, dom, null)
    })
  } else {
    _renderSubtreeIntoContainer(null, nextElement.props.children, dom, null)
  }

  return container.appendChild(dom)
}

module.exports = ReactDOM
