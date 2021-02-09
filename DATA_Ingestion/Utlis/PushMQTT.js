const mqtt = require('mqtt')
const fs = require("fs");

const timeout = ms => new Promise(res => setTimeout(res, ms))

var SENSOR_ALTERNATE_ID = '';
var CAPABILITY_ALTERNATE_ID = '';
var DEVICE_ALTERNATE_ID = '';
var HOST_ADDRESS = ''

var rn = require('random-number');

var litersconsumed_gen; 
// rn.generator({
//       min:  0
//     , max:  100
//     , integer: true
// })

// Change this value to adjust the water consumption
litersconsumed_gen = 20;

var temperature_gen = rn.generator({
      min:  25
    , max:  30
    , integer: true
})

const CERTIFICATE_FILE = './certificates/client_device.pem';
const PASSPHRASE_FILE = './certificates/client_key.txt';
var mqttClient;

//Connect to MQTT
function ConnectMQTTChannel(_SENSOR_ALTERNATE_ID,_CAPABILITY_ALTERNATE_ID,_DEVICE_ALTERNATE_ID){

    SENSOR_ALTERNATE_ID     = _SENSOR_ALTERNATE_ID;
    CAPABILITY_ALTERNATE_ID = _CAPABILITY_ALTERNATE_ID;
    DEVICE_ALTERNATE_ID     = _DEVICE_ALTERNATE_ID;

    mqttClient = connectToMQTT()
}

//csvfunction
async function sendDataViaMQTT() {

    while(true){
        await timeout(5000)
        var payload = {
        sensorAlternateId: SENSOR_ALTERNATE_ID,
        capabilityAlternateId: CAPABILITY_ALTERNATE_ID,
        measures: [

            {"literconsumed":litersconsumed_gen,"temperature":temperature_gen()}

            ]
        }
        console.log(payload);
        var topicName = 'measures/' + DEVICE_ALTERNATE_ID;
        mqttClient.publish(topicName, JSON.stringify(payload), [], error => {
            if(!error) {
                console.log("Data successfully sent!");
            } else {
                console.log("An unecpected error occurred:", error);
            }
        });
    }		
}

function connectToMQTT() {
    var options = {
        keepalive: 10,
        clientId: DEVICE_ALTERNATE_ID,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 2000,
        cert: fs.readFileSync('./certificates/client_device.pem'),
        key: fs.readFileSync('./certificates/client_device.pem'),
        passphrase: fs.readFileSync('./certificates/client_key.txt').toString(),  
        rejectUnauthorized: false
    };

    var mqttClient = mqtt.connect(`mqtts://${HOST_ADDRESS}:8883`, options);

    mqttClient.subscribe('ack/' + DEVICE_ALTERNATE_ID);
    mqttClient.on('connect', () => {console.log("Connection established!")
        sendDataViaMQTT();
    });
    mqttClient.on("error", err => console.log("Unexpected error occurred:", err));
    mqttClient.on('reconnect', () => console.log("Reconnected!"));
    mqttClient.on('close', () => console.log("Disconnected!"));
    mqttClient.on('message', (topic, msg) => console.log("Received acknowledgement for message:", msg.toString()));

    return mqttClient
}

ConnectMQTTChannel(SENSOR_ALTERNATE_ID,CAPABILITY_ALTERNATE_ID,DEVICE_ALTERNATE_ID);

module.exports = {
    connectMQTTChannel : ConnectMQTTChannel
}
