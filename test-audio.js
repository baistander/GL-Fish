var Galileo = require('galileo-io');
var board = new Galileo();

board.on('ready', function() {
    this.analogRead('A1', function(data) {
        console.log(data);
    });
});
