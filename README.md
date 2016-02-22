# 环境传感器接入senzFlow.io
----------

**senzFlow.io是一个提供IoT SaaS服务的云平台。通过senzFlow SDK，开发者和用户能快速地接入传感器和设备，进行数据收据、管理及分析，形成洞见及行动。开发者和用户也能通过API，定制开发应用。**  
>本案例通过树莓派（Raspberry Pi）连接环境传感器，通过封装MQTT协议的senzFlow SDK接入senzFlow.io，轻松DIY实现温湿度及PM2.5浓度的实时采集、分析。    
MQTT协议具有发布（Publish）和订阅（Subscribe）两个原语，支持不同的服务质量（QoS）和持久（Persistence）会话，同时具有设计轻巧、实现简单的特点，在低功耗、低带宽、以及链路可靠性低的环境下也能运行良好。MQTT协议也是物联网数据平台推荐的首选协议。

## 一、用户注册

### 1. 注册senzFlow.io账号，打开链接www.senzFlow.io，点击注册，输入email地址，分分钟成为我们的一员！

![](http://7i7ggf.com1.z0.glb.clouddn.com/1.png)

### 2. 登陆senzflow.io，在“我的服务”里创建证书，然后下载，证书分为三个文件，

 - 服务器ca证书
 - 用户ca证书
 - 用户密钥

![](http://7i7ggf.com1.z0.glb.clouddn.com/2.png)

![](http://7i7ggf.com1.z0.glb.clouddn.com/3.png)

证书文件放置在树莓派/home/pi/stephen-ca目录，如下

![](http://7i7ggf.com1.z0.glb.clouddn.com/4.png)

## 二、硬件准备

### 1. 树莓派（Raspberry Pi 2）

![](http://7i7ggf.com1.z0.glb.clouddn.com/5.png)

[淘宝购买链接](https://detail.tmall.com/item.htm?id=43782363457&spm=a1z09.2.0.0.JPa01z&_u=em2t5n5c29)

### 2. 温湿度传感器DHT11

DHT11是一款湿温度一体化的数字传感器。

型号|工作电压|测量范围|测湿精度|测温精度|分辨力|封装
:---|:---|:---|:---|:---|:---|:---
DHT11|DC3.3-5V|20－90％RH0－50℃|±5％RH|±2℃|1|3针单排直插


![](http://7i7ggf.com1.z0.glb.clouddn.com/6.png)

[淘宝购买链接](https://item.taobao.com/item.htm?spm=a1z09.2.0.0.JPa01z&id=40444674032&_u=em2t5n5690)

### 3. PM2.5神荣SHINYEI粉尘传感器 PPD42NS

PPD42NS采用光散射法进行颗粒物检测。

型号|工作电压|最小粒子检出值|探测粒子范围|灵敏度|输出方式|封装
:---|:---|:---|:---|:---|:---|:---
PPD42NS|DC5V|1微米|最大到8000pcs/283ml|0.1mg/m3|PWM|5针单排直插

![](http://7i7ggf.com1.z0.glb.clouddn.com/7.png)

[淘宝购买链接](https://item.taobao.com/item.htm?spm=a1z09.2.0.0.JPa01z&id=45808969073&_u=em2t5naf3c)

### 4. 硬件连接

树莓派通过GPIO连接传感器，完成相关的I/O口操作。

#### 树莓派GPIO管脚图

树莓派具有26个普通输入和输出引脚。在这26个引脚中具有8个普通输入和输出管脚，这8个引脚既可以作为输入管脚也可以作为输出管脚。除此之外，树莓派还有一个2线形式的I2C、一个4线形式的SPI和一个UART接口。树莓派上的I2C和SPI接口也可以作为普通端口使用。如果串口控制台被关闭便可以使用树莓派上的UART功能。如果不使用I2C，SPI和UART等复用接口，那么树莓派总共具有8+2+5+2=17个普通IO。wiringPi包括一套gpio控制命令，使用gpio命令可以控制树莓派GPIO管脚。用户可以利用gpio命令通过shell脚本控制或查询GPIO管脚。

![](http://7i7ggf.com1.z0.glb.clouddn.com/8.png)

#### WiringPi驱动管脚映射图

WiringPi是应用于树莓派平台的GPIO控制库函数，WiringPi对树莓派的管脚重新进行了封装，例如WiringPi的GPIO0意味着BCM2835的GPIO17，这仅仅是一种封装映射关系，不会对开发和使用产生较大的影响。另需注意，树莓派存在版本A和版本B，版本A和版本B的GPIO管脚存在差异。

![](http://7i7ggf.com1.z0.glb.clouddn.com/9.png)

#### DHT11管脚说明

- VCC  -- 3.3V/5V电源
- GND  -- 接地
- DATA -- 数据输入输出

![](http://7i7ggf.com1.z0.glb.clouddn.com/10.png)

#### PPD42NS管脚说明

- Pin 1 -- GND接地
- Pin 3 -- +5V
- Pin 4 -- PWM(D8)

![](http://7i7ggf.com1.z0.glb.clouddn.com/11.png)


#### 连线图

![](http://7i7ggf.com1.z0.glb.clouddn.com/12.png)


## 三、软件准备

### 安装部署

首先，需要在树莓派上面安装Node.js，从nodejs.org下载最新的版本，编译安装。*注意，并不是所有最新版的Node.js都能在树莓派上使用，因为有些没有正确地指定ARM的指令集。*

接着，从GitHub上取得本案例的代码工程，安装部署，

	git clone https://github.com/senzflow/senzflow-demo.git
	cd senzflow-demo
	npm install
	
配合已经下载的证书文件（/home/pi/stephen-ca目录），即可运行，

    sudo npm start

### 案例代码说明

#### 1. WiringPi

Node.js使用的是树莓派WiringPi GPIO驱动，参考[链接](https://github.com/eugeneware/wiring-pi)，由于WiringPi GPIO驱动需要root权限，运行时，需使用`sudo`命令。

#### 2. 传感器Node.js驱动

##### DHT11

循环采集40bit数据，并通过校验byte检查数据正确性。

	function get_temp_humi(){
        wpi.pinMode(0,wpi.OUTPUT);      //set pin to output
        wpi.digitalWrite(0,wpi.LOW);    //set to low at least 18ms
        wpi.delay(18);
        wpi.digitalWrite(0,wpi.HIGH);   //set to high 20-40us
        wpi.delayMicroseconds(20);

        //start recieve dht response
        wpi.pinMode(0,wpi.INPUT);       //set pin to input

        for(i=0;i<=40;i++)
        {
            time_len = wpi.pulseIn(0, wpi.HIGH);
            // top 3 transistions are ignored, maybe aim to wait for dht finish response signal
            if(i>=1){
                idx = Math.floor(j/8);
                dht11_val[idx]<<=1;                   //write 1 bit to 0 by moving left (auto add 0)
                if((time_len==0) || (time_len>28))  //long mean 1
                    dht11_val[idx]|=1;                //write 1 bit to 1
                j++;
            }
        }
        // verify checksum and output the verified data
        if((j>=40)&&(dht11_val[4]==((dht11_val[0]+dht11_val[1]+dht11_val[2]+dht11_val[3])& 0xFF))){
            console.log("RH:" + dht11_val[0]+ "TEMP:" + dht11_val[2]);
            return dht11_val.slice(0);
        }
        return null;
	}

##### PPD42NS

采集时长为30秒，对PWM输出的脉冲宽度进行累加。

	function get_pm25(){
        wpi.pinMode(7,wpi.INPUT);
        var starttime = wpi.millis();
        DURATION = 0;
        while(wpi.millis() - starttime < SAMPLING_TIME)
        {
            DURATION = DURATION + wpi.pulseIn(7, wpi.LOW);
        }
        ratio=DURATION/(30000*10.0);
        concentration=1.1*Math.pow(ratio,3)-3.8*Math.pow(ratio,2)+520*ratio+0.62;
        pm25val=0.00207916725464941*concentration;
        return pm25val;
     }


#### 3. senzflow Node.js SDK集成

**SDK提供了一个senzflow.io IOT设备的抽象，他通过标准MQTT协议连接云端，可被管理、生成状态和事件，详见链接**

[https://github.com/senzflow/senzflow-sdk.js](https://github.com/senzflow/senzflow-sdk.js)

**MQTT协议规划设计：**

- ***clientId***：按照MQTT的设计语义，client ID即设备ID，用于标识设备。设备ID应该具有唯一性，比如Mac地址或SN，或者某种硬件序号。senzflow.io平台会提供基于client ID的设备管理服务，用户可以在senzflow.io设备管理页面中查看自己设备及其ID。
- ***topic***：senzflow.io提供基于topic的物联网消息发布-订阅服务，用户可以根据自己的设备和数据特点设置topic的组织方式。一般情况下，topic的定义可以包含了数据的类别和来源信息。例如，多地区多类别传感数据收集场景下，topic的定义可以是 `<region>/<category>/<sensor-id>`。

**代码示例：**

    // 创建设备，使用证书
    const myDevice = new Device('mqtts://senzflow.io:8883', {
        clientId: 'Temp-Humi-PM25',
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

    // 设备使用SDK publish接口发送采集数据，JSON格式
    function send_message(temp, humi, pm25){
        var msg_format = {
            timestamp:getISOString(),
            temperature:temp,
            humidity:humi,
            pm25:pm25,
            location: {lat: 22.528565, lng: 113.944126},
            addr: "华中科技大学深圳产学研基地",
        };
        var msg_json = JSON.stringify(msg_format);
        myDevice.publish("senzflowdemo/temp-humi-pm25", msg_json, function(error) {
            if (error) {
                console.error("ERROR! wont publish!" , error);
            } else {
                console.log("OK! published");
            }
        });
	}

## 四、运行呈现

### 1. 启动Node.js客户端，树莓派接入senzflow.io，每分钟采集一次传感器数据并通过publish上传。

		cd senzflow-demo  
		sudo npm start

登陆senzflow.io后，可在“设备管理”页面中看到my IOT Device。

![](http://7i7ggf.com1.z0.glb.clouddn.com/13.png)

![](http://7i7ggf.com1.z0.glb.clouddn.com/14.png)

### 2. senzflow页面呈现

#### 实时数据

![](http://7i7ggf.com1.z0.glb.clouddn.com/15.png)

#### 历史数据

用户可选择以普通文件或二级制格式下载历史数据。

![](http://7i7ggf.com1.z0.glb.clouddn.com/16.png)
