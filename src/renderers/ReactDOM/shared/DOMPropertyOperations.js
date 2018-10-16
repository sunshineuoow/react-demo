var DOMProperty = require('./DOMProperty')
// var ReactDOMComponentTree = require('')

var quoteAttributeValueForBrowser = require('./quoteAttributeValueForBrowser')

var VALID_ATTRIBUTE_NAME_REGEX =  new RegExp(
  '^[' +
    DOMProperty.ATTRIBUTE_NAME_START_CHAR + 
    '][' +
    DOMProperty.ATTRIBUTE_NAME_CHAR +
    ']*$'
)

var illegalAttributeNameCache = {}
var validatedAttributeNameCache = {}

function isAttributeNameSafe(attributeName) {
  if (validatedAttributeNameCache.hasOwnProperty(attributeName)) {
    return true
  }

  if (illegalAttributeNameCache.hasOwnProperty(attributeName)) {
    return false
  }

  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache[attributeName] = true
    return true
  }
  illegalAttributeNameCache[attributeName] = true
  return false
}

function shouldIgnoreValue(propertyInfo, value) {
  return (
    value == null ||
    (propertyInfo.hasBooleanValue && !value) ||
    (propertyInfo.hasNumericValue && isNaN(value)) ||
    (propertyInfo.hasPositiveNumericValue && value < 1) ||
    (propertyInfo.hasOverloadedBooleanValue && value === false)
  )
}

/**
 * 处理DOM属性的操作
 */
var DOMPropertyOperations = {
  /**
   * 为ID属性创建标记
   *
   * @param {string} id 未转义的id
   * @return {string} 标记字符串
   */
  createMarkupForID: function(id) {
    return (
      DOMProperty.ID_ATTRIBUTE_NAME + '=' + quoteAttributeValueForBrowser(id)
    )
  },

  setAttributeForID: function(node, id) {
    node.setAttribute(DOMProperty.ID_ATTRIBUTE_NAME, id)
  },

  createMarkupForRoot: function() {
    return DOMProperty.ROOT_ATTRIBUTE_NAME + '=""'
  },

  setAttributeForRoot: function(node) {
    node.setAttribute(DOMProperty.ROOT_ATTRIBUTE_NAME, '')
  },

  /**
   * 为一个属性创建标记
   *
   * @param {string} name
   * @param {*} value
   * @return {?string} 标记字符串，如果属性不合法则为null
   */
  createMarkupForProperty: function(name, value) {
    var propertyInfo = DOMProperty.properties.hasOwnProperty(name)
      ? DOMProperty.properties[name]
      : null
    if (propertyInfo) {
      if (shouldIgnoreValue(propertyInfo, value)) {
        return ''
      }
      var attributeName = propertyInfo.attributeName
      if (
        propertyInfo.hasBooleanValue ||
        (propertyInfo.hasOverloadedBooleanValue && value === true)
      ) {
        return attributeName + '=""'
      }
      return attributeName + '=' + quoteAttributeValueForBrowser(value)
    }
    return null
  },

  /**
   * 为自定义属性创建标记
   *
   * @param {string} name
   * @param {*} value
   * @return {string} 标记字符串，属性非法时为空字符串
   */
  createMarkupForCustomAttribute: function(name, value) {
    if (isAttributeNameSafe(name) || value == null) {
      return ''
    }
    return name + '=' + quoteAttributeValueForBrowser(value)
  },

  /**
   * 在一个节点上设置属性值
   *
   * @param {DOMElement} node
   * @param {string} name
   * @param {*} value
   */
  setValueForProperty: function(node, name, value) {
    var propertyInfo = DOMProperty.properties.hasOwnProperty(name)
      ? DOMProperty.properties[name]
      : null
    if (propertyInfo) {
      var mutationMethod = propertyInfo.mutationMethod
      if (mutationMethod) {
        mutationMethod(node, value)
      } else if (shouldIgnoreValue(propertyInfo, value)) {
        this.deleteValueForProperty(node, name)
        return
      } else if (propertyInfo.mustUseProperty) {
        node[propertyInfo.propertyName] = value
      } else {
        var attributeName = propertyInfo.attributeName
        var namespace = propertyInfo.attributeNamespace
        if (namespace) {
          node.setAttributeNS(namespace, attributeName, '' + value)
        } else if (
          propertyInfo.hasBooleanValue ||
          (propertyInfo.hasOverloadedBooleanValue && value === true)
        ) {
          node.setAttribute(attributeName, '')
        } else {
          node.setAttribute(attributeName, '' + value)
        }
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      DOMPropertyOperations.setValueForAttribute(node, name, value)
      return
    }  
  },

  setValueForAttribute: function(node, name, value) {
    if (!isAttributeNameSafe(name)) {
      return
    }
    if (value == null) {
      node.removeAttribute(name)
    } else {
      node.setAttribute(name, '' + value)
    }
  },

  /**
   * 删除一个节点上的属性(attribute)
   *
   * @param {DOMElement} node
   * @param {string} name
   */
  deleteValueForAttribute: function(node, name) {
    node.removeAttribute(name)
  },


  /**
   * 删除一个节点上的属性值(property)
   *
   * @param {DOMElement} node
   * @param {string} name
   */ 
  deleteValueForProperty: function(node, name) {
    var propertyInfo = DOMProperty.properties.hasOwnProperty(name)
      ? DOMProperty.properties[name]
      : null
    if (propertyInfo) {
      var mutationMethod = propertyInfo.mutationMethod
      if (mutationMethod) {
        mutationMethod(node, undefined)
      } else if (propertyInfo.mustUseProperty) {
        var propName = propertyInfo.propertyName
        if (propertyInfo.hasBooleanValue) {
          node[propName] = false
        } else {
          node[propName] = ''
        }
      } else {
        node.removeAttribute(propertyInfo.attributeName)
      }
    } else if (DOMProperty.isCustomAttribute(name)) {
      node.removeAttribute(name)
    }  
  }
}

module.exports = DOMPropertyOperations