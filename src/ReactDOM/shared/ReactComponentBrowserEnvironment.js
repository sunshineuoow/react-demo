var DOMChildrenOperations = require('../client/utils/DOMChildrenOperations.js')
var ReactDOMIDOperations = require('../client/ReactDOMIDOperations.js')

var ReactComponentBrowserEnvironment = {
  processChildrenUpdates:
    ReactDOMIDOperations.dangerouslyProcessChildrenUpdates,
  
  replaceNodeWithMarkup: DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup
}

module.exports = ReactComponentBrowserEnvironment
