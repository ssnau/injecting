// copied from get-parameter-names
var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg

function extract (c) {
  var code = c.replace(COMMENTS, '')
  var result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
    .match(/([^\s,]+)/g)
  return result === null ? [] : result
}

function getParameterNames (fn) {
  var code = fn.toString().replace(COMMENTS, '')
  var result = extract(code)

  // es6 class
  if (code.indexOf('class ') === 0) {
    if (code.indexOf('constructor') === -1) return []
    return extract(code.slice(code.indexOf('constructor')))
  }

  // arrow function without parenthesis
  var arrowIndex = code.indexOf('=>')
  var parenIndex = code.indexOf('(')
  if (!fn.prototype && arrowIndex !== -1 &&
     (parenIndex > arrowIndex || parenIndex === -1)) {
    var arrowParams = code.slice(0, arrowIndex).trim()
    return [arrowParams.indexOf(' ') === -1 ? arrowParams : arrowParams.split(' ')[1]]
  }

  return result
}

module.exports = getParameterNames
