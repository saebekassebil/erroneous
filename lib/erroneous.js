/**
 * Erroneous - JavaScript exception handling
 * Copyright 2012 - Jakob Miland <saebekassebil@gmail.com>
 **/

(function(global) {
  var isOpera = Object.prototype.toString
                  .call(global.opera) === '[object Opera]';
  /**
   * Object for storing error details
   * Only used internally
   **/
  function ErroneousError(e, additional) {
    additional = additional || {};
    this.line = e.lineno || e.lineNumber || additional.lineno;
    this.file = e.filename || e.fileName || additional.filename;
    this.msg = e.message || additional.message;
    this.time = e.timestamp || additional.timestamp || Date.now();
    this.type = (this.parseMessage(this.msg) || e.type || e.name).toLowerCase();

    // If it's a DOM node, let's figure out which
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

    // Parse the stack if any
    this.stack = e.stack;
    this.parseStack(e.stack);
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

    parseStack: function(stack) {
      if (!stack) {
        return false;
      }

      var lines = stack.split(/\n\r?\s*/);
      var filename, type;
      for (var i = 0, length = lines.length; i < length; i++) {
        if (i === 0 && lines[i].charAt(0) === '@') { // Firefox
          filename = lines[i].substr(1);
          filename = filename.split(/:(?!\/)/);

          if (!this.file) {
            this.file = filename[0];
          }

          if (filename.length > 1 && !this.line) {
            this.line = parseInt(filename[1]);
          }
        } else if (i === 0 && lines[i].indexOf(':') !== -1) { // Chrome
          type = lines[i].substr(0, lines[i].indexOf(':'));
          this.type = type.toLowerCase();
        }
      }
    },

    /**
     * #parseMessage(String str)
     *  - Tries to parse an error string
     *    Practically impossible in IE since they have localized errors
     **/
    parseMessage: function(str) {
      var type, res;

      str = str || '';
      res = str.match(/(uncaught)?\s?(\w+)\:/i);
      type = (res) ? res[2] : null;

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
    error: function(e, fake, old) {
      var error, msg;

      // "Fake" error applied by the onerror function
      if (fake && !old && !isOpera) {
        return Erroneous._simpleError = e;
      } else if ((fake && old) || isOpera) {
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

      for (var i = 0, length = this.handlers.length; i < length; i++) {
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
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : null,

    // Error store
    errors: [],

    // Error handlers
    handlers: [],

    // Stores the last recorded error
    _simpleError: null
  };

  // Exporting the module
  if (typeof exports !== 'undefined') {
    // Node.js
    var plugins = require('./plugins'), plugin;
    for (plugin in plugins) {
      if (plugins.hasOwnProperty(plugin)) {
        Erroneous[plugin] = plugins[plugin];
      }
    }

    module.exports = Erroneous;
  } else {
    // Assume a browser context
    global.Erroneous = Erroneous;

    // Set for more error details
    global.onerror = function(err, file, line) {
      Erroneous.error({
        message: err,
        filename: file,
        lineno: line
      }, true, false);
    }

    // Doesn't have any effect in Opera
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
        }, true, true);
      }
    }

    // Evaluate the code in the script tag
    // http://ejohn.org/blog/degrading-script-tags/
    var scripts = global.document.getElementsByTagName('script');
    eval(scripts[scripts.length - 1].innerHTML);
  }
})(typeof window !== 'undefined' ? window : {});
