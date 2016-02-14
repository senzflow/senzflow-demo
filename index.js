/**
 * Created by vito.zheng on 2016/1/1.
 */

var wpi = require('wiring-pi');
var Device = require("senzflow-sdk.js").Device;

var MAX_TIME = 41;
var DHT11PIN = 0;
var dht11_val= [0,0,0,0,0];
var INTERVAL = 30000;
var RETRY = 3;
var pre_temp = 0;
var pre_humi = 0;

var PPD42NSPIN = 7;
var SAMPLING_TIME = 30*1000;
var DURATION = 0;
var pm25coef=0.00207916725464941;

var CLIENT_ID = 'Temp-Humi-PM25';
var PUB_TOPIC = "senzflowdemo/temp-humi-pm25"
var QOS = 1;
var URL = 'mqtts://senzflow.io:8883'

// 创建设备，使用证书
const myDevice = new Device(URL, {
    clientId: CLIENT_ID,
    caPath: '/home/pi/stephen-ca/ca.pem',
    keyPath: '/home/pi/stephen-ca/key.pem',
    certPath: '/home/pi/stephen-ca/cert.pem',
    protocol: 'mqtts',
    initialLoad: true,
    rejectUnauthorized: true,
    about: {
        name: "My IOT Device",
        desc: "My IOT device using the senzflow(©) sdk"
    },
    onConfig: function() {
        console.log("Apply config:", arguments);
        return "Granted by 'myDevice'";
    },
    onControl: function() {
        console.log("Apply control:", arguments);
        return "Granted by 'myDevice'";
    }
});

myDevice.on("connect", function() { console.log("device connected") });
myDevice.on("error", function(error) { console.error("something goes error", error.stack, error) });
//myDevice.on("message", function(topic, message) { console.log(topic + " <== " + message) });

function getISOString(){
    var date = new Date();
    var zone = date.getTimezoneOffset() / 60;
    if (zone == 0){
        return date.toISOString();
    }

    function format_2(num){
        if (num < 10){
            return '0'+num;
        }
        return num;
    }

    function format_3(num){
        if (num < 10){
            return '00'+num;
        }
        if (num < 100){
            return '0'+num;
        }
        return num;
    }

    var year = date.getFullYear();
    var month = format_2(date.getMonth() + 1);
    var day = format_2(date.getDate());
    var hours = format_2(date.getHours());
    var minutes = format_2(date.getMinutes());
    var seconds = format_2(date.getSeconds());
    var millisseconds = format_3(date.getMilliseconds());
    var zone_str = format_2(-zone) + ":00";

    if (zone > 0){
        return year+"-"+month+"-"+day+"T"+hours+":"+minutes+":"+seconds+"."+millisseconds+"-"+zone_str;
    }else{
        return year+"-"+month+"-"+day+"T"+hours+":"+minutes+":"+seconds+"."+millisseconds+"+"+zone_str;
    }
}

// 设备使用SDK publish接口发送采集数据，JSON格式
function send_message(temp, humi, pm25){
    var msg_format = {
        timestamp:getISOString(),
        temperature:temp,
	    humidity:humi,
        pm25:pm25,
        location:{Lat: 22.528565, Lng: 113.944126},
        addr:"华中科技大学深圳产学研基地",
    };
    var msg_json = JSON.stringify(msg_format);
    myDevice.publish(PUB_TOPIC, msg_json, function(error) {
        if (error) {
            console.error("ERROR " + PUB_TOPIC + " ==> " + payload + ":", error);
        } else {
            console.log(PUB_TOPIC +" ==> " + msg_json);
        }
    });
}

function get_pm25(){
    wpi.pinMode(PPD42NSPIN,wpi.INPUT);
    var starttime = wpi.millis();
    DURATION = 0;
    while(wpi.millis() - starttime < SAMPLING_TIME)
    {
        DURATION = DURATION + wpi.pulseIn(PPD42NSPIN, wpi.LOW);
    }
    ratio=DURATION/(SAMPLING_TIME*10.0);
    concentration=1.1*Math.pow(ratio,3)-3.8*Math.pow(ratio,2)+520*ratio+0.62;
    pm25val=pm25coef*concentration;
    return pm25val;
}

function get_temp_humi(){
    var j = 0,i;
    for(i=0;i<5;i++)
        dht11_val[i]=0;
    wpi.pinMode(DHT11PIN,wpi.OUTPUT);      //set pin to output
    wpi.digitalWrite(DHT11PIN,wpi.LOW);    //set to low at least 18ms
    wpi.delay(18);
    wpi.digitalWrite(DHT11PIN,wpi.HIGH);   //set to high 20-40us
    wpi.delayMicroseconds(20);

    //start recieve dht response
    wpi.pinMode(DHT11PIN,wpi.INPUT);       //set pin to input

    var time_len = 0;
    var idx = 0;
    for(i=0;i<MAX_TIME;i++)
    {
        time_len = wpi.pulseIn(DHT11PIN, wpi.HIGH);
        // top 3 transistions are ignored, maybe aim to wait for dht finish response signal
        if(i>=1){
            idx = Math.floor(j/8);
            dht11_val[idx]<<=1;                     //write 1 bit to 0 by moving left (auto add 0)
            if((time_len ==0) || (time_len>28))                          //long mean 1
                dht11_val[idx]|=1;                  //write 1 bit to 1
            j++;
        }
    }
    // verify checksum and print the verified data
    if((j>=40)&&(dht11_val[4]==((dht11_val[0]+dht11_val[1]+dht11_val[2]+dht11_val[3])& 0xFF))){
        //console.log("RH:" + dht11_val[0]+ "TEMP:" + dht11_val[2]);
        return dht11_val.slice(0);
    }
    return null;
}

function parse_data(send_callback){

    pm25val=get_pm25();    
   
    cn = 0;
    while(cn < RETRY){
        temp_humi_val=get_temp_humi();
        if(temp_humi_val != null){
            pre_temp = temp_humi_val[2];
            pre_humi = temp_humi_val[0];
            break;
        }
    }

    send_callback(pre_temp, pre_humi, pm25val);
}

wpi.wiringPiSetup();
setInterval(parse_data, INTERVAL, send_message);
