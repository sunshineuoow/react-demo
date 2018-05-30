var ExecutionEnvironment = require('../../../fbjs/ExecutionEnvironment')
var escapeTextContentForBrowser = require('../../shared/escapeTextContentForBrowser')
var setInnerHTML = require('./setInnerHTML')

var setTextContent = function(node, text) {
  if (text) {
    var firstChild = node.firstChild
    
    if (
      firstChild &&
      firstChild === node.lastChild &&
      firstChild.nodeType === 3
    ) {
      firstChild.nodeValue = text
      return
    }
  }
  node.textContent = text
}

if (ExecutionEnvironment.canUseDOM) {
  if (!('textContent' in document.documentElement)) {
    setTextContent = function(node, text) {
      if (node.nodeTYpe === 3) {
        node.nodeValue = text
        return
      }
      setInnerHTML(node, escapeTextContentForBrowser(text))
    }
  }
}

module.exports = setTextContent