var parameters = require('./get-parameter-names')
var PARAM_KEY = '_$$parameters'
var CLASS_KEY = '_$$isClass'

function isArray (obj) {
  return typeof obj === 'object' && obj.slice && obj.splice && obj.concat
}

function get (obj, prop) {
  var props = typeof prop === 'string' ? prop.split('.') : prop
  var a = props[0]; var b = props[1]; var c = props[2]
  try {
    if (props.length === 1) return obj[a]
    if (props.length === 2) return obj[a][b]
    if (props.length === 3) return obj[a][b][c]
  } catch (e) {
    return undefined
  }
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator (obj) {
  return typeof obj.next === 'function' && typeof obj.throw === 'function'
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction (obj) {
  var constructor = obj.constructor
  if (!constructor) return false
  if (constructor.name === 'GeneratorFunction' || constructor.displayName === 'GeneratorFunction') return true
  return isGenerator(constructor.prototype)
}

function assignProperty (obj, name, value) {
  try {
    Object.defineProperty(obj, name, {
      value: value,
      enumerable: false,
      configurable: true
    })
  } catch (e) {
    // do nothing
  }
}

function hasOwnProp (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

function isClass (func) {
  if (!func) return false
  if (hasOwnProp(func, CLASS_KEY)) return func[CLASS_KEY]
  var isClass = typeof func === 'function' &&
    /^class\s/.test(Function.prototype.toString.call(func))
  assignProperty(func, CLASS_KEY, isClass)
  return isClass
}

function newApply (Cls, args) {
  return new (Function.prototype.bind.apply(Cls, [{}].concat(args)))()
}

function isArrayInjection (arr) {
  if (!isArray(arr)) return false
  return arr
    .slice(0, arr.length - 1)
    .every(function (item) {
      return typeof item === 'string'
    }) && (typeof arr[arr.length - 1] === 'function')
}

function warn () {
  if (getInjection('console')) getInjection('console').warn.apply(console, arguments)
}

// [ INJECTION START ]
// **for test reason**
var INJECTION = {
  console: (typeof console !== 'undefined') && console
}
function getInjection (name) { return INJECTION[name] }
function setInjection (name, obj) { INJECTION[name] = obj }
// [ INJECTION END  ]

module.exports = {
  /**
     * cache the result once func is called.
     * ignore the arguments on cache for arguments always
     * the same in dependency injection.
     */
  cachify: function (func) {
    var cache, called
    return function (a, b, c) {
      // pass key back for the fn
      if (!called) {
        cache = func.apply(this, [a, b, c].slice(0, func.length))
        called = true
      }
      return cache
    }
  },
  parameters: function (fn) {
    if (fn[PARAM_KEY] || fn.$injections) return fn[PARAM_KEY] || fn.$injections
    var p = parameters(fn)
    assignProperty(fn, PARAM_KEY, p)
    return p
  },
  PARAM_KEY: PARAM_KEY,
  isArray: isArray,
  isArrayInjection: isArrayInjection,
  isGenerator: isGenerator,
  isClass: isClass,
  newApply: newApply,
  warn: warn,
  get: get,
  isGeneratorFunction: isGeneratorFunction,
  setInjection: setInjection
}
