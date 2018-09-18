var React = require('../../../React/React')
var ReactComponentEnvironment = require('./ReactComponentEnvironment')
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
  var Component = ReactInstanceMap.get(this)._currentElement.type
  var element = Component(this.props, this.context, this.updater)
  return element
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent)
}

function isPureComponent(Component) {
  return !!(Component.prototype && Component.prototype.isPureReactComponent)
}

/**
 * ------------------ 组合组件的生命周期 ------------------
 *
 * - 构造器：初始化state。实例现在被保留。
 *   - componentWillMount
 *   - render
 *   - [children's constructors]
 *     - [children's componentWillMount and render]
 *     - [children's componentDidMount]
 *     - componentDidMount
 *
 *       Update Phases:
 *       - componentWillReceiveProps (only called if parent updated)
 *       - shouldComponentUpdate
 *         - componentWillUpdate
 *           - render
 *           - [children's constructors or receive props phases]
 *         - componentDidUpdate
 *
 *     - componentWillUnmount
 *     - [children's componentWillUnmount]
 *   - [children destroyed]
 * - (destroyed): The instance is now blank, released by React and ready for GC.
 *
 * -----------------------------------------------------------------------------
 */


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

  /**
   * 过滤context对象，仅保留`contextTypes`内包含的key，并且校验是否合法。
   *
   * @param {object} context
   * @return {?object}
   * @private
   */
  _processContext: function(context) {
    var maskedContent = this._maskContext(context)

    return maskedContent
  },

  /**
   * @param {object} currentContext
   * @return {object}
   * @private
   */
  _processChildContext: function(currentContext) {
    var Component = this._currentElement.type
    var inst = this._instance
    var childContext

    if (inst.getChildContext) {
      childContext = inst.getChildContext()
    }

    if (childContext) {
      return Object.assign({}, currentContext, childContext)
    }
    return currentContext
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

  /**
   * 如果`_pendingElement`, `_pendingStateQueue`或者`_pendingForceUpdate`任何一个被设置，更新组件
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function(transaction) {
    if (this._pendingElement != null) {
      ReactReconciler.receiveComponent(
        this,
        this._pendingElement,
        transaction,
        this._context
      )
    } else if (this._pendingStateQueue !== null || this._pendingForceUpdate) {
      this.updateComponent(
        transaction,
        this._currentElement,
        this._currentElement,
        this._context,
        this._context
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

  /**
   * 合并新的props和state，通知委托更新方法并且执行更新
   * Merges new props and state, notifies delegate methods of update and
   * performs update.
   *
   * @param {ReactElement} nextElement Next element
   * @param {object} nextProps Next public object to set as properties.
   * @param {?object} nextState Next object to set as state.
   * @param {?object} nextContext Next public object to set as context.
   * @param {ReactReconcileTransaction} transaction
   * @param {?object} unmaskedContext
   * @private
   */
  _performComponentUpdate: function(
    nextElement,
    nextProps,
    nextState,
    nextContext,
    transaction,
    unmaskedContext
  ) {
    var inst = this._instance

    var hasComponentDidUpdate = Boolean(inst.componentDidUpdate)
    var prevProps
    var prevState
    var prevContext
    if (hasComponentDidUpdate) {
      prevProps = inst.props
      prevState = inst.state
      prevContext = inst.context
    }

    if(inst.componentWillUpdate) {
      inst.componentWillUpdate(nextProps, nextState, nextContext)
    }

    this._currentElement = nextElement
    this._context = unmaskedContext
    inst.props = nextProps
    inst.state = nextState
    inst.context = nextContext

    this._updateRenderedComponent(transaction, unmaskedContext)

    if (hasComponentDidUpdate) {
      transaction
        .getReactMountReady()
        .enqueue(
          inst.componentDidUpdate.bind(
            inst,
            prevProps,
            prevState,
            prevContext
          ),
          inst
        )
    }
  },

  /**
   * 调用组件的render方法从而更新DOM
   *
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  _updateRenderedComponent: function(transaction, context) {
    var prevComponentInstance = this._renderedComponent
    var prevRenderedElement = prevComponentInstance._currentElement
    var nextRenderedElement = this._renderValidatedComponent()

    var debugID = 0

    if (shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
      ReactReconciler.receiveComponent(
        prevComponentInstance,
        nextRenderedElement,
        transaction,
        this._processChildContext(context)
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
        this._hostContainerInfo,
        this._processChildContext(context),
        debugID
      )

      this._replaceNodeWithMarkup(
        oldHostNode,
        nextMarkup,
        prevComponentInstance
      )
    }
  },

  /**
   * 重写浅渲染
   *
   * @protected
   */
  _replaceNodeWithMarkup: function(oldHostNode, nextMarkup, prevInstance) {
    ReactComponentEnvironment.replaceNodeWithMarkup(
      oldHostNode,
      nextMarkup,
      prevInstance
    )
  },


  /**
   * @protected
   */
  _renderValidatedComponentWithoutOwnerOrContext() {
    var inst = this._instance
    var renderedElement


    renderedElement = inst.render()

    return renderedElement
  },

  /**
   * @protected
   */
  _renderValidatedComponent: function() {
    var renderedElement
    if (this._compositeType !== CompositeTypes.StatelessFunctional) {
      ReactCurrentOwner.current = this
      try {
        renderedElement = this._renderValidatedComponentWithoutOwnerOrContext()
      } finally {
        ReactCurrentOwner.current = null
      }
    } else {
      renderedElement = this._renderValidatedComponentWithoutOwnerOrContext()
    }


    return renderedElement
  },

  /**
   * 惰性分配refs对象并且将组件保存为ref
   *
   * @param {string} ref 引用名.
   * @param {component} component 作为ref存储的组件.
   * @final
   * @private
   */
  attachRef: function(ref, component) {
    var inst = this.getPublicInstance()
    var publicComponentInstance = component.getPublicInstance()
    var refs = inst.refs = emptyObject ? (inst.refs = {}) : inst.refs
    refs[ref] = publicComponentInstance
  },

  /**
   * 删除引用名.
   *
   * @param {string} ref 解除引用的名称
   * @final
   * @private
   */
  detachRef: function(ref) {
    var refs = this.getPublicInstance().refs
    delete refs[ref]
  },

  /**
   * 获取组件的文本描述用于在错误信息中标识
   * @return {string} The name or null.
   * @internal
   */
  getName: function() {
    var type = this._currentElement.type
    var constructor = this._instance && this._instance.constructor
    return (
      type.displayName ||
      (constructor && constructor.displayName) ||
      type.name ||
      (constructor && constructor.name) ||
      null
    )
  },

  /**
   * 获取这个组件的公开访问的表示形式 - 即由refs公开并且由render返回的内容。无状态组件可以返回null。
   *
   * @return {ReactComponent} the public component instance.
   * @internal
   */
  getPublicInstance: function() {
    var inst = this._instance
    if (this._compositeType === CompositeTypes.StatelessFunctional) {
      return null
    }
    return inst
  },

  // 存根
  _instantiateReactComponent: null
}

module.exports = ReactCompositeComponent
