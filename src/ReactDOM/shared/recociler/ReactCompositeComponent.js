var React = require('../../../React/React')
var ReactNodeTypes = require('./ReactNodeTypes')
var ReactReconciler = require('./ReactReconciler')

var CompositeTypes = {
  ImpureClass: 0,
  PureClass: 1,
  StatelessFunctional: 2
}

function StatelessComponent(Component) {}
StatelessComponent.prototype.render = function() {
  // var Component = ReactIn
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent)
}

function isPureComponent(Component) {
  return !!(Component.prototype && Component.prototype.isPureReactComponent)
}

var nextMountID = 1

var ReactCompositeComponent = {
  construct: function(element) {
    this._currentElement = element
    this._rootNodeID = 0
    this._compositeType = null
    this._instance = null
    this._hostParent = null
    this._hostContainerInfo = null

    this._renderedComponent = null
    this._mountOrder= 0
    this._topLevelWrapper = null
  },

  mountComponent: function(
    hostParent,
    hostContainerInfo,
  ) {
    this._mountOrder = nextMountID++
    this._hostParent = hostParent
    this._hostContainerInfo = hostContainerInfo

    var publicProps = this._currentElement.props

    var Component = this._currentElement.type

    var doConstruct = shouldConstruct(Component)

    var inst = this._constructComponent(
      doConstruct,
      publicProps,
    )

    var renderedElement


    if (!doConstruct && (inst == null || inst.render == null)) {
      renderedElement = inst
      inst = new StatelessComponent(Component)
      this._compositeType = CompositeTypes.StatelessFunctional
    } else {
      if (isPureComponent(Component)) {
        this._compositeType = CompositeTypes.PureClass
      } else {
        this._compositeType = CompositeTypes.ImpureClass
      }
    }


    inst.props = publicProps

    this._instance = inst

    var markup = this.performInitialMount(
      renderedElement,
      hostParent,
      hostContainerInfo,
    )


    return markup
  },

  _constructComponent: function(
    doConstruct,
    publicProps,
  ) {
    return this._constructComponentWithoutOwner(
      doConstruct,
      publicProps,
    )
  },

  _constructComponentWithoutOwner: function(
    doConstruct,
    publicProps,
  ) {
    var Component = this._currentElement.type


    if (doConstruct) {
      return new Component(publicProps)
    }

    return Component(publicProps)
  },

  performInitialMount(
    renderedElement,
    hostParent,
    hostContainerInfo,
  ) {
    var inst = this._instance

    var debugID = 0

    if (renderedElement === undefined) {
      renderedElement = this._renderValidatedComponent()
    }

    var nodeType = ReactNodeTypes.getType(renderedElement)
    this._renderedNodeType = nodeType
    var child = this._instantiateReactComponent(
      renderedElement,
      nodeType !== ReactNodeTypes.EMPTY
    )
    this._renderedComponent = child


    var markup = ReactReconciler.mountComponent(
      child,
      hostParent,
      hostContainerInfo,
      debugID
    )

    return markup
  },

  _renderValidatedComponentWithoutOwnerOrContext() {
    var inst = this._instance
    var renderedElement


    renderedElement = inst.render()

    return renderedElement
  },

  _renderValidatedComponent: function() {
    var renderedElement

    renderedElement = this._renderValidatedComponentWithoutOwnerOrContext()

    return renderedElement
  },

  _instantiateReactComponent: null
}

module.exports = ReactCompositeComponent
