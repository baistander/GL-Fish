var leds = require('lpd8806-asyncfx')(32);

var Galileo = require('galileo-io');
var board = new Galileo();

board.on('ready', function() {
    leds.rainbow(1, 25);

    process.on('exit', function(){
        leds.off();
    });
});

// After nodejs shuts down (ctrl+c), this runs so it can turn off the LED's
process.on('SIGINT', function() {
    // Trigger exit process
    process.exit(0);
});
