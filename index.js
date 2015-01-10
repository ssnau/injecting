var _ = require('lodash');
var invariant = require('invariant');
var parameters = require('get-parameter-names');
var util = require('./util');
var singularify = util.singularify;

function Injecting(name) {
    if (!(this instanceof Injecting)) return new Injecting(name);
    this.context = {};
}

_.merge(Injecting.prototype, {
    _checkExist: function (name) {
        invariant(!this.context[name], '%s is already registered', name);
    },

    service: function (name, constructor) {
        this._checkExist(name);
        var app = this;
        this.context[name] = {
            value: singularify(function () {
                app._loading = app._loading || {};
                invariant(!app._loading[name], 'circular dependencies found for ' + name);
                app._loading[name] = true;
                try {
                    var inherit = function(){};
                    inherit.prototype = constructor.prototype;
                    var instance = new inherit();
                    instance = app.invoke(constructor, instance) || instance;
                } catch(e) {
                    app._loading[name] = false;
                    throw e;
                }
                return instance;
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

    invoke: function(func, context) {
        var args = parameters(func);
        var app = this;
        var actuals = args.map(function(arg) {
            return app.get(arg);
        });
        return func.apply(context, actuals);
    },

    get: function(name) {
        var dep = this.context[name];
        invariant(dep, '% is not found!', name);
        return dep.value();
    }
});
module.exports = Injecting;

