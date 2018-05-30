var React = require('../../../React/React')
var ReactInstanceMap = require('../shared/ReactInstanceMap')
var ReactNodeTypes = require('./ReactNodeTypes')
var ReactReconciler = require('./ReactReconciler')

var shouldUpdateReactComponent = require('../shared/shouldUpdateReactComponent')

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

    // ReactUpdateQueue相关属性
    this._updateBatchNumber = null
    this._pendingElement = null
    this._pendingStateQueue = null
    this._pendingReplaceState = false
    this._pendingForceUpdate = false

    this._renderedComponent = null
    this._mountOrder= 0
    this._topLevelWrapper = null

    // ReactUpdates和ReactUpdatesQueue相关属性
    this._pendingCallbacks = null
  },

  mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
  ) {
    this._mountOrder = nextMountID++
    this._hostParent = hostParent
    this._hostContainerInfo = hostContainerInfo

    var publicProps = this._currentElement.props

    var Component = this._currentElement.type

    var updateQueue = transaction.getUpdateQueue()

    // 初始化公共类
    var doConstruct = shouldConstruct(Component)
    var inst = this._constructComponent(
      doConstruct,
      publicProps,
      updateQueue
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
    inst.updater = updateQueue

    this._instance = inst

    ReactInstanceMap.set(inst, this)

    this._pendingStateQueue = null
    this._pendingReplaceState = false
    this._pendingForceUpdate = false

    var markup = this.performInitialMount(
      renderedElement,
      hostParent,
      hostContainerInfo,
      transaction
    )


    return markup
  },

  _constructComponent: function(
    doConstruct,
    publicProps,
    updateQueue
  ) {
    return this._constructComponentWithoutOwner(
      doConstruct,
      publicProps,
      updateQueue
    )
  },

  _constructComponentWithoutOwner: function(
    doConstruct,
    publicProps,
    updateQueue
  ) {
    var Component = this._currentElement.type


    if (doConstruct) {
      return new Component(publicProps, updateQueue)
    }

    return Component(publicProps, updateQueue)
  },

  performInitialMount(
    renderedElement,
    hostParent,
    hostContainerInfo,
    transaction
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
      transaction,      
      hostParent,
      hostContainerInfo,
      debugID
    )
    
    return markup
  },

  unmountComponent: function(safely) {
    if (!this._renderedComponent) {
      return
    }

    var inst = this._instance
    
    if (this._renderedComponent) {
      ReactReconciler.unmountComponent(this._renderedComponent, safely)
      this._renderedNodeType = null
      this._renderedComponent = null
      this._instance = null
    }

    this._pendingStateQueue = null
    this._pendingReplaceState = false
    this._pendingForceUpdate = false
    this._pendingCallbacks = null
    this._pendingElement = null

    this._rootNodeID = 0
    this._topLevelWrapper = null

    ReactInstanceMap.remove(inst)
  },

  receiveComponent: function(nextElement, transaction) {
    var prevElement = this._currentElement

    this._pendingElement = null

    this.updateComponent(
      transaction,
      prevElement,
      nextElement
    )
  },

  performUpdateIfNecessary: function(transaction) {
    if (this._pendingElement != null) {
      ReactReconciler.receiveComponent(
        this,
        this._pendingElement,
        transaction,
      )
    } else if (this._pendingStateQueue !== null || this._pendingForceUpdate) {
      this.updateComponent(
        transaction,
        this._currentElement,
        this._currentElement,
      )
    } else {
      this._updateBatchNumber = null
    }
  },

  updateComponent: function(
    transaction,
    prevParentElement,
    nextParentElement
  ) {
    var inst = this._instance

    var prevProps = prevParentElement.props
    var nextProps = nextParentElement.props

    var nextState = this._processPendingState(nextProps)
    var shouldUpdate = true

    // if (!this._pendingForceUpdate) {
    //   if (inst.shouldComponentUpdate) {

    //   } else {
    //     if (this._compositeType === CompositeTypes.PureClass) {
    //       shouldUpdate = true
    //     }
    //   }
    // }

    this._updateBatchNumber = null
    if (shouldUpdate) {
      this._pendingForceUpdate = false
      this._performComponentUpdate(
        nextParentElement,
        nextProps,
        nextState,
        transaction
      )
    } else {
      this._currentElement = nextParentElement
      inst.props = nextProps
      inst.state = nextState
    }
  },

  _processPendingState: function() {
    var inst = this._instance
    var queue = this._pendingStateQueue
    var replace = this._pendingReplaceState
    this._pendingReplaceState = false
    this._pendingStateQueue = null

    if (!queue) {
      return inst.state
    }

    if (replace && queue.length === 1) {
      return queue[0]
    }

    var nextState = Object.assign({}, replace ? queue[0] : inst.state)
    for (var i = replace ? 1 : 0; i < queue.length; i++) {
      var partial = queue[i]
      Object.assign(
        nextState,
        typeof partial === 'function'
          ? partial.call(inst, nextState, props)
          : partial
      )
    }

    return nextState
  },

  _performComponentUpdate: function(
    nextElement,
    nextProps,
    nextState,
    transaction
  ) {
    var inst = this._instance

    this._currentElement = nextElement
    inst.props = nextProps
    inst.state = nextState

    this._updateRenderedComponent(transaction)

  },

  _updateRenderedComponent: function(transaction) {
    var prevComponentInstance = this._renderedComponent
    var prevRenderedElement = prevComponentInstance._currentElement
    var nextRenderedElement = this._renderValidatedComponent()

    var debugID = 0

    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
      ReactReconciler.receiveComponent(
        prevComponentInstance,
        nextRenderedElement,
        transaction
      )
    } else {
      var oldHostNode = ReactReconciler.getHostNode(prevComponentInstance)
      ReactReconciler.unmountComponent(prevComponentInstance, false)

      var nodeType = ReactNodeTypes.getType(nextRenderedElement)
      this._renderedNodeType = nodeType
      var child = this._instantiateReactComponent(
        nextRenderedElement,
        nodeType !== ReactNodeTypes.EMPTY
      )
      this._rnderedComponent = child

      var nextMarkup = ReactReconciler.mountComponent(
        child,
        transaction,
        this._hostParent,
        this._hostContainerInfo
      )

      this._replaceNodeWithMarkup(
        oldHostNode,
        nextMarkup,
        prevComponentInstance
      )
    }
    
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
