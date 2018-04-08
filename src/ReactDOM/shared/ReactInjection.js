// 注入器

var ReactEmptyComponent = require('./recociler/ReactEmptyComponent')
var ReactHostComponent = require('./recociler/ReactHostComponent')

var ReactInject = {
  EmptyComponent: ReactEmptyComponent.injection,
  HostComponent: ReactHostComponent.injection
}

module.exports = ReactInject
