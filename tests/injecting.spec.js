var injecting = require('../');
var util = require('../util');
var assert = require('assert');
var co = require('../async');

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(function(){
       resolve();
    }, ms);
  });
}
describe('should inject constant', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });
    it('register a constant', function(done) {
        app.constant('name', 'injecting');

        app.invoke(function(name) {
            assert.equal(name, 'injecting');
            done();
        });
    });

    it('register 3 constants', function(done) {
        app.constant('name', 'jack');
        app.constant('age', 18);
        app.constant('fruit', 'apple');

        app.invoke(function(age, name, fruit) {
            assert.equal(name, 'jack');
            assert.equal(age, 18);
            assert.equal(fruit, 'apple');
            done();
        });
    });
});

describe('should inject service', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });
    it('register a service', function(done) {
        var id = 0;
        app.service('pig', function() {
            id++;
            this.id = id;
        });

        var p1, p2, count = 0, total = 2;
        app.invoke(function(pig) {
            p1 = pig;
            assert.equal(pig.id, 1);
            count++;
            next();
        });

        app.invoke(function(pig) {
            p2 = pig;
            assert.equal(pig.id, 1);
            count++;
            next();
        });

        function next() { 
          if (count === total) {
            assert.equal(p1, p2);
            done(); 
          }
        }

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
    it('get same injection by different method', function(done){
        var pid = 0;
        co(function *(){
          app.service('jack', function(){
            this.id = pid;
            pid++;
          });
          app.service('mary', function (jack) {
            this.hushand = jack;
          });
          yield app.invoke(function(jack) {
            // do nothing
          });
          yield app.invoke(function(jack, mary) {
            assert.equal(0, jack.id);
          });
        }).then(() => done())
    });
});

describe('should auto mount dependencies', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('should inject name when init service', function(done) {
        app.constant('name', 'jack');
        app.service('person', function(name) {
            this.name = name;
        });

        app.invoke(function(person) {
            assert.equal(person.name, 'jack');
            done();
        });
    });

    it('should inject services recursively', function (done) {
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
            done();
        });
    });
});

describe('should deal with infinitive dependency', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('should throw error when infinitive dependency found', function (done) {
        app.service('egg', function(chicken) {
            return 'something chicken produce';
        });
        app.service('chicken', function(egg) {
            return 'something egg hatch';
        });
        app.invoke(function(egg){}).catch(function(e) {
          assert.ok(/circular dependencies found for egg/.test(e + ''));
          done();
        });

    });
});

describe('should deal with injector', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('should throw error is register injector', function() {
        assert.throws(function(){
            app.service('$injector', function(){});
        },
        /reserve/ 
        );

        assert.throws(function(){
            app.constant('$injector', function(){});
        },
        /reserve/ 
        );
    });

    it('should be able to get injector', function(done) {
        app.service('egg', function($injector) {
            this.hatch = function() { return $injector.get('chicken'); };
            this.name = 'i am a egg';
        });
        app.service('chicken', function($injector) {
            console.log('making chicken');
            this.produce = function() { return $injector.get('egg'); };
            this.name = 'i am a chicken';
        });

        app.invoke(function(egg, chicken, $injector) {
            assert.equal(egg.name, 'i am a egg');
            assert.equal(chicken.name, 'i am a chicken');

            return Promise
              .all([egg.hatch(), chicken.produce()])
              .then(function(hp) {
                assert.equal(hp[0].name, 'i am a chicken');
                assert.equal(hp[1].name, 'i am a egg');
                done();
            });
          }).catch(function(e) {
            console.log(e); 
          });
    });

    it('should use user provider injector name', function (done) {
        app = injecting({injectorName: 'container'});
        app.constant('name', 'jack');
        app.invoke(function(container) {
          container.get('name').then(function(name) {
            assert.equal(name, 'jack');
            done();
          }).catch(function(e){
            console.log(e);
          });
        });
    });
});

describe('should deal with duplicate register', function() {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('should throw error when register same name', function() {
        app.service('joke', function(){ return 'interesting' });

        assert.throws(function(){
            app.constant('joke', 'stupid');
        },
        /already registered/ 
        );
    });

    it('should not throw error when register same name with overwritable', function() {
        app.service('joke', function(){}, {overwritable: true});

        assert.doesNotThrow(function(){
            app.constant('joke', 'stupid');
        });
        return app.invoke(function (joke) {
          assert.equal(joke, 'stupid');
        });
    });

});

describe('register should well handle constant and service', function () {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('should register dependency well', function (done) {
        app.register('name', 'jack');
        app.register('place', 'Paris');
        app.register('person', function(name, place) {
            this.name = name;
            this.place = place;
            this.talk = function () {
                return "my name is " + this.name + ", and I am in " + this.place;
            };
        });

        app.invoke(function(person){
            assert.equal(person.talk(), "my name is jack, and I am in Paris");
            done();
        });
    });
});

