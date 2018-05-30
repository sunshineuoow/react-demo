function ckeckMask(value, bitmask) {
  return (value & bitmask) === bitmask
}

var DOMPropertyInjection = {
  MUST_USE_PROPERTY: 0x1,
  HAS_BOOLEAN_VALUE: 0x4,
  HAS_NUMERIC_VALUE: 0x8,
  HAS_POSITIVE_NUMERIC_VALUE: 0x10 | 0x8,
  HAS_OVERLOADED_BOOLEAN_VALUE: 0x20,

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
