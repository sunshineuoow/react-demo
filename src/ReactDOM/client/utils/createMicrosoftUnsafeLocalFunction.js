/* globals MSApp */

/**
 * 在window8的app上创建一个拥有不安全特权的函数 
 */
var createMicrosoftUnsafeLocalFunction = function(func) {
  if (typeof MSApp !== 'undefined' && MSApp.execUnsafeLocalFunction) {
    return function(arg0, arg1, arg2, arg3) {
      MSApp.execUnsafeLocalFunction(function() {
        return func(arg0, arg1, arg2, arg3)
      })
    }
  } else {
    return func
  }
}

module.exports = createMicrosoftUnsafeLocalFunction