describe('should deal with promises', function () {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('async function', function (done) {
        app.register('name', 'jack');
        app.register('place', 'Paris');
        app.register('person', function(name, place) {
            return new Promise(function(resolve){
              setTimeout(function(){
                resolve({
                  name: name,
                  place: place,
                  talk: function () {
                      return "my name is " + this.name + ", and I am in " + this.place;
                  }
                });
              }, 10);
            });
        });

        app.invoke(function(person){
            assert.equal(person.talk(), "my name is jack, and I am in Paris");
            done();
        });
    });

    it('invoke async function', function (done) {
        app.register('name', 'jack');
        app.register('place', 'Paris');
        
        app.register('person', function(name, place) {
            return new Promise(function(resolve){
              setTimeout(function(){
                resolve({
                  name: name,
                  place: place,
                  talk: function () {
                      return "my name is " + this.name + ", and I am in " + this.place;
                  }
                });
              }, 10);
            });
        });

        function controller(person) {
          console.log('calling controller with:', person);
          return Promise.resolve({
            location: this.location,
            person: person
          });
        }

        var context = {location: 'beijing'};
        app.invoke(controller, context).then(function(scope){
          assert.equal(scope.location, 'beijing');
          assert.equal(scope.person.talk(), "my name is jack, and I am in Paris");
          done();
        }).catch(function(e) {
          console.log('get error', e); 
        });
    });

    it('should handle unfound deps', function (done) {
      app.invoke(function(lady) {}).catch(function(e) {
        assert.ok(/lady is not found!/.test(e + ''));
        done();
      });
    });
});

describe('should deal with generators', function () {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('generator function', function (done) {
        app.register('name', 'jack');
        app.register('place', 'Paris');
        app.register('person', function *(name, place) {
          yield sleep(100);
          return {
            name: name,
            place: place,
            talk: function () {
                return "my name is " + this.name + ", and I am in " + this.place;
            }
          };
        });

        app.invoke(function(person){
            assert.equal(person.talk(), "my name is jack, and I am in Paris");
            done();
        });
    });
});

describe('should deal with es6', function () {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('class', function (done) {
      'use strict';
        class T {
          constructor(name, place) {
            this.name = name;
            this.place = place;
          }
        }
        app.register('name', 'jack');
        app.register('place', 'Paris');
        app.register('t', T);

        app.invoke(function(t){
            assert.equal(t.name, "jack");
            assert.equal(t.place, "Paris");
            done();
        });
    });

    it('arrow function', function (done) {
        'use strict';
        app.register('name', 'jack');
        app.register('place', 'Paris');
        app.register('t', (name, place) => name + '-' + place);

        app.invoke(function(t){
            assert.equal(t, "jack-Paris");
            done();
        });
    });
});

describe('should deal with scalar values', function () {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('null', function () {
      return app.invoke(function () {
        return null;
      }, {}/* must provide context! */).then(function(value) {
        assert.equal(value, null);
      });
    });

});

describe('should deal with locals', function () {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('call with locals', function (done) {
        app.register('name', 'jack');
        app.register('person', function(name, place) {
            return new Promise(function(resolve){
              setTimeout(function(){
                resolve({
                  name: name,
                  place: place,
                  talk: function () {
                      return "my name is " + this.name + ", and I am in " + this.place;
                  }
                });
              }, 10);
            });
        });

        app.invoke(function(person){
            assert.equal(person.talk(), "my name is jack, and I am in Paris");
            console.log('i am ok');
        }, null, {place: 'Paris'})
        .then(function() {
          // if the injection is generated, get from cache and ignore locals
          return app.invoke(function(person){
              assert.equal(person.talk(), "my name is jack, and I am in Paris");
              done();
          }, null, {place: 'London'})  // the London will be ignored.
        }).catch(function(e){
          console.log('error...', e); 
        });
    });

});

describe('invoke array and define injections', function () {
  var app;
  var warnStr;
  beforeEach(function(){
    app = injecting();
    util.setInjection('console', {
      warn: function () {
        warnStr = [].slice.call(arguments).join('')
      }
    });
  });
  afterEach(function() {
    util.setInjection('console', console);
  });

  it('invoke with array', function (done) {
    app.register('name', 'jack');
    app.register('age', 20);
    app.invoke(['name', 'age', function (n, a) {
      assert.equal(n, 'jack');
      assert.equal(a, 20);
      done();
    }]);
  });

  it('register with injection', function (done) {
      app.register('name', 'jack');
      app.register('age', 20);
      app.register('person', function (n, a) {
        return {name: n, age: a};
      }, {injections: ['name', 'age']});
      app.invoke(function (person) {
        assert.deepEqual({name: 'jack', age: 20}, person);
        done();
      });
  });

  it('register with array', function (done) {
    app.register('name', 'jack');
    app.register('age', 20);
    app.register('person', ['name', 'age', function (n, a) {
      return {name: n, age: a};
    }]);
    assert.ok(/you are going to register a array/.test(warnStr));
    app.invoke(function (person) {
      assert.deepEqual({name: 'jack', age: 20}, person);
      done();
    });
  });
});

describe('perf stastics', function () {
    var app;
    beforeEach(function(){
        app = injecting();
    });

    it('record perf with 1000 injecting', function (done) {
      var thousandArr = (new Array(1000).join('x').split('x'));
      thousandArr.forEach(function (v, i) {
        app.register('n' + i, i);
      });
      var x = function () {
        console.timeEnd('s');
        assert.equal(arguments.length, thousandArr.length);
        done();
      };
      x.$injections = thousandArr.map((v, i) => 'n' + i);
      console.time('s');
      app.invoke(x);
    });

    it('record cascade injecting', function (done) {
      app.register('a', function () {});
      app.register('b', function (a) {});
      app.register('c', function (a, b) {});
      app.register('d', function (a, b, c) {});
      app.register('e', function (a, b, c, d) {});
      app.register('f', function (a, b, c, d, e) {});
      app.register('g', function (a, b, c, d, e, f) {});
      app.register('h', function (a, b, c, d, e, f, g) {});
      app.register('x', function (a, b, c, d, e, f, g) {});
      app.register('y', function (a, b, c, d, e, f, g) {});
      app.register('z', function (a, b, c, d, e, f, g) {});

      console.time('s2')
      app.invoke(function (h, a, b, c, d, e, f, g, x, y, z) {
        console.timeEnd('s2');
        done();
      }).catch(console.log);
    });
});
