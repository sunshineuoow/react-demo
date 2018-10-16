var createNodesFromMarkup = require('fbjs/lib/createNodesFromMarkup')

var Danger = {
  /**
   * 用一个字符串标记替换当前节点在其父节点的当前位置，这个标记必须渲染在单个根节点上。
   * @param {DOMElement} oldChild 要替换的子节点
   * @param {string} markup 替换子节点的渲染标记
   */
  dangerouslyReplaceNodeWithMarkup: function(oldChild, markup) {
    if (typeof markup === 'string') {
      var newChild = createNodesFromMarkup(markup, function() {})[0]
      oldChild.parentNode.replaceChild(newChild, oldChild)
    } else {
      DOMLazyTree.replaceChildWithTree(oldChild, markup)
    }
  }
}

module.exports = Danger