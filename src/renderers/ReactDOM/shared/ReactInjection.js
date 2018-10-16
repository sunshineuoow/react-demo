// 注入器
var EventPluginHub = require('../../shared/stack/event/EventPluginHub')
var EventPluginUtils = require('../../shared/stack/event/EventPluginUtils')
var ReactComponentEnvironment = require('../../shared/stack/recociler/ReactComponentEnvironment')
var ReactEmptyComponent = require('../../shared/stack/recociler/ReactEmptyComponent')
var ReactBrowserEventEmitter = require('../client/ReactBrowserEventEmitter')
var ReactHostComponent = require('../../shared/stack/recociler/ReactHostComponent')
var ReactUpdates = require('../../shared/stack/recociler/ReactUpdates')

var ReactInjection = {
  Component: ReactComponentEnvironment.injection,
  EmptyComponent: ReactEmptyComponent.injection,
  EventPluginHub: EventPluginHub.injection,
  EventPluginUtils: EventPluginUtils.injection,
  EventEmitter: ReactBrowserEventEmitter.injection,
  HostComponent: ReactHostComponent.injection,
  Updates: ReactUpdates.injection
}

module.exports = ReactInjection
