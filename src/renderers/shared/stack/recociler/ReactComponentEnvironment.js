
var injected = false

var ReactComponentEnvironment = {

  replaceNodeWithMarkup: null,

  processChildrenUpdates: null,

  injection: {
    injectEnvironment: function(environment) {
      ReactComponentEnvironment.replaceNodeWithMarkup =
        environment.replaceNodeWithMarkup
      ReactComponentEnvironment.processChildrenUpdates =
        environment.processChildrenUpdates
      injected = true 
    }
  }
}

module.exports = ReactComponentEnvironment
