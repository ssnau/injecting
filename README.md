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
app.constant('name', 'jack');
app.service('person', function(name) {
    this.name = name;
});

app.invoke(function(person) {
    console.log(person.name); // jack
});
```

recursive injection:
```javascript
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

methods
------
###constant(name, value)

register a constant as dependency.

###service(name, constructor)

register a service as dependency. notice you have to pass a function for it. `injecting` will call the constructor and return the instance the first time you inject. It will return the same instance for later use.

###invoke(fn)

invoke a function and automatically inject for its arguments.

###get(name)

get a particular injection.

License
-----
MIT
