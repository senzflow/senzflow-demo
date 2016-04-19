# Getting Started
----------

**senzflow.io是一个提供IoT SaaS服务的云平台。通过senzflow SDK，开发者和用户能快速地接入传感器和设备，进行数据收据、管理及分析；开发者和用户也能通过API，定制开发应用。**  
>本案例通过树莓派（Raspberry Pi）连接环境传感器，通过封装MQTT协议的senzFlow SDK接入senzflow.io，轻松DIY实现温湿度及PM2.5浓度的实时采集、分析。    
MQTT协议具有发布（Publish）和订阅（Subscribe）两个原语，支持不同的服务质量（QoS）和持久（Persistence）会话，同时具有设计轻巧、实现简单的特点，在低功耗、低带宽、以及链路可靠性低的环境下也能运行良好。MQTT协议也是物联网数据平台推荐的首选协议。

## 一、用户注册

### 1. 注册senzflow.io账号

打开链接  

[*https://www.senzflow.io*](https://www.senzflow.io)

点击注册，输入email地址等信息后提交，会收到系统激活邮件，根据内容操作激活，即可开始使用senzflow.io提供的服务了。

![](http://7i7ggf.com1.z0.glb.clouddn.com/beta-01-01.jpg)

### 2. 创建并下载证书

senzflow.io视数据安全为客户核心价值，设备接入必须通过安全证书的方式。
登陆senzflow.io，进入“开发者中心”，在“设备”--“接入证书”里创建证书，

![](http://7i7ggf.com1.z0.glb.clouddn.com/beta-02-01.png)

然后下载，

![](http://7i7ggf.com1.z0.glb.clouddn.com/beta-03-01.png)

压缩包中的证书分为三个文件，

 - 服务器ca证书 （ca.pem）
 - 用户ca证书 （cert.pem）
 - 用户密钥 （key.pem）

证书文件放置在树莓派当前工程./ca目录，开发者可使用相对路径。

### 3. 创建设备型号

设备分为网关（Gateway）和节点（Node），开发者根据实际情况进行添加。本例中树莓派是网关，传感器作为节点。

进入“开发者中心”，在“设备”--“设备型号”里创建网关型号如下，

![](http://7i7ggf.com1.z0.glb.clouddn.com/beta-04-01.png)

创建节点型号如下，

![](http://7i7ggf.com1.z0.glb.clouddn.com/beta-05-01.png)

### 4. 创建数据流

设备将采集的数据（或者称为一个event）被发布到一个数据流，数据流名称代表了数据类型。

senzflow.io推荐数据用`json`格式表达, 例如:

```
var temp_humi_pm25 = {
    temperature: 20,
    humidity: 70,
    pm25: 0.00128
}
```
上面的数据包含*temperature*、*humidity*和*pm25*三个`数据点`。

用户在“开发者中心”--“数据流”中定义数据流的格式，由若干个数据点构成，如下

![](http://7i7ggf.com1.z0.glb.clouddn.com/beta-06-01.png)

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

接着，开发者创建代码工程目录，安装所需Node.js库，

	sudo npm install wiring-pi
	npm install senzflow-sdk.js

### 代码模块说明

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

**clientId**

按照MQTT的设计语义，client ID即设备ID，用于标识设备。设备ID应该具有唯一性，比如Mac地址或SN，或者某种硬件序号。senzflow.io平台会提供基于client ID的设备管理服务，用户可以在senzflow.io设备管理页面中查看自己设备及其ID。

##### 设备选项

```
var options = {
    clientId: “RaspberryPI001”,
    caPath: “./ca/ca.pem”,
    keyPath: “./ca/key.pem”,
    certPath: “./ca/cert.pem”,
    meta: {
        model: “RaspberryPI”,
        name: "My RaspberryPI001",
        desc: "My RaspberryPI001 using the senzflow(©) sdk"
    }
}
```

上述选项中, meta为设备描述信息, 在_senzflow.io_设备管理控制台可见:

* `model`为设备型号
* `name`为设备名称
* `desc`为设备描述信息

##### 创建设备

```
var Device = require("senzflow-sdk.js").Device;
var myDevice = new Device(options);
```

设备将自动连接，开发者在senzflow.io的设备管理界面可以查看到名为为*RaspberryPI001*的设备。

##### 接入节点

设备通过`nodeOnline`来创建下级节点.

```
    myDevice.nodeOnline("Dht11AndPpdn42ns001", {
        model: "Dht11AndPpdn42ns",
        name: "Dht11AndPpdn42ns001",
        desc: "温湿度、PM2.5浓度传感器节点",
    })
```

上述API将生成节点*Dht11AndPpdn42ns001*，在senzflow.io控制台可以看到节点在线。

相应地, 设备可以通过`nodeOffline`来使节点离线。

```
myDevice.nodeOffline("Dht11AndPpdn42ns001")
```

##### 发布数据
  
设备使用SDK publish接口发送采集数据，JSON格式。

```
    function send_message(temp, humi, pm25){
        var msg_format = {
            timestamp:getISOString(),
            temperature:temp,
            humidity:humi,
            pm25:pm25,
            location: {lat: 22.528565, lng: 113.944126},
            addr: "华中科技大学深圳产学研基地",
        };
        myDevice.publish({
        		node: "Dht11AndPpdn42ns001", 
        		eventType: “temp_humi_pm25”, 
        		payload: msg_format, 
        		qos: 1
        	}, function(error) {
            if (error) {
                console.error("ERROR! wont publish!" , error);
            } else {
                console.log("OK! published");
            }
        });
	}
```

上面publish接口中参数`eventType`即为前文所创建的数据流`temp_humi_pm25`，QoS选择的是`QoS-1`(At Least Once)。

## 四、运行

	
配合已经下载的证书文件（./ca目录），即可运行，

    sudo node index.js

登录senzflow.io，在“运营中心”--“设备”中，即可查看到网关和节点的运行数据。

