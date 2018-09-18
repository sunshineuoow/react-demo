var ReactOwner = require('./ReactOwner')

var ReactRef = {}

function attachRef(ref, component, owner) {
  if (typeof ref === 'function') {
    ref(component.getPublicInstance())
  } else {
    // 遗留ref
    ReactOwner.addComponentAsRefTo(component, ref, owner)
  }
}

function detachRef(ref, component, owner) {
  if (typeof ref === 'function') {
    ref(null)
  } else {
    // 遗留ref
    ReactOwner.removeComponentAsRefFrom(component, ref, owner)
  }
}

ReactRef.attachRefs = function(
  instance,
  element
) {
  if (element === null || typeof element !== 'object') {
    return
  }
  var ref = element.ref
  if (ref != null) {
    attachRef(ref, instance, element._owner)
  }
}

ReactRef.shouldUpdateRefs = function(
  prevElement,
  nextElement
) {
  // 如果所有者或者ref发生了改变，确保最近的所有者存储着this的引用，并且之前的所有者（如果不同）遗忘了this的引用
  // 我们使用元素而不是公开的this.props，因为后期处理无法确定一个ref。ref在概念上依赖于元素

  // TODO: Should this even be possible? The owner cannot change because
  // it's forbidden by shouldUpdateReactComponent. The ref can change
  // if you swap the keys of but not the refs. Reconsider where this check
  // is made. It probably belongs where the key checking and
  // instantiateReactComponent is done.
  var prevRef = null
  var prevOwner = null
  if (prevElement !== null && typeof prevElement === 'object') {
    prevRef = prevElement.ref
    prevOwner = prevElement._owner
  }

  var nextRef = null
  var nextOwner = null
  if (nextElement !== null && typeof nextElement === 'object') {
    nextRef = nextElement.ref
    nextOwner = nextElement._owner
  }

  return (
    prevRef !== nextRef ||
    // 如果所有者改变了但是我们有一个没有改变的ref函数，那么不更新refs
    (typeof nextRef === 'string' && nextOwner !== prevOwner)
  )
}

ReactRef.detachRefs = function(
  instance,
  element
) {
  if (element === null || typeof element !== 'object') {
    return
  }
  var ref = element.ref
  if (ref != null) {
    detachRef(ref, instance, element._owner)
  }
}

module.exports = ReactRef