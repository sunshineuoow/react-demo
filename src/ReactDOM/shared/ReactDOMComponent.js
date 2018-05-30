// ReactDOM组件
var DOMLazyTree = require('../client/utils/DOMLazyTree')
var DOMNamespaces = require('./DOMNamespaces')
var DOMProperty = require('./DOMProperty')
var DOMPropertyOperations = require('./DOMPropertyOperations')
var ReactDOMComponentFlags = require('./ReactDOMComponentFlags')
var ReactDOMComponentTree = require('../client/ReactDOMComponentTree')
var ReactMultiChild = require('./recociler/ReactMultiChild')

var Flags = ReactDOMComponentFlags

var CONTENT_TYPES = {string: true, number: true}

var STYLE = 'style'
var HTML = '__html'
var RESERVED_PROPS = {
  children: null,
  dangerouslySetInnerHTML: null,
  suppressContentEditableWarning: null
}

function isCustomComponent(tagName, props) {
  return tagName.indexOf('-') >= 0 || props.is != null
}

var globalIdCounter = 1

function ReactDOMComponent(element) {
  var tag = element.type
  this._currentElement = element
  this._tag = tag.toLowerCase()
  this._namespaceURI = null
  this._renderedChildren = null
  this._previousStyle = null
  this._previousStyleCopy = null
  this._hostNode = null
  this._hostParent = null
  this._rootNodeID = 0
  this._domID = 0
  this._hostContainerInfo = null
  this._topLevelWrapper = null
}

ReactDOMComponent.displayName = 'ReactDOMComponent'

