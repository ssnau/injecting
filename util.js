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

/*
 * cannot use object itself as key because of potential memory leak.
 */
function stringify(args) {
  var key = "";
  Object.keys(args).forEach(function(k) {
    if (key.length > 50) return;
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
                // for different arguments, return different instance.
                // pass key back for the fn
                val = func.apply({$key: key}, arguments);;
                cache[key] = val;
            }
            return cache[key];
        }
    }
};
