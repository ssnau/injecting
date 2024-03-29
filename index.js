// notice: for backward compatible, write code in es5 grammar
var util = require('./util')
var cachify = util.cachify
var INJECTOR = '$injector'
var co = require('./async')

function cleanObj (context, name) {
  Object
    .keys(context[name] || {})
    .forEach(function (key) {
      context[key] = null
    })
  context[name] = {}
}

function Injecting (config) {
  if (!(this instanceof Injecting)) return new Injecting(config)
  var cfg = config || {}
  this._injector = cfg.injectorName || INJECTOR
  this.context = {}
  this.cache = {}
  this.overwritable = {}
  this.constant(this._injector, this)
}

function merge (a, b) {
  Object.keys(b).forEach(function (key) { a[key] = b[key] })
}

function hasOwnProp (obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

merge(Injecting.prototype, {
  _checkExist: function (name) {
    var msg = ''
    if (name === this._injector) {
      msg = this._injector + ' is reserved, try use other name'
    }
    if (this.overwritable['$$' + name]) return
    if (hasOwnProp(this.context, name)) throw new Error(name + ' is already registered. ' + msg)
  },

  /**
     * clean the instance for gc.
     */
  destory: function () {
    cleanObj(this, 'context')
    cleanObj(this, 'cache')
  },

  register: function (name, obj, opts) {
    var isArrayInjection = util.isArrayInjection(obj)
    if (isArrayInjection) util.warn('you are going to register a array ', obj, 'injecting will auto treat it as a service. If you want to register as constant, call `constant`')

    switch (true) {
      case (typeof obj === 'function') || isArrayInjection:
        return this.service(name, obj, opts)
      default:
        return this.constant(name, obj, opts)
    }
  },

  service: function (name, constructor, opts) {
    this._checkExist(name)
    this.overwritable['$$' + name] = !!util.get(opts, 'overwritable')
    this.cache[name] = {} // generate a namespace
    var app = this
    if (opts && opts.injections) constructor.$injections = opts.injections
    this.context[name] = {
      value: cachify(function (_locals) {
        var locals = _locals
        app._loading = app._loading || {}
        if (app._loading[name]) throw new Error('circular dependencies found for ' + name)
        app._loading[name] = true
        var instance
        try {
          instance = app.invoke(constructor, instance, locals)
        } catch (e) {
          app._loading[name] = false
          return Promise.reject(e)
        }
        return instance
      })
    }
  },

  constant: function (name, value, opts) {
    this._checkExist(name)
    this.overwritable['$$' + name] = !!util.get(opts, 'overwritable')
    this.context[name] = {
      value: function () { return value }
    }
  },

  invoke: function (func, context, _locals) {
    if (util.isArray(func)) {
      var parameters = func.slice(0, func.length - 1)
      func = func[func.length - 1]
      func.$injections = parameters
    }
    var args = util.parameters(func)
    var noConstructor = false
    if (util.isGeneratorFunction(func)) {
      func = co.wrap(func)
      noConstructor = true // no way to treat generator as constructor
    }
    if (func.noConstructor) {
      noConstructor = true // if the func as specify noConstructor
    }
    var app = this

    var locals = _locals || {}
    var resolvers = func.injectingResolvers
    var actuals = []
    // handle injected parameters
    // looks hard to do refactor since I need to return Promise.reject here.
    try {
      actuals = args.map(function (arg) {
        if (resolvers && typeof resolvers[arg] === 'function') return resolvers[arg]()
        return locals[arg] || app.get(arg, locals)
      })
    } catch (e) {
      return Promise.reject(e)
    }

    // handle injected members
    var injectionMembers = []
    var staticInjections = {}
    var clazz = func
    var i = 0
    while (true) {
      // for the reason that typescript cannot define static method
      const __injections = clazz.prototype && clazz.prototype._getInjections &&
            clazz.prototype._getInjections()
      staticInjections = Object.assign(clazz.INJECTIONS || __injections || {}, staticInjections)
      clazz = Object.getPrototypeOf(clazz)
      if (!clazz) break
      if (i++ > 5) break
    }
    var keys = Object.keys(staticInjections)
    if (keys.length) {
      var values = keys.map(function (k) { return staticInjections[k] })
      try {
        injectionMembers = values.map(function (v) {
          const arg = v.INJECTING_NAME || v
          if (resolvers && typeof resolvers[arg] === 'function') return resolvers[arg]()
          return locals[arg] || app.get(arg, locals)
        })
      } catch (e) {
        return Promise.reject(e)
      }
    }

    var hasContext = (context !== undefined)
    return Promise.all(actuals).then(function (args) {
      return Promise.all(injectionMembers).then(function (members) {
        // (arrow function|method function) does not have prototype, it is unable to initantiate
        // if context is provided, it must be applied with.
        var ist = (hasContext || noConstructor || !func.prototype) ? func.apply(context, args) : util.newApply(func, args)
        for (var i = 0; i < members.length; i++) {
          ist[keys[i]] = members[i]
        }
        if (ist && ist._constructor) return Promise.resolve(ist._constructor()).then(function () { return ist })
        return ist
      })
    })
  },

  /**
     * make sure it always returns a promise.
     */
  get: function (name, locals) {
    var me = this
    if (util.isArray(name)) {
      return Promise.all(name.map(function (n) {
        return me.get(n, locals)
      }))
    }
    var dep = this.context[name]
    if (!dep) throw new Error(name + ' is not found!')
    return Promise.resolve(dep.value(locals || {}))
  }
})

// wrap fn to protect from modifying the original one
function wrap (fn) {
  return function () { return fn.apply(this, arguments) }
}

Injecting.proxy = function (fn) {
  var args = util.parameters(fn)
  var wfn = util.isGeneratorFunction(fn) ? co.wrap(fn) : wrap(fn)
  return args.concat(wfn)
}

module.exports = Injecting
