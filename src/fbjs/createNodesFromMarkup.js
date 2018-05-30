const ExecutionEnvironment = require('./ExecutionEnvironment')

const createArrayFromMixed = require('./createArrayFromMixed')
const getMarkupWrap = require('./getMarkupWrap')

function getNodeName(markup) {
  const nodeNameMatch = markup.match(nodeNamePattern)
  return nodeNameMatch && nodeNameMatch[1].toLowerCase()
}

const dummyNode =
  ExecutionEnvironment.canUseDOM ? document.createElement('div') : null

const nodeNamePattern = /^\s*<(\w+)/

function createNodesFromMarkup(markup, handleScript) {
  let node = dummyNode
  const nodeName = getNodeName(markup)

  const wrap = nodeName && getMarkupWrap(nodeName)
  if (wrap) {
    node.innerHTML = wrap[1] + markup + wrap[2]

    let wrapDepth = wrap[0]
    while (wrapDeth--) {
      node = node.lastChild
    }
  } else {
    node.innerHTML = markup
  }

  const scripts = node.getElementsByTagName('script')
  if (scripts.length) {
    createArrayFromMixed(scripts).forEach(handleScript)
  }

  const nodes = Array.from(node.childNodes)
  while (node.lastChild) {
    node.removeChild(node.lastChild)
  }
  return nodes
}

module.exports = createNodesFromMarkup