/**
 * check if object is hashable
 * or JavaScript Primitive type
 **/
function isHashable(o) {
  var type = typeof o;
  // hack for typeof null === "object"
  if (o === null) return true;
  // check for null because future ES spec requires typeof null === 'null'
  return /null|undefined|boolean|string|number/.test(type);
}

function isObject(o) {
  return !!o && typeof o === 'object';
}

function stringify(args) {
  var key = "";
  Object.keys(args).forEach(function(k) {
    if (key.length > 100) return;
    var v = args[k];
    if (isHashable(v)) {
      key = key + ":" + String(v) + (typeof v) + ";";
      return;
    }
    if (isObject(v)) {
      key = key + ":" + stringify(v) + ";";
      return;
    }
  });
  return key || '__empty$$locals__';
}
module.exports = {
    /**
     * cache the result once func is called.
     * ignore the arguments for arguments always
     * the same in dependency injection.
     */
    cachify: function(func, cache) {
        return function() {
            var key = stringify([].slice.call(arguments));
            if (!cache.hasOwnProperty(key)) {
                // TODO: for different arguments, return different instance.
                val = func.apply({$key: key}, arguments);;
                cache[key] = val;
            }
            return cache[key];
        }
    }
};
