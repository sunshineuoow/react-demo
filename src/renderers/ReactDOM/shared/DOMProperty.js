function checkMask(value, bitmask) {
  return (value & bitmask) === bitmask
}

var DOMPropertyInjection = {
  /**
   * 从标准化，驼峰命名的属性名匹配到一个相关联的DOM属性应当如何被访问或者渲染的配置
   */
  MUST_USE_PROPERTY: 0x1,
  HAS_BOOLEAN_VALUE: 0x4,
  HAS_NUMERIC_VALUE: 0x8,
  HAS_POSITIVE_NUMERIC_VALUE: 0x10 | 0x8,
  HAS_OVERLOADED_BOOLEAN_VALUE: 0x20,

  /**
   * 注入一些关于DOM的专业知识。这需要有一个下列属性的配置对象：
   *
   * isCustomAttribute: 一个如果给定字符属性(attribute)名可以插入DOM的话则返回true的函数。
   * 对于不能遍历所有可能属性(attribute)名时的data-*或者aria-*属性非常有用
   * 
   * Properties: 映射DOM属性(property)名到DOMPropertyInject常量或者null的对象。
   * 如果你的属性(property)不在这里，将不会写入DOM 
   *
   * DOMAttributeNames: 映射React属性名至DOM属性名的对象。
   * 未指定的属性名使用小写名称。
   *
   * DOMAttributeNamespaces: 映射React属性名至DOM属性命名空间URL的对象。
   * (未指定属性名不适用命名空间)
   *
   * DOMPropertyNames: 和DOMAttributeNames相似，但是使用DOM properties.
   * 未指定的Property名称使用小写名称。
   *
   * DOMMutationMethods: 需要特别的突变方法的属性(property)。
   * 如果value是undefined，这个突变方法应当不设置属性
   *
   * @param {object} domPropertyConfig the config as described above.
   */
  injectDOMPropertyConfig: function(domPropertyConfig) {
    var Injection = DOMPropertyInjection
    var Properties = domPropertyConfig.Properties || {}
    var DOMAttritubeNamespaces = domPropertyConfig.DOMAttributeNamespaces || {}
    var DOMAttributeNames = domPropertyConfig.DOMAttributeNames || {}
    var DOMPropertyNames = domPropertyConfig.DOMPropertyNames || {}
    var DomMutationMethods = domPropertyConfig.DomMutationMethods || {}

    if (domPropertyConfig.isCustomAttribute) {
      DOMProperty._isCustomAttributeFunctions.push(
        domPropertyConfig.isCustomAttribute
      )
    }

    for (var propName in Properties) {

      var lowerCased = propName.toLowerCase()
      var propConfig = Properties[propName]

      var propertyInfo = {
        attributeName: lowerCased,
        attributeNamespace: null,
        propertyName: propName,
        mutationMethod: null,

        mustUseProperty: checkMask(propConfig, Injection.MUST_USE_PROPERTY),
        hasBooleanValue: checkMask(propConfig, Injection.HAS_BOOLEAN_VALUE),
        hasNumericValue: checkMask(propConfig, Injection.HAS_NUMERIC_VALUE),
        hasPositiveNumericValue: checkMask(
          propConfig,
          Injection.HAS_POSITIVE_NUMERIC_VALUE
        ),
        hasOverloadedBooleanValue: checkMask(
          propConfig,
          Injection.HAS_OVERLOADED_BOOLEAN_VALUE
        )
      }

      if (DOMAttributeNames.hasOwnProperty(propName)) {
        var attributeName = DOMAttributeNames[propsName]
        propertyInfo.attributeName = attributeName
      }

      if (DOMAttritubeNamespaces.hasOwnProperty(propName)) {
        propertyInfo.attributeNamespace = DOMAttritubeNamespaces[propName]
      }

      if (DOMPropertyNames.hasOwnProperty(propName)) {
        propertyInfo.propertyName = DOMPropertyNames[propName]
      }

      if (DomMutationMethods.hasOwnProperty(propName)) {
        propertyInfo.mutationMethod = DomMutationMethods[propName]
      }

      DOMProperty.properties[propName] = propertyInfo
    }
  }
}

var ATTRIBUTE_NAME_START_CHAR = 
  ':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD'

/**
 * DOMProperty导出寻找可以向函数使用的对象
 * 
 *   > DOMProperty.isValid['id']
 *   true
 *   > DOMProperty.isValid['foobar']
 *   undefined
 *
 * Although this may be confusing, it performs better in general.
 *
 * @see http://jsperf.com/key-exists
 * @see http://jsperf.com/key-missing
 */
var DOMProperty = {
  ID_ATTRIBUTE_NAME: 'data-reactid',
  ROOT_ATTRIBUTE_NAME: 'data-reactroot',

  ATTRIBUTE_NAME_START_CHAR: ATTRIBUTE_NAME_START_CHAR,
  ATTRIBUTE_NAME_CHAR:
    ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040',

  properties: {},

  getPossibleStandardName: null,

  _isCustomAttributeFunctions: [],

  isCustomAttribute: function(attributeName) {
    for (var i = 0; i < DOMProperty._isCustomAttributeFunctions.length; i++) {
      var isCustomAttributeFn = DOMProperty._isCustomAttributeFunctions[i]
      if (isCustomAttributeFn(attributeName)) {
        return true
      }
    }
    return false
  },

  injection: DOMPropertyInjection
}

module.exports = DOMProperty
