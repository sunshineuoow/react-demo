// 注入器
var ReactComponentEnvironment = require('./recociler/ReactComponentEnvironment')
var ReactEmptyComponent = require('./recociler/ReactEmptyComponent')
var ReactHostComponent = require('./recociler/ReactHostComponent')
var ReactUpdates = require('./recociler/ReactUpdates')

var ReactInjection = {
  Component: ReactComponentEnvironment.injection,
  EmptyComponent: ReactEmptyComponent.injection,
  HostComponent: ReactHostComponent.injection,
  Updates: ReactUpdates.injection
}

module.exports = ReactInjection
