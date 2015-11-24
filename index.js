var _ = require('lodash');
var invariant = require('invariant');
var parameters = require('get-parameter-names');
var util = require('./util');
var singularify = util.singularify;
var INJECTOR = "$injector";

function Injecting(config) {
    if (!(this instanceof Injecting)) return new Injecting(config);
    var cfg = config || {};
    this._injector = cfg.injectorName || INJECTOR;
    this.context = {};
    this.constant(this._injector, this);
}

_.merge(Injecting.prototype, {
    _checkExist: function (name) {
        var msg = '';
        if (name === this._injector) {
            msg = this._injector + ' is reserved, try use other name';
        }
        invariant(!this.context[name], '%s is already registered. ' + msg, name);
    },

    register: function (name, obj) {
        switch (true) {
            case _.isFunction(obj):
                return this.service(name, obj);
            default:
                return this.constant(name, obj);
        }
    },

    service: function (name, constructor) {
        this._checkExist(name);
        var app = this;
        this.context[name] = {
            value: singularify(function (_locals) {
                var locals = _locals;
                app._loading = app._loading || {};
                invariant(!app._loading[name], 'circular dependencies found for ' + name);
                app._loading[name] = true;
                var instance;
                try {
                    var inherit = function(){};
                    inherit.prototype = constructor.prototype;
                    instance = new inherit();
                    instance2 = app.invoke(constructor, instance, locals);
                } catch(e) {
                    app._loading[name] = false;
                    return Promise.reject(e);
                }
                // if instance2 is emtpy, return the instance instead.
                return instance2.then(function(i) {
                  return i || instance;
                });
            })
        };
    },

    constant: function(name, value) {
        this._checkExist(name);
        this.context[name] = {
            value: singularify(function() {
                return value;
            })
        };
    },

    invoke: function(func, context, _locals) {
        var args = parameters(func);
        var app = this;
        var locals = _locals || {};
        try {
          var actuals = args.map(function(arg) {
              console.log('mapping arg:', arg, ' with local', locals);
              return locals[arg] || app.get(arg, locals);
          });
        } catch (e) {
          return Promise.reject(e);
        }
        return Promise.all(actuals).then(function(args) {
          return func.apply(context, args);
        });
    },

    /**
     * make sure it always returns a promise.
     */
    get: function(name, locals) {
        var dep = this.context[name];
        invariant(dep, '%s is not found!', name);
        return Promise.resolve(dep.value(locals || {}));
    }
});
module.exports = Injecting;

