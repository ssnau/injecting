[![Build Status](https://travis-ci.org/ssnau/injecting.svg)](https://travis-ci.org/ssnau/injecting)
[![npm version](https://badge.fury.io/js/injecting.svg)](http://badge.fury.io/js/injecting)
[![Dependency Status](https://david-dm.org/ssnau/injecting.svg)](https://david-dm.org/ssnau/injecting.svg)

Injecting
=========

A simple javascript dependency inject processor, work great with Promise.

Example
------
simple injection:
```javascript
var injecting = require('injecting');
var app = injecting();
app.register('name', 'jack');
app.register('person', function(name) {
    this.name = name;
});

app.invoke(function(person) {
    console.log(person.name); // jack
});
```

recursive injection:
```javascript
var injecting = require('injecting');
var app = injecting();
app.register('place', 'pacific');
app.register('cat', function() {
    this.name = "white cat";
});
app.register('person', function(cat) {
    this.name = "robot";
    this.pet = cat;
});
app.register('story', function(place, person){
    return {
        place: place,
        person: person.name,
        pet: person.pet.name
    };
});
app.invoke(function(story){
    console.log(story);
    /* should be
    {
        place: 'pacific',
        person: 'robot',
        pet: 'white cat'
    };
    */
});

```

Async Function
-------

```javascript

var injecting = require('injecting');
var app = injecting();
function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(function () {
      resolve('');
    }, ms);
  });
}

// function that return a promise
app.register('name', function() {
  return sleep(1000).then(() =>'jack');
});

// generator as async function and inject `name`
app.register('person', function* (name) {
  yield sleep(1000);
  return {name: name, age: 10};
});

app
  .get('person')
  .then(function(person) {
    console.log(person); // should be {name: 'jack', age: 10}
  });
```

Anti Minification
------

The code shows above does not robust enough when our source code is minified. For example:

```
app.register('person', 'jack');
app.invoke(function(person) {
  console.log(person);
});
// will be minified as
app.invoke(function(a) {
  console.log(a);
});
// it will lead to app crush in such case since `a` is not registered.
```

### Solution

There are several method to avoid minification problem. Look at the code below:

```
// invoke a function with predefined injections
app.invoke(['person', 'job', function(p, j) {
  console.log(p, j);
});
// register a dep with predefined injections
app.register('person', ['name', 'age', function (n, a) {
  return {name: n, age： a};
});
```

Please refer to the [test cases](https://github.com/ssnau/injecting/blob/master/tests/injecting.spec.js) for more examples.

methods
------
### constant(name, value)

register a constant as dependency.

### service(name, constructor)

register a service as dependency. notice you have to pass a function for it. `injecting` will call the constructor and return the instance the first time you inject. It will return the same instance for later use.

### register(name, obj|fn)

register the argument as dependency. automatically register as constant if the second argument is object|string|number, and register as service if the second argument is function.

### invoke(fn)

invoke a function and automatically inject for its arguments. Expect to return a promise.

### get(name)

get a particular injection in promise form.

License
-----
MIT
