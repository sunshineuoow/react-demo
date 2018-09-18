// jsx 通过 createElement 方法转换为 React的Element

var ReactCurrentOwner = require('./ReactCurrentOwner')

var REACT_ELEMENT_TYPE = require('../../utils/ReactElementSymbol')

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
}

// 校验ref
function hasValidRef(config) {
  return config.ref !== undefined
}

// 校验key
function hasValidKey(config) {
  return config.key !== undefined
}

var ReactElement = function(type, key, ref, self, source, owner, props) {
  var element = {
    $$typeof: REACT_ELEMENT_TYPE, // 用于标识React的元素对象
  
    // 元素的内置属性
    type: type,
    key: key,
    ref: ref,
    props: props,

    // 记录创建该元素的组件
    _owner: owner
  }

  return element
}

ReactElement.createElement = function(type, config, children) {
  var propName

  var props = {}

  var key = null
  var ref = null
  var self = null
  var source = null

  if (config != null) {
    if (hasValidRef(config)) {
      ref = config.ref
    }
    if (hasValidKey(config)) {
      key = '' + config.key
    }

    self = config.__self === undefined ? null : config.__self
    source = config.__source === undefined ? null : config.__source

    for(propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName]
      }
    }
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

  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName]
      }
    }
  }

  return ReactElement(
    type,
    key,
    ref,
    self,
    source,
    ReactCurrentOwner.current,
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
