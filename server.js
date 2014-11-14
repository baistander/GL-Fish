var led_count = 16;
var leds = require('lpd8806-asyncfx')(led_count);
var Galileo = require("galileo-io");
var board = new Galileo();
var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

var color_blue = [0, 98, 168];
var warn_color = [255, 0, 0]; // pulsate
var irritate_color = [105, 210, 231]; // sound controlled (random number)

var base_speed = 60;
var warn_speed = 5;
var too_close = false;

/* VARIALBES FOR GL FISH */
/*************************/
var distance_sensor; // Floating number
var sound_sensor; // Between 0.0 - 1.0
var STATE_IDLE = 0;
var STATE_RAVE = 1;
var STATE_WARN = 2;
//var STATE_MIC = 2;

var state_current = STATE_IDLE;
var current_color = false;
/*************************/
var cm, inches, feet;

var cm, inches, feet;
board.on('ready', function() {
    // Initialize using idle state
    leds.pulseColor(color_blue[0], color_blue[1], color_blue[2], base_speed, 'inOutCubic');
    // ** Distance
    this.analogRead('A0', function(distance) {
        // Update global variable
        distance_sensor = distance;
        // Animation sequence based on distance
        updateState(distance_sensor);

        if (connection) {
            var data = {
                state : state_current,
                color : current_color,
                distance : distance,
                sound : sound_sensor
            };
            connection.write(JSON.stringify(data));
        }
    });

    //** Microphone
    var soundData = [];
    var smoothingType = 'triangular';
    var minLength = smoothing.minLength[smoothingType];

    var sampleWindow = 50;
    var sampleStart;
    var signalMax = 0;
    var signalMin = 1024;
    var peakToPeak;

    this.analogRead('A1', function(sample) {
        var currTime = (new Date()).getTime();
        if(!sampleStart){
            sampleStart = currTime;
        }

        if(currTime - sampleStart < sampleWindow){
            if(sample < 1024){
                if(sample > signalMax){
                    signalMax = sample;
                } else if(sample < signalMin){
                    signalMin = sample;
                }
            }
        } else {
            peakToPeak = signalMax - signalMin;
            soundData.push(peakToPeak);

            if(soundData.length > minLength){
                soundData.shift();
                smoothingSound = smoothing[smoothingType](soundData);

                var mappedSound = mapFn(smoothingSound, 0, 512, 0, 1);
                sound_sensor = mappedSound;

                console.log('sound output', Math.floor(smoothingSound), mappedSound);
            }

            sampleStart = currTime;
            signalMax = sample;
            signalMin = sample;
        }
    });

    // Turn off after node server shuts down
    process.on('exit', function() {
        leds.off();
    });
});

function changeState() {
    switch(state_current) {
        case STATE_IDLE:
            current_color = [color_blue[0], color_blue[1], color_blue[2]];
            leds.pulseColor(current_color[0], current_color[1], current_color[2], base_speed, 'inOutCubic');
        break;

        case STATE_RAVE:
            current_color = false;
            leds.rave();
        break;

        case STATE_WARN:
            current_color = [warn_color[0], warn_color[1], warn_color[2]];
            leds.pulseColor(current_color[0], current_color[1], current_color[2], warn_speed);
        break;
    }
}

// Determines which state the animation is in based off the incoming value
function updateState(val) {
    if(state_current != STATE_IDLE && between(val, 0, 99)) {
        state_current = STATE_IDLE;
        changeState();
    } else if (state_current != STATE_RAVE && between(val, 100, 399)) {
        state_current = STATE_RAVE;
        changeState();
    } else if (state_current != STATE_WARN && val > 400) {
        state_current = STATE_WARN;
        changeState();
    }
    // Higher number = closer
    /*
    if (state_current != STATE_IDLE && between(val, 0, 99)) {
        state_current = STATE_IDLE;
        too_close = false;
        current_color = [color_blue[0], color_blue[1], color_blue[2]];
        leds.pulseColor(current_color[0], current_color[1], current_color[2], base_speed);
    }
    if (state_current != STATE_WARN && between(val, 100, 199)) {
        state_current = STATE_WARN;
        too_close = false;
        current_color = [warn_color[0], warn_color[1], warn_color[2]];
        leds.pulseColor(current_color[0], current_color[1], current_color[2], warn_speed);
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
        current_color = false;
        leds.setBrightness(1.0);
        leds.rave();
    }
    */
    
    //console.log('distance_sensor:', distance_sensor, 'state:', state_current);
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

var smoothing = {
    minLength : {
        rectangular : 3,
        triangular : 5,
        haystack : 7
    },
    rectangular : function(points){
        return (points[0]+points[1]+points[2])/3;
    },
    triangular : function(points){
        return (points[0]+2*points[1]+3*points[2]+2*points[3]+points[4])/9;
    },
    haystack : function(points){
        return (points[0]+3*points[1]+6*points[2]+7*points[3]+6*points[4]+3*points[5]+points[6])/27;
    }
};

// 1. Echo sockjs server
var sockjs_opts = {
    sockjs_url: "sockjs-0.3.min.js"
};

var sockjs_echo = sockjs.createServer(sockjs_opts);
var connection;
sockjs_echo.on('connection', function(conn) {
    connection = conn;
    conn.on('data', function(message) {
        conn.write(message);
    });
});

// 2. Static files server
var static_directory = new node_static.Server(__dirname);

// 3. Usual http stuff
var server = http.createServer();
server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
});
server.addListener('upgrade', function(req, res) {
    res.end();
});

sockjs_echo.installHandlers(server, {
    prefix: '/echo'
});

console.log(' [*] Listening on 0.0.0.0:1337');
server.listen(1337, '0.0.0.0');

process.on('SIGINT', function() {
    process.exit(0);
});
