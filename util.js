var parameters = require('get-parameter-names');
var PARAM_KEY = "_$$parameters";
var CLASS_KEY = "_$$isClass";
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

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

function assignProperty(obj, name, value) {
  try {
    Object.defineProperty(obj, name, {
       value: value,
       enumerable: false,
       configurable: true
    });
  } catch (e) {
    // do nothing
  }
}

function isClass(func) {
  if (!func) return false;
  if (func.hasOwnProperty(CLASS_KEY)) return func[CLASS_KEY];
  var isClass = typeof func === 'function' 
    && /^class\s/.test(Function.prototype.toString.call(func));
  assignProperty(func, CLASS_KEY, isClass);
  return isClass;
}

function newApply(Cls, args) {
    return new (Function.prototype.bind.apply(Cls, [{}].concat(args)));
}

module.exports = {
    /**
     * cache the result once func is called.
     * ignore the arguments for arguments always
     * the same in dependency injection.
     */
    cachify: function(func) {
        var cache, called;
        return function() {
            // pass key back for the fn
            if (!called) {
              cache = func.apply(null, arguments);
              called = true;
            }
            return cache;
        }
    },
    parameters: function (fn) {
      if (fn[PARAM_KEY] || fn.$injections) return fn[PARAM_KEY] || fn.$injections;
      var p = parameters(fn);
      assignProperty(fn, PARAM_KEY, p);
      return p;
    },
    PARAM_KEY: PARAM_KEY,
    isGenerator: isGenerator,
    isClass: isClass,
    newApply: newApply,
    isGeneratorFunction: isGeneratorFunction
};
