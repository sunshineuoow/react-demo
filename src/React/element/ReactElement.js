var REACT_ELEMENT_TYPE = require('../../utils/ReactElementSymbol')

var ReactElement = function(type, props) {
  var element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    props: props
  }

  return element
}

ReactElement.createElement = function(type, config, children) {
  var propName

  var props = {}

  for(propName in config) {
    props[propName] = config[propName]
  }

  var childrenLength = arguments.length - 2
  if (childrenLength === 1) {
    props.children = children
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength)
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2]
    }
    props.children = childArray
  }

  return ReactElement(
    type,
    props
  )
}

ReactElement.isValidElement = function(object) {
  return (
    typeof object === 'object' &&
    object !== null
  )
}

module.exports = ReactElement
