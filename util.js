module.exports = {
    get_func_args: function(func) {
        var string = func.toString();
        var args = string.match(/^\s*function(?:\s+\w*)?\s*\(([\s\S]*?)\)/);
        args = args ? (args[1] ? args[1].trim ().split (/\s*,\s*/) : []) : null;
        return args;
    },
    singlify: function(func) {
        var called = false;
        var val;
        return function(){
            if (!called) {
                val = func.apply(null, arguments);;
                called = true;
            }
            return val;
        }
    }
};
