/**
 * Erroneous - JavaScript exception handling
 * Copyright 2012 - Jakob Miland <saebekassebil@gmail.com>
 **/

(function(global) {
  function postToServer(error) {

  }

  /**
   * Object for storing error details
   * Only used internally
   **/
  function ErroneousError(e, additional) {
    additional = additional || {};
    this.line = e.lineno || additional.lineno;
    this.file = e.filename || additional.filename;
    this.msg = e.message || additional.message;
    this.time = e.timestamp || additional.timestamp || Date.now();
    this.type = this.parseMessage(this.msg);

    if (e.target) {
      this.target = this.getTargetIdentifier(e.target); 

      if (e.target.nodeName) {
        this.type = 'resource';
        if (e.target.href) {
          this.file = e.target.href; 
        } else if (e.target.src) {
          this.file = e.target.src;
        }
      }
    }
  }

  ErroneousError.prototype = {
    /**
     * #getTargetIdentifier(DOMElement target)
     *  - Tries to put an identifier on the target
     **/
    getTargetIdentifier: function(target) {
      var id = 'unknown';

      if (target && typeof target.innerHTML === 'string') {
        if (target.id) {
          id = '#' + target.id;
        } else if (target.nodeName) {
          id = target.nodeName.toLowerCase();

          if (target.className) {
            var classes = target.className.split(/\s+/);
            for (var i = 0, length = classes.length; i < length; i++) {
              id += '.' + classes[i];
            }
          }
        }
      }

      return id;
    },

    /**
     * #parseMessage(String str)
     *  - Tries to parse an error string
     *    Practically impossible in IE since they have localized errors
     **/
    parseMessage: function(str) {
      var type = 'unknown', res;
      if (!str) {
        return type;
      }

      str = str.toLowerCase();
      res = str.match(/(uncaught)?\s?(\w+)\:/);
      type = (res) ? res[2] : type;

      return type;
    }
  };

  var Erroneous = {
    /**
     * #error (Object/Event e, Boolean raw)
     *  - Handles an error, supplied with either an object ("fake error")
     *    or a real error event. If raw = true, then the supplied object,
     *    event or not, will be treated as an error event
     **/
    error: function(e, raw) {
      var error, msg;

      // "Fake" error applied by the onerror function
      if (e.type !== 'error' && !raw) {
        return Erroneous._simpleError = e; 
      } else if (raw) {
        // This is all we get, parse what we can
        error = new ErroneousError(e); 
      } else {
        // A "real" error event, use both the last "fake" error and
        // the real error event

        error = new ErroneousError(e, Erroneous._simpleError);
        Erroneous._simpleError = null;
      }

      Erroneous.pushError(error);
    },

    /**
     * #server(String url)
     *  - If provided, the url will receive a POST for each registered error
     **/
    server: function(url, callback) {
      this.serverURL = url;

      this.handlers.push(function(err) {
        Erroneous.postToServer(err, callback);
      });
    },

    /**
     * #postToServer(ErroneousError error)
     *  - Posts an error to the server
     **/
    postToServer: function(error, callback) {
      if (!this.serverURL) {
        return false;
      }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', this.serverURL, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          typeof callback === 'function' && callback(error, xhr.status === 200);
        }
      };

      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(error));
    },

    /**
     * #pushError(ErroneousError error)
     *  - Pushes an error to the internal array, and notifies listeners
     **/
    pushError: function(error) {
      this.errors.push(error);

      for(var i = 0, length = this.handlers.length; i < length; i++) {
        this.handlers[i](error);
      }
    },

    /**
     * #register(Function handler)
     *  - Register a custom error handler with a callback function
     **/
    register: function(handler) {
      if (typeof handler !== 'function') {
        return false;
      }

      this.handlers.push(handler);
    },

    // The UA string - might be related to the error
    ua: navigator ? navigator.userAgent : null,

    // Error store
    errors: [],

    // Error handlers
    handlers:  [],

    // Stores the last recorded error
    _simpleError: null
  };

  // Exporting the module
  if (typeof exports !== 'undefined') {
    // Node.js
    module.exports = Erroneous;
  } else if (global) {
    // Browser
    global.Erroneous = Erroneous;

    // Set for more error details
    global.onerror = function(err, file, line) {
      Erroneous.error({
        message: err,
        filename: file,
        lineno: line
      }, false);
    }

    if (global.addEventListener) {
      global.addEventListener('error', Erroneous.error, true);
    } else if (global.attachEvent) {
      global.attachEvent('error', Erroneous.error);
    } else {
      // Fallback for old browsers
      global.onerror = function(err, file, line) {
        Erroneous.error({
          message: err,
          filename: file,
          lineno: line
        }, true);
      }
    }
  }
})(window);
