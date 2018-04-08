// React核心，jsx可以通过transform-react-jsx插件转化为React.createElement
// 自定义组件本质是继承了Component

var ReactBaseClasses = require('./class/ReactBaseClasses')
var ReactElement = require('./element/ReactElement')

var createElement = ReactElement.createElement

var React = {
  Component: ReactBaseClasses.Component,

  createElement: createElement,
  isValidElement: ReactElement.isValidElement
}

module.exports = React
