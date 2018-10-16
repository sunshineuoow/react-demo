var caughtError = null

/**
 * 调用一个函数，同时防止其中发生的错误
 *
 * @param {String} name of the guard to use for logging or debugging
 * @param {Function} func The function to invoke
 * @param {*} a First argument
 * @param {*} b Second argument
 */
function invokeGuardedCallback(
  name,
  func,
  a
) {
  try {
    func(a);
  } catch (x) {
    if (caughtError === null) {
      caughtError = x;
    }
  }
}

var ReactErrorUtils = {
  invokeGuardedCallback: invokeGuardedCallback,

  /**
   * 被ReactTestUtils.Simulate调用，以便事件处理程序抛出的错误都能被`rethrowCaughtError`重新抛出
   */
  invokeGuardedCallbackWithCatch: invokeGuardedCallback,

  /**
   * 在保护函数执行期间我们将捕获第一个错误，并且将重新抛出给顶级错误处理程序处理。
   */
  rethrowCaughtError: function() {
    if (caughtError) {
      var error = caughtError;
      caughtError = null;
      throw error;
    }
  }
}

module.exports = ReactErrorUtils;
