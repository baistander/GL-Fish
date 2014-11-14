var sockjs_url = '/echo';
var sockjs = new SockJS(sockjs_url);

sockjs.onopen = function() {
    //console.log('[*] open', sockjs.protocol);
};
sockjs.onmessage = function(e) {
    //console.log('[.] message', e.data);
    if(window.sendSensorData){
        window.sendSensorData(JSON.parse(e.data));
    }
};
sockjs.onclose = function() {
    //console.log('[*] close');
};
