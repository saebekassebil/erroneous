function listen() {
  process.on('uncaughtException', function(e) {
    this.error(e);
  }.bind(this));

  return this;
}

module.exports = listen;
