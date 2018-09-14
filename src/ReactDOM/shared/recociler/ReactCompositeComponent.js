var React = require('../../../React/React')
var ReactCurrentOwner = require('../../../React/element/ReactCurrentOwner')
var ReactInstanceMap = require('../shared/ReactInstanceMap')
var ReactNodeTypes = require('./ReactNodeTypes')
var ReactReconciler = require('./ReactReconciler')

var emptyObject = require('fbjs/lib/emptyObject')
var invariant = require('fbjs/lib/invariant')
var shallowEqual = require('fbjs/lib/shallowEqual')
var shouldUpdateReactComponent = require('../shared/shouldUpdateReactComponent')

var CompositeTypes = {
  ImpureClass: 0,
  PureClass: 1,
  StatelessFunctional: 2
}

function StatelessComponent(Component) {}
StatelessComponent.prototype.render = function() {
  var element = Compnent(this.props, this.context, this.updater)
  return element
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent)
}

function isPureComponent(Component) {
  return !!(Component.prototype && Component.prototype.isPureReactComponent)
}

/**
 * 当组件挂载时给予一个递增的ID。这用来确保`ReactUpdates`更新脏组件的顺序
 *
 * @private
 */
var nextMountID = 1

var ReactCompositeComponent = {
  /**
   * 所有综合组件的基本构造器
   * 
   * @param {ReactElement} element
   * @final
   * @internal
   */
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

    this._renderedNodeType = null
    this._renderedComponent = null
    this._context = null
    this._mountOrder= 0
    this._topLevelWrapper = null

    // ReactUpdates和ReactUpdatesQueue相关属性
    this._pendingCallbacks = null

    // ComponentWillUnmount应当只被执行一次(flag)
    this._calledComponentWillUnmount = false
  },

  /**
   * 初始化组件，渲染html标记，注册事件监听者
   *
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {?object} hostParent
   * @param {?object} hostContainerInfo
   * @param {?object} context
   * @return {?string} 插入DOM的html标记
   * @final
   * @internal
   */
  mountComponent: function(
    transaction,
    hostParent,
    hostContainerInfo,
    context
  ) {
    this._context = context
    this._mountOrder = nextMountID++
    this._hostParent = hostParent
    this._hostContainerInfo = hostContainerInfo

    var publicProps = this._currentElement.props
    var publicContext = this._processContext(context)

    var Component = this._currentElement.type

    var updateQueue = transaction.getUpdateQueue()

    // 初始化公共类
    var doConstruct = shouldConstruct(Component)
    var inst = this._constructComponent(
      doConstruct,
      publicProps,
      publicContext,
      updateQueue
    )
    var renderedElement

    // 支持函数组件
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

    // 这些属性需要在构造器里设置，但是方便更简单的类抽象，我们在事后设置它们
    inst.props = publicProps
    inst.context = publicContext
    inst.refs = emptyObject
    inst.updater = updateQueue

    this._instance = inst

    // 存储一个实例到内部表示的引用
    ReactInstanceMap.set(inst, this)

    var initialState = inst.state
    if (initialState === undefined) {
      inst.state = initialState = null
    }

    this._pendingStateQueue = null
    this._pendingReplaceState = false
    this._pendingForceUpdate = false

    var markup
    if (inst.unstable_handleError) {
      markup = this.performInitialMountWithErrorHandling(
        renderedElement,
        hostParent,
        hostContainerInfo,
        transaction,
        context,
      )
    } else {
      markup = this.performInitialMount(
        renderedElement,
        hostParent,
        hostContainerInfo,
        transaction,
        context
      )
    }

    if (inst.componentDidMount) {
      transaction.getReactMountReady().enqueue(inst.componentDidMount, inst)
    }

    return markup
  },

  _constructComponent: function(
    doConstruct,
    publicProps,
    publicContext,
    updateQueue
  ) {
    if (!doConstruct) {
      ReactCurrentOwner.current = this
      try {
        return this._constructComponentWithoutOwner(
          doConstruct,
          publicProps,
          publicContext,
          updateQueue
        )
      } finally {
        ReactCurrentOwner.current = null
      }
    } else {
      return this._constructComponentWithoutOwner(
        doConstruct,
        publicProps,
        publicContext,
        updateQueue
      )
    }
  },

  _constructComponentWithoutOwner: function(
    doConstruct,
    publicProps,
    publicContext,
    updateQueue
  ) {
    var Component = this._currentElement.type


    if (doConstruct) {
      return new Component(publicProps, publicContext, updateQueue)
    }

    return Component(publicProps, publicContext, updateQueue)
  },

  performInitialMountWithErrorHandling: function(
    renderedElement,
    hostParent,
    hostContainerInfo,
    transaction,
    context
  ) {
    var markup
    var checkpoint = transaction.checkpoint()
    try {
      mark = this.performInitialMount(
        renderedElement,
        hostParent,
        hostContainerInfo,
        transaction,
        context
      )
    } catch (e) {
      // 返回检查点，处理错误(可能增加一些东西到transaction)，并且创建一个新检查点
      transaction.rollback(checkpoint)
      this._instance.unstable_handleError(e)
      if (this._pendingStateQueue) {
        this._instance.state = this._processPendingState(
          this._instance.props,
          this._instance.context
        )
      }
      checkpoint = transaction.checkpoint()

      this._renderedComponent.unmountComponent(true)
      transaction.rollback(checkpoint)

      // 再次尝试，我们已经通知组件错误信息，因此它们这次可以展示一个错误信息
      // 如果这次再次抛错，这个错误将会冒泡（并且可以被更高的错误边界捕获）
      mark = this.performInitialMount(
        renderedElement,
        hostParent,
        hostContainerInfo,
        transaction,
        context
      )
    }

    return markup
  },

  performInitialMount(
    renderedElement,
    hostParent,
    hostContainerInfo,
    transaction,
    context
  ) {
    var inst = this._instance

    var debugID = 0

    if (inst.componentWillMount) {
      inst.componentWillMount()

      // 当挂载时，componentWillMount里调用setState将设置`this._pendingStateQueue`而不触发重新渲染
      if (this._pendingStateQueue) {
        inst.state = this._processPendingState(inst.props, inst.context)
      }
    }

    // 如果不是一个无状态组件，我们现在渲染
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
      this._processContext(context),
      debugID
    )
    
    return markup
  },

  getHostNode: function() {
    return ReactReconciler.getHostNode(this._renderedComponent)
  },

  /**
   * 释放`mountComponent`分配的所有资源
   *
   * @final
   * @internal
   */
  unmountComponent: function(safely) {
    if (!this._renderedComponent) {
      return
    }

    var inst = this._instance

    if (inst.componentWillUnmount && !inst._calledComponentWillUnmount) {
      inst._calledComponentWillUnmount = true

      if (safely) {
        var name = this.getName() + '.componentWillUnmount()'
        ReactErrorUtils.invokeGuardedCallback(
          name,
          inst.componentWillUnmount.bind(inst)
        )
      } else {
        inst.componentWillUnmount()
      }
    }
    
    if (this._renderedComponent) {
      ReactReconciler.unmountComponent(this._renderedComponent, safely)
      this._renderedNodeType = null
      this._renderedComponent = null
      this._instance = null
    }

    // 重置pending字段
    // 即使这个组件在ReactUpdates内计划另一次更新，它也将会被无视因为这些字段重置了
    this._pendingStateQueue = null
    this._pendingReplaceState = false
    this._pendingForceUpdate = false
    this._pendingCallbacks = null
    this._pendingElement = null

    // 这些字段并不是真的需要重置因为这个对象再也不能访问到了
    this._context = null
    this._rootNodeID = 0
    this._topLevelWrapper = null

    // 删除实例到内部表示的引用，即使用户泄漏对公共实例的引用，也可以正确清除内部
    ReactInstanceMap.remove(inst)

    // 一些存在的组件依赖inst.props，即使他们已经被摧毁了(在事件处理中)
  },

  /**
   * 过滤context对象转换为只包含`contextTypes`里面的key
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _maskContext: function(context) {
    var Component = this._currentElement.type
    var contextTypes = Component.contextTypes
    if (!contextTypes) {
      return emptyObject
    }
    var maskedContext = {}
    for (var contextName in contextTypes) {
      maskedContext[contextName] = context[contextName]
    }
    return maskedContext
  },

  _processContext: function(context) {
    var maskedContent = this._maskContext(context)

    return maskedContent
  },

  receiveComponent: function(nextElement, transaction, nextContext) {
    var prevElement = this._currentElement
    var prevContext = this._context

    this._pendingElement = null

    this.updateComponent(
      transaction,
      prevElement,
      nextElement,
      prevContext,
      nextContext
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


  /**
   * 执行一个已经挂载组件的更新。调用componentWillReceiveProps和shouldComponentUpdate方法，然后(假设更新没有被跳过)调用剩下的更新生命周期方法并且更新DOM
   *
   * 默认的，这个实现了React的渲染和协调算法，复杂的客户端可能希望重写这个。
   *
   * @param {ReactReconcileTransaction} transaction
   * @param {ReactElement} prevParentElement
   * @param {ReactElement} nextParentElement
   * @internal
   * @overridable
   */
  updateComponent: function(
    transaction,
    prevParentElement,
    nextParentElement,
    prevUnmaskedContext,
    nextUnmaskedContext
  ) {
    var inst = this._instance

    var willReceive = false
    var nextContext

    // 确定context是否改变
    if (this._context === nextUnmaskedContext) {
      nextContext = inst.context
    } else {
      nextContext = this._processContext(nextUnmaskedContext)
      willReceive = true
    }

    var prevProps = prevParentElement.props
    var nextProps = nextParentElement.props

    // 没有简单的state更新但是有一个props更新
    if (prevParentElement !== nextParentElement) {
      willReceive = true
    }

    // 这里的更新将会安排一个更新，但是会立即设置_pendingStateQueue来确保任何state更新立即调度而不是等待下一轮
    if (willReceive && inst.componentWillReceiveProps) {
      inst.componentWillReceiveProps(nextProps, nextContext)
    }

    var nextState = this._processPendingState(nextProps)
    var shouldUpdate = true

    if (!this._pendingForceUpdate) {
      if (inst.shouldComponentUpdate) {
        shouldUpdate = inst.shouldComponentUpdate(
          nextProps,
          nextState,
          nextContext
        )
      } else {
        if (this._compositeType === CompositeTypes.PureClass) {
          shouldUpdate =
            !shallowEqual(prevProps, nextProps) ||
            !shallowEqual(inst.state, nextState)
        }
      }
    }

    this._updateBatchNumber = null
    if (shouldUpdate) {
      this._pendingForceUpdate = false
      // 将设置 `this.props`, `this.state` 和 `this.context`
      this._performComponentUpdate(
        nextParentElement,
        nextProps,
        nextState,
        nextContext,
        transaction,
        nextUnmaskedContext
      )
    } else {
      // 如果确定了组件不需要更新，我们仍然希望设置props和state，但是我们走了个捷径进行剩下的更新
      this._currentElement = nextParentElement
      this._context = nextUnmaskedContext
      inst.props = nextProps
      inst.state = nextState
      inst.context = nextContext
    }
  },

  _processPendingState: function(props, context) {
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
          ? partial.call(inst, nextState, props, context)
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
