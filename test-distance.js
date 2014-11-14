var Galileo = require('galileo-io');
var board = new Galileo();

var distance_sensor, cm, inches, feet;
// Distance formula: http://www.phidgets.com/products.php?product_id=3521

board.on('ready', function() {
    this.analogRead('A0', function(distance) {
        distance = parseInt(distance, 10);

        // Valid distance to measure accurately
        if (between(distance, 80, 500)) {
            cm = 4800 / (distance - 20);
            inches = cm / 2.54;
            feet = inches / 12;

            // Update global var
            distance_sensor = feet;


            console.log(distance_sensor);
            // Animation sequence based on distance
        }

        // Too far, run idle sequence
        if (between(distance, 0, 80)) {
          console.log('no target', distance_sensor);
        }

        // Too close, go insane
        if (distance > 500) {
          console.log('insane', distance_sensor);
        }

// console.log(distance);




    });
});


function between(x, min, max) {
    return x >= min && x <= max;
}
