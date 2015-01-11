[![Build Status](https://travis-ci.org/ssnau/injecting.svg)](https://travis-ci.org/ssnau/injecting)
[![npm version](https://badge.fury.io/js/injecting.svg)](http://badge.fury.io/js/injecting)
[![Dependency Status](https://david-dm.org/ssnau/injecting.svg)](https://david-dm.org/ssnau/injecting.svg)
Injecting
=========

A simple javascript dependency inject processor.

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

Please refer to the test cases for more examples.

methods
------
###constant(name, value)

register a constant as dependency.

###service(name, constructor)

register a service as dependency. notice you have to pass a function for it. `injecting` will call the constructor and return the instance the first time you inject. It will return the same instance for later use.

###register(name, obj|fn)

register the argument as dependency. automatically register as constant if the second argument is object|string|number, and register as service if the second argument is function.

###invoke(fn)

invoke a function and automatically inject for its arguments.

###get(name)

get a particular injection.

License
-----
MIT
