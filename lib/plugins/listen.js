/**
 * listen plugin
 *  - A little sugar-plugin for Node.js, making it simpler to listen for errors
 **/
function listen() {
  process.on('uncaughtException', function(e) {
    this.error(e);
  }.bind(this));

  return this;
}

module.exports = listen;
