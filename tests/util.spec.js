var util = require('../util');
var assert = require('assert');
describe('util functions', function(){
    var args = util.get_func_args;
    it('test get_func_args', function() {
        assert.deepEqual(args(function(){}), []);

        assert.deepEqual(args(function(a,b,c){}), ['a', 'b', 'c']);
        assert.deepEqual(args(function (a, b, c){}), ['a', 'b', 'c']);
        assert.deepEqual(args(function hey(a,b,c){}), ['a', 'b', 'c']);
        assert.deepEqual(args(function hey(a, b, c){}), ['a', 'b', 'c']);
        assert.deepEqual(args(function hey( a, 
                                            b, 
                                            c){}), ['a', 'b', 'c']);
    });
});
