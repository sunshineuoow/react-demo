/**
 * 返回A和B的最低共同祖先，如果它们在不同的树种则返回null
 */
function getLowestCommonAncestor(instA, instB) {
  var depthA = 0
  for (var tempA = instA; tempA; tempA = tempA._hostParent) {
    depthA++
  }
  var depthB = 0
  for (var tempB = instB; tempB; tempB = tempB._hostParent) {
    depthB++
  }

  // If A is deeper, crawl up.
  while (depthA - depthB > 0) {
    instA = instA._hostParent
    depthA--
  }

  // If B is deeper, crawl up.
  while (depthB - depthA > 0) {
    instB = instB._hostParent
    depthB--
  }

  // Walk in lockstep until we find a match.
  var depth = depthA
  while (depth--) {
    if (instA === instB) {
      return instA
    }
    instA = instA._hostParent
    instB = instB._hostParent
  }
  return null
}

/**
 * 返回A是否是B的祖先
 */
function isAncestor(instA, instB) {
  while (instB) {
    if (instB === instA) {
      return true
    }
    instB = instB._hostParent
  }
  return false
}

/**
 * 返回传入的实例的父实例
 */
function getParentInstance(inst) {
  return inst._hostParent
}

/**
 * 模拟两阶段捕获/冒泡事件派发的遍历
 */
function traverseTwoPhase(inst, fn, arg) {
  var path = []
  while (inst) {
    path.push(inst)
    inst = inst._hostParent
  }
  var i
  for (i = path.length; i-- > 0; ) {
    fn(path[i], 'captured', arg)
  }
  for (i = 0; i < path.length; i++) {
    fn(path[i], 'bubbled', arg)
  }
}

/**
 * Traverses the ID hierarchy and invokes the supplied `cb` on any IDs that
 * should would receive a `mouseEnter` or `mouseLeave` event.
 *
 * Does not invoke the callback on the nearest common ancestor because nothing
 * "entered" or "left" that element.
 */
function traverseEnterLeave(from, to, fn, argFrom, argTo) {
  var common = from && to ? getLowestCommonAncestor(from, to) : null
  var pathFrom = []
  while (from && from !== common) {
    pathFrom.push(from)
    from = from._hostParent
  }
  var pathTo = []
  while (to && to !== common) {
    pathTo.push(to)
    to = to._hostParent
  }
  var i
  for (i = 0; i < pathFrom.length; i++) {
    fn(pathFrom[i], 'bubbled', argFrom)
  }
  for (i = pathTo.length; i-- > 0; ) {
    fn(pathTo[i], 'captured', argTo)
  }
}

module.exports = {
  isAncestor: isAncestor,
  getLowestCommonAncestor: getLowestCommonAncestor,
  getParentInstance: getParentInstance,
  traverseTwoPhase: traverseTwoPhase,
  traverseEnterLeave: traverseEnterLeave
}
