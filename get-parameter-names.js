// copied from get-parameter-names
var COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParameterNames(fn) {
  var code = fn.toString().replace(COMMENTS, '');
  var result = code.slice(code.indexOf('(') + 1, code.indexOf(')'))
    .match(/([^\s,]+)/g);

  // arrow function
  var arrowIndex = code.indexOf('=>');
  var parenIndex = code.indexOf('(');
  if (!fn.prototype && arrowIndex !== -1 &&
     (parenIndex > arrowIndex || parenIndex === -1) ) {
      var arrowParams = code.slice(0, arrowIndex).trim();
      result = [arrowParams.indexOf(' ') === -1 ? arrowParams : arrowParams.split(' ')[1]];
  }

  return result === null
    ? []
    : result;
}

module.exports = getParameterNames;
