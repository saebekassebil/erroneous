# Erroneous

JavaScript exception-handling for both client side and Node.js scripts

**NB: THIS MODULE IS NO LONGER UNDER ACTIVE DEVELOPMENT SINCE I NO LONGER USE IT**

## Installation

Installation is a breeze with npm (and no dependencies!):

    $ npm install erroneous

## Usage

In browser-context Erroneous subscribes itself to the `error` event of the
`window` object. Thus there's only the handling of the errors left. In Node.js
you'll need to call `Erroneous.error` yourself - This is to provide a greater
degree of freedom in your code.

Node.js:
```javascript
var Erroneous = require('erroneous');

// You can either initialize erroneous in this way (with an optional handler)
Erroneous.listen().register(function(err) {
  console.log('Custom error handler..', err);
});

// or this way:
process.on('uncaughtException', function(e) {
  Erroneous.error(e);
});
```

Browser:
```html
<!-- Really simple embedding syntax with evaluation of the script tags' code -->
<script src='./lib/erroneous.js'>
  // Send error to server for logging
  Erroneous.server('https://example.com/log');
</script>

<!-- And again you can register an unlimited number of error handlers -->
<script>
  Erroneous.register(function(err) {
    console.log('Custom error handler..', err);
  });
</script>
```

## API

### Erroneous

The main object, that contains the logic for listening for errors and
handling them.

#### Erroneous.register(Function callback)

Registers a callback, that is called when an error occurs

#### Erroneous.server(String serverURL, [Function callback])

Register an internal callback that sends the error to the server in JSON
format. If `callback` is supplied, it will be called when the response
from the server has been received.

### ErroneousError

The object that the callback function receives (and the server, in JSON format)
is an `ErroneousError`. The object has several properties which, collected from
the `Error` event.

 - *line* - The linenumber
 - *file* - The filename of the file where the error occured
 - *msg* - The raw error message, received from the browser
 - *time* - A timestamp of the date when the error occured
 - *type* - The type of error occured (`SyntaxError`, `ReferenceError` etc.)
 - *target* - A string that tries to describe the target of the error
    It can be an ID or a nodeName + classNames
 - *stack* - The stacktrace

