var parameters = require('./get-parameter-names');
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

function get(obj, prop) {
  var props = typeof prop === 'string' ? prop.split('.') : prop;
  var a = props[0], b = props[1], c = props[2];
  try {
    if (props.length === 1) return obj[a];
    if (props.length === 2) return obj[a][b];
    if (props.length === 3) return obj[a][b][c];
  } catch (e) {
    return void 0;
  }
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
     * ignore the arguments on cache for arguments always
     * the same in dependency injection.
     */
    cachify: function(func) {
        var cache, called;
        return function (a, b, c) {
            // pass key back for the fn
            if (!called) {
              cache = func.apply(this, [a, b, c].slice(0, func.length));
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
    get: get,
    isGeneratorFunction: isGeneratorFunction
};
