// ReactDOM中有一些构造函数未定义，通过动态注入的方式实现在不同的环境下注入不同的构造函数

var ReactDefaultInjection = require('./shared/ReactDefaultInjection')  // 默认注入
var ReactMount = require('./client/ReactMount')

ReactDefaultInjection.inject()

var ReactDOM = {
  render: ReactMount.render
}

module.exports = ReactDOM
