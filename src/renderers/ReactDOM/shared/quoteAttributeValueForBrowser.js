var escapeTextContentForBrowser = require('./escapeTextContentForBrowser');

/**
 * 转义属性值以防止脚本攻击
 *
 * @param {*} value Value to escape.
 * @return {string} An escaped string.
 */
function quoteAttributeValueForBrowser(value) {
  return '"' + escapeTextContentForBrowser(value) + '"';
}

module.exports = quoteAttributeValueForBrowser;
