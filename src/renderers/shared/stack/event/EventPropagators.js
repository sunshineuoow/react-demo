var EventPluginHub = require('./EventPluginHub')
var EventPluginUtils = require('./EventPluginUtils')

var accumulateInto = require('../../utils/accumulateInto')
var forEachAccumulated = require('../../utils/forEachAccumulated')

var getListener = EventPluginHub.getListener

/**
 * 一些事件类型具有不同传播'阶段'拥有不同注册名称的概念。这会在指定阶段寻找对应的监听者。
 */
function listenerAtPhase(inst, event, propagationPhase) {
  var registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase]
  return getListener(inst, registrationName)
}

/**
 * 使用派发的监听者标记`SyntheticEvent`。在这里创建这个函数，允许我们不惜为每个事件创建或者绑定函数。
 * 改变事件成员允许我们不必创建一个包装好事件与监听者配对的`dispatch`对象。
 */
function accumulateDirectionalDispatches(inst, phase, event) {
  var listener = listenerAtPhase(inst, event, phase)
  if (listener) {
    event._dispatchListeners = accumulateInto(event._dispatchListeners, listener)
    event._dispatchInstances = accumulateInto(event._dispatchInstances, inst)
  }
}

/**
 * 收集派发者(必须在派发前完全收集 - 参见单元测试)。惰性分配数组以节约内存。
 * 我们必须遍历每个事件并且对每个事件执行遍历。我们不能整个事件集合进行单一遍历，
 * 因为每个事件可能有不同的目标。
 */
function accumulateTwoPhaseDispatchesSingle(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    EventPluginUtils.traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event)
  }
}

/**
 * Same as `accumulateTwoPhaseDispatchesSingle`, but skips over the targetID.
 */
function accumulateTwoPhaseDispatchesSingleSkipTarget(event) {
  if (event && event.dispatchConfig.phasedRegistrationNames) {
    var targetInst = event._targetInst
    var parentInst = targetInst ? EventPluginUtils.getParentInstance(targetInst) : null
    EventPluginUtils.traverseTwoPhase(parentInst, accumulateDirectionalDispatches, event)
  }
}

/**
 * 累计不考虑方向，不寻找分阶段注册名称。和`accumulateDirectDispatchesSingle`相同但是不要求`dispatchMarker`和派发ID一致。
 */
function accumulateDispatches(inst, ignoredDirection, event) {
  if (event && event.dispatchConfig.registrationName) {
    var registrationName = event.dispatchConfig.registrationName
    var listener = getListener(inst, registrationName)
    if (listener) {
      event._dispatchListeners = accumulateInto(event._dispatchListeners, listener)
      event._dispatchInstances = accumulateInto(event._dispatchInstances, inst)
    }
  }
}

/**
 * 在一个合成事件上累计派发，但是仅仅针对`dispatchMarker`
 * @param {SyntheticEvent} event
 */
function accumulateDirectDispatchesSingle(event) {
  if (event && event.dispatchConfig.registrationName) {
    accumulateDispatches(event._targetInst, null, event)
  }
}

function accumulateTwoPhaseDispatches(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle)
}

function accumulateTwoPhaseDispatchesSkipTarget(events) {
  forEachAccumulated(events, accumulateTwoPhaseDispatchesSingleSkipTarget)
}

function accumulateEnterLeaveDispatches(leave, enter, from, to) {
  EventPluginUtils.traverseEnterLeave(from, to, accumulateDispatches, leave, enter)
}

function accumulateDirectDispatches(events) {
  forEachAccumulated(events, accumulateDirectDispatchesSingle)
}

/**
 * 一小部分传播模式，每个传播模式将接收少量信息，并且生成一组'调度就绪事件对象' - 这些对象是已经被一系列派发过的监听者函数/id注释的事件集合。
 * 该API以这种方式设计，用于阻止真正执行派发时的传播策略，因为我们总是希望在执行单个事件派发之前手机整个派发的集合
 *
 * @constructor EventPropagators
 */
var EventPropagators = {
  accumulateTwoPhaseDispatches: accumulateTwoPhaseDispatches,
  accumulateTwoPhaseDispatchesSkipTarget: accumulateTwoPhaseDispatchesSkipTarget,
  accumulateDirectDispatches: accumulateDirectDispatches,
  accumulateEnterLeaveDispatches: accumulateEnterLeaveDispatches
}

module.exports = EventPropagators