ReactDOMComponent.Mixin = {
  mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
  ) {
    this._rootNodeId = globalIdCounter++
    this._domID = hostContainerInfo._idCounter++
    this._hostParent = hostParent
    this._hostContainerInfo = hostContainerInfo

    var props = this._currentElement.props

    var namespaceURI
    var parentTag
    if (hostParent !== null) {
      namespaceURI = hostParent._namespaceURI
      parentTag = hostParent._tag
    } else if (hostContainerInfo._tag) {
      namesapceURI = hostContainerInfo._namespaceURI
      parentTag = hostContainerInfo._tag
    }
    if (
      namespaceURI === null ||
      (namespaceURI === DOMNamespaces.svg && parentTag === 'foreignobject')
    ) {
      namespaceURI = DOMNamespaces.html
    }
    if (namespaceURI === DOMNamespaces.html) {
      if (this._tag === 'svg') {
        namespaceURI = DOMNamespaces.svg
      } else if (this._tag === 'math') {
        namespaceURI = DOMNamespaces.mathml
      }
    }
    this._namespaceURI = namespaceURI

    var mountImage

    if (transaction.useCreateElement) {
      var ownerDocument = hostContainerInfo._ownerDocument
      var el
      if (namespaceURI === DOMNamespaces.html) {
        if (this._tag === 'script') {
          var div = ownerDocument.createElement('div')
          var type = this._currentElement.type
          div.innerHTML = `<${type}></${type}>`
          el = div.removeChild(div.firstChild)
        } else if (props.is) {
          el = ownerDocument.createElement(this._currentElement.type, props.is)
        } else {
          el = ownerDocument.createElement(this._currentElement.type)
        }
      } else {
        el = ownerDocument.createElementNS(
          namespaceURI,
          this._currentElement.type
        )
      }
      ReactDOMComponentTree.precacheNode(this, el)
      this._flags |= Flags.hasCachedChildNodes
      if (!this._hostParent) {
        DOMPropertyOperations.setAttributeForRoot(el)
      }
      this._updateDOMProperties(null, props, transaction)
      var lazyTree = DOMLazyTree(el)
      this._createInitialChildren(transaction, props, lazyTree)
      mountImage = lazyTree
    } else {
      var tagContent = this._createContentMarkup(transaction, props)
      mountImage = '<' + this._currentElement.type + '>' + tagContent + '</' + this._currentElement.type + '>'
    }

    return mountImage
  },

  _createContentMarkup(transaction, props) {
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
        transaction
      )
      ret = mountImages.join('')
    }

    return ret
  },

  _createInitialChildren: function(transaction, props, lazyTree) {
    var innerHTML = props.dangerouslySetInnerHTML
    if (innerHTML != null) {
      if (innerHTML.__html !== null) {
        DOMLazyTree.queueHTML(lazyTree, innerHTML.__html)
      }
    } else {
      var contentToUse = CONTENT_TYPES[typeof props.children]
        ? props.children
        : null
      var childrenToUse = contentToUse !== null ? null : props.children
      if (contentToUse !== null) {
        if (contentToUse !== '') {
          DOMLazyTree.queueText(lazyTree, contentToUse)
        }
      } else if (childrenToUse !== null) {
        var mountImages = this.mountChildren(
          childrenToUse,
          transaction
        )
        for (let i = 0; i < mountImages.length; i++) {
          DOMLazyTree.queueChild(lazyTree, mountImages[i])
        }
      }
    }
  },

  receiveComponent: function(nextElement, transaction) {
    var prevElement = this._currentElement
    this._currentElement = nextElement
    this.updateComponent(transaction, prevElement, nextElement)
  },

  updateComponent: function(transaction, prevElement, nextElement) {
    var lastProps = prevElement.props
    var nextProps = this._currentElement.props

    this._updateDOMProperties(lastProps, nextProps, transaction)
    this._updateDOMChildren(lastProps, nextProps, transaction)
  },

  _updateDOMProperties: function(lastProps, nextProps, transaction) {
    var propKey
    var styleName
    var styleUpdates

    for (propKey in lastProps) {
      if (
        nextProps.hasOwnProperty(propKey) ||
        !lastProps.hasOwnProperty(propKey) ||
        lastProps[propKey] == null
      ) {
        continue
      }
      if (propKey === STYLE) {
        var lastStyle = this._previousStyleCopy
        for (styleName in lastStyle) {
          if (lastStyle.hasOwnProperty(styleName)) {
            styleUpdates = styleUpdates || {}
            styleUpdates[styleName] = ''
          }
        }
        this._previousStyleCopy = null
      } else if (isCustomComponent(this._tag, lastProps)) {
        if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
          DOMPropertyOperations.deleteValueForAttribute(getNode(this), propKey)
        }
      } else if (
        DOMPropertyOperations.properties[propKey] ||
        DOMPropertyOperations.isCustomAttribute(propKey)
      ) {
        DOMPropertyOperations.deleteValueForAttribute(getNode(this), propKey)
      }
    }
    for (propKey in nextProps) {
      var nextProp = nextProps[propKey]
      var lastProp = propKey === STYLE 
        ? this._previousStyleCopy
        : lastProps != null ? lastProps[propKey] : undefined
      if (
        !nextProps.hasOwnProperty(propKey) ||
        nextProp === lastProp ||
        (nextProp == null && lastProp == null)
      ) {
        continue
      }
      if (propKey === STYLE) {
        if (nextProp) {
          nextProp = this._previousStyleCopy = Object.assign({}, nextProp)          
        } else {
          this._previousStyleCopy = null
        }
        if (lastProp) {
          for (styleName in lastProp) {
            if (
              lastProp.hasOwnProperty(styleName) &&
              (!nextProp || !nextProp.hasOwnProperty(styleName))
            ) {
              styleUpdates = styleUpdates || {}
              styleUpdates[styleName] = ''
            }
          }
          for (styleName in nexrProp) {
            if (
              nextProp.hasOwnProperty(styleName) &&
              lastProp[styleName] !== nextProp[styleName]
            ) {
              styleUpdates = styleUpdates || {}
              styleUpdates[styleName] = nextProp[styleName]
            }
          }
        } else {
          styleUpdates = nextProp
        }
      } else if (isCustomComponent(this._tag, nextProps)) {
        if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
          DOMPropertyOperations.setValueForAttribute(
            getNode(this),
            propKey,
            nexrProp
          )
        }
      } else if (
        DOMProperty.properties[propKey] ||
        DOMProperty.isCustomAttribute(propKey)
      ) {
        var node = getNode(this)
        if (nextProp != null) {
          DOMPropertyOperations.setValueForProperty(node, propKey, nextProp)
        } else {
          DOMPropertyOperations.deleteValueForProperty(node, propKey)
        }
      }
    }
    if (styleUpdates) {
      CSSPropertyOperations.setValueForStyles(
        getNode(this),
        styleUpdates,
        this
      )
    }
  },

  _updateDOMChildren: function(lastProps, nextProps, transaction) {
    var lastContent = CONTENT_TYPES[typeof lastProps.children]
      ? lastProps.children
      : null
    var nextContent = CONTENT_TYPES[typeof nextProps.children]
      ? nextProps.children
      : null
      
    var lastHtml = 
      lastProps.dangerouslySetInnerHTML &&
      lastProps.dangerouslySetInnerHTML.__html
      
    var nextHtml =
      nextProps.dangerouslySetInnerHTML &&
      nextProps.dangerouslySetInnerHTML.__html
      
    var lastChildren = lastContent != null ? null : lastProps.children
    var nextChildren = nextContent != null ? null : nextProps.children

    var lastHasContentOrHtml = lastContent != null || lastHtml != null
    var nextHasContentOrHtml = nextContent != null || nextHtml != null

    if (lastChildren != null && nextChildren == null) {
      this.updateChildren(null, transaction)
    } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
      this.updateTextContent('')
    }

    if (nextContent != null) {
      if (lastContent !== nextContent) {
        this.updateTextContent('' + nextContent)
      }
    } else if (nextHtml != null) {
      if (lastHtml !== nextHtml) {
        this.updateMarkup('' + nextHtml)
      }
    } else if (nextChildren != null) {
      this.updateChildren(nextChildren, transaction)
    }
  }
}

Object.assign(
  ReactDOMComponent.prototype,
  ReactDOMComponent.Mixin,
  ReactMultiChild.Mixin
)

module.exports = ReactDOMComponent
