
module.exports = {
    /**
     * cache the result once func is called.
     * ignore the arguments for arguments always
     * the same in dependency injection.
     */
    singularify: function(func) {
        var called = false;
        var val;
        return function(){
            if (!called) {
                // TODO: for different arguments, return different instance.
                val = func.apply(null, arguments);;
                called = true;
            }
            return val;
        }
    }
};
