var led_count = 16;
var leds = require('lpd8806-asyncfx')(led_count);
var Galileo = require('galileo-io');
var board = new Galileo();

var color_blue = [0, 98, 168];
var warn_color = [255, 0, 0]; // pulsate
var irritate_color = [105, 210, 231]; // sound controlled (random number)

var base_speed = 80;
var warn_speed = 5;
var too_close = false;

/* VARIALBES FOR GL FISH */
/*************************/
var distance_sensor; // Floating number
var sound_sensor; // Between 0.0 - 1.0
var STATE_IDLE = 0;
var STATE_WARN = 1;
var STATE_MIC = 2;
var STATE_RAVE = 3;
var state_current = STATE_IDLE;
/*************************/
var cm, inches, feet;
board.on('ready', function() {
    // Initialize using idle state
    leds.pulseColor(color_blue[0], color_blue[1], color_blue[2], base_speed);
    // ** Distance
    this.analogRead('A0', function(distance) {
        // Update global variable
        distance_sensor = distance;
        // Animation sequence based on distance
        updateState(distance_sensor);
    });

    //** Microphone
    this.analogRead('A1', function(sound) {
        sound = parseInt(sound, 10);
        var level = mapValue(averageMicReading(sound), 200, 300, 0, 1.0);
        // Update global var
        sound_sensor = level;
        if (too_close) {
            leds.setBrightness(level);
            leds.fillRGB(irritate_color[0], irritate_color[1], irritate_color[2]);
            console.log('sound_sensor: ', sound_sensor);
        }

    });

    // Turn off after node server shuts down
    process.on('exit', function() {
        leds.off();
    });
});


// Determines which state the animation is in based off the incoming value
function updateState(val) {
    // Higher number = closer

    if (state_current != STATE_IDLE && between(val, 0, 99)) {
        state_current = STATE_IDLE;
        too_close = false;
        leds.pulseColor(color_blue[0], color_blue[1], color_blue[2], base_speed);
    }
    if (state_current != STATE_WARN && between(val, 100, 199)) {
        state_current = STATE_WARN;
        too_close = false;
        leds.pulseColor(warn_color[0], warn_color[1], warn_color[2], warn_speed);
    }
    // Too close, activate mic to control brightness
    if (state_current != STATE_MIC && between(val, 200, 399)) {
        state_current = STATE_MIC;
        too_close = true;
        // Controlled via analogRead
    }
    // Way too close, go insane
    if (state_current != STATE_RAVE && val > 400) {
        state_current = STATE_RAVE;
        too_close = false;
        leds.setBrightness(1.0);
        leds.rave();
    }

    console.log('distance_sensor: ', distance_sensor);


    console.log('state:', state_current);
}


/* Utility functions */
/*********************/
var numReadings = 5;
var readings = new Array(numReadings);
var index = 0;
var total = 0;
var average = 0;

// Init readings with all 0s
for (var i = 0; i < numReadings; ++i) {
    readings[i] = 0;
}

function averageMicReading(value) {
    total = total - readings[index];
    readings[index] = value;
    total = total + readings[index];
    index = index + 1;

    if (index >= numReadings) {
        index = 0;
    }

    average = total / numReadings;
    average = Math.floor(average);
    return average;
}

// Returns a boolean value determined by the returned condition
function between(x, min, max) {
    return x >= min && x <= max;
}

function mapFn(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function mapValue(value, fromLow, fromHigh, toLow, toHigh) {
    // The data returned from analogRead is a string. Convert it to a number for processing
    var val = parseInt(value, 10);
    // Update the value using mapFn
    val = mapFn(val, fromLow, fromHigh, toLow, toHigh);
    // The value may be over 1.0, if it is, ensure that 1.0 is the max value,
    // otherwise return the original value
    val = (val > 1.0) ? 1.0 : val;
    val = (val < 0) ? 0 : val;
    return val;
}


process.on('SIGINT', function() {
    process.exit(0);
});
