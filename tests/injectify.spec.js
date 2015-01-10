var injecting = require('../');
var assert = require('assert');

describe('should inject constant', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });
    it('register a constant', function() {
        app.constant('name', 'injecting');

        app.invoke(function(name) {
            assert.equal(name, 'injecting');
        });
    });

    it('register 3 constants', function() {
        app.constant('name', 'jack');
        app.constant('age', 18);
        app.constant('fruit', 'apple');

        app.invoke(function(age, name, fruit) {
            assert.equal(name, 'jack');
            assert.equal(age, 18);
            assert.equal(fruit, 'apple');
        });
    });
});

describe('should inject service', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });
    it('register a service', function() {
        var id = 0;
        app.service('pig', function() {
            id++;
            this.id = id;
        });

        var p1, p2;
        app.invoke(function(pig) {
            p1 = pig;
            assert.equal(pig.id, 1);
        });

        app.invoke(function(pig) {
            p2 = pig;
            assert.equal(pig.id, 1);
        });

        assert.equal(p1, p2);
    });

    it('none of the service functions will be called if i dont use them', function(){
        var id = 0;
        app.service('person', function(){
            id++;
        });
        app.service('dog', function(){
            id++;
        });
        assert.equal(id, 0);
    });
});


describe('should auto mount dependencies', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('should inject name when init service', function() {
        app.constant('name', 'jack');
        app.service('person', function(name) {
            this.name = name;
        });

        app.invoke(function(person) {
            assert.equal(person.name, 'jack');
        });
    });

    it('should inject services recursively', function () {
        app.constant('place', 'pacific');
        app.service('cat', function() {
            this.name = "white cat";
        });
        app.service('person', function(cat) {
            this.name = "robot";
            this.pet = cat;
        });
        app.service('story', function(place, person){
            return {
                place: place,
                person: person.name,
                pet: person.pet.name
            };
        });

        app.invoke(function(story){
            assert.deepEqual(story, {
                place: 'pacific',
                person: 'robot',
                pet: 'white cat'
            });
        });
    });
});


describe('should deal with infinitive dependency', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('should throw error when infinitive dependency found', function() {
        app.service('egg', function(chicken) {
            return 'something chicken produce';
        });
        app.service('chicken', function(egg) {
            return 'something egg hatch';
        });

        assert.throws(function(){
            app.invoke(function(egg){});
        },
        'circular dependencies found for egg' 
        );
    });
});

describe('should deal with injector', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('should be able to get injector', function() {
        app.service('egg', function(injector) {
            this.hatch = function() { return injector.get('chicken'); };
            this.name = 'i am a egg';
        });
        app.service('chicken', function(injector) {
            this.produce = function() { return injector.get('egg'); };
            this.name = 'i am a chicken';
        });

        app.invoke(function(egg, chicken) {
            assert.equal(egg.name, 'i am a egg');
            assert.equal(chicken.name, 'i am a chicken');

            assert.equal(egg.hatch().name, 'i am a chicken');
            assert.equal(chicken.produce().name, 'i am a egg');

        });

    });

});
