var net = require('net');
const axios = require("axios");
const R = require("ramda");
var config =  require("./config.json");
//const config = JSON.parse(x);
var moment = require("moment");
var request = require("request");

module.exports.initialiseConnections = async function(receivers) {
    try {
        R.mapObjIndexed(async(val,key,obj) => {
            console.log(val, key);
            await connectTCPIP(val, key,receivers);
        }, config)
    } catch (err) {
        console.log("Error Occured::::", err);
    }
}

async function connectTCPIP(obj, i, receivers) {
    const client = new net.Socket();
    try {
        receivers[obj.tenantId] = client.connect(obj.port, obj.ipAddress)
        receivers[obj.tenantId].on("connect", function () {
            console.log((new Date().toUTCString()) + ":::Connected to "+config[i].tenantId+" PABOX")
            let startbuffer = Buffer.from([0xf2, 0x00]);
            let endbuffer = Buffer.from([0xff]);
            var finalbuffer = Buffer.concat([startbuffer, endbuffer])
            client.write(finalbuffer);
        });

        receivers[obj.tenantId].on('data', function (data) {

            //let data = Buffer.from([]);
            /*while (d = readable.read(readable.readableLength)) {
              if(d !== null && d.toString()!=""){
                data = Buffer.concat([data, d])
              }
            }*/
            if (data.toString()) {
                var d = JSON.parse(JSON.stringify(data));
                var ConvertedHexa = decimal_to_hex(d["data"]);
                if (ConvertedHexa.indexOf('f100ff') >= 0 || ConvertedHexa.indexOf('F100FF') >= 0) {
                    client.write(Buffer.from([0xf1, 0x00, 0xff]));
                    //client.end();
                }
            }
            console.log(data.toString(), ConvertedHexa);
            if (ConvertedHexa !== "f100ff") {
                sendDataToAtlantis(data, i)
            }
        });

        receivers[obj.tenantId].on('error', function (data) {
            console.log((new Date().toUTCString()) + "::Error In "+config[i].tenantId+" PABOX Connection:::::")
        });

        receivers[obj.tenantId].on('close', function () {
            console.log((new Date().toUTCString()) + "::: "+config[i].tenantId+" PABOX Connection is getting closed:::::")
            delete client;
			console.log((config)[i]);
            connectTCPIP((config)[i], i, receivers)
        });
    } catch (e) {
        console.log((new Date().toUTCString()) + "::: "+config[i].tenantId+" Error In connectTCPIP Function:::::", e)
    }
}

async function sendDataToAtlantis(data,i) {
    try {
        console.log(JSON.stringify({ "data": data.toString() }));

       // let tokenData = await getToken(i);
       // console.log("tokenDataa-----------------------------", tokenData);
        //if (tokenData) {
            let options = Object.assign({}, config[i].adapterApi)
            var dstr = data.toString();
            var dstrmatch = dstr.match(/(005B|0042)[\s\S]{12}/ig);
            options.data = { "input": { "data": dstrmatch } }
           // options.headers["Authorization"] = "Bearer " +tokenData
            console.log(JSON.stringify(options));
            //let response = await axios(options)
	    var tokenOptions = {
            method: 'POST',
            rejectUnauthorized: false, 
            url: 'https://smartpatna.quantela.com/qpa/1.0.0/webhooks/smartpatna.com/paboxwebhook?apikey=478d5225-0d88-4910-b928-595df5055384',
            headers: {
                'content-type': 'application/json',

            },
            body: {"input": { "data": dstrmatch } },
            json: true
        };

request(tokenOptions, function (error2, tokenData, body2) {
            if (error2) {
                //cb(error2);
                console.log((new Date().toUTCString()) + ":::"+config[i].tenantId+" Error In Sending Data to Atlantis API:::::")
            } else if (tokenData && tokenData.statusCode && tokenData.statusCode == 200) {
                //console.log("data published to qp");
                console.log((new Date().toUTCString()) + ":::"+config[i].tenantId+" Data Pushed to Atlantis API Successfully:::::")
            }
        });
          /*  if (response && response.data && !response.data.error) {
                console.log((new Date().toUTCString()) + ":::"+config[i].tenantId+" Data Pushed to Atlantis API Successfully:::::", response.data)
            } else {
                console.log((new Date().toUTCString()) + ":::"+config[i].tenantId+" Error In Sending Data to Atlantis API:::::", JSON.stringify(response.data))
            }*/
        // } else {
        //     console.log((new Date().toUTCString()) + ":::"+config[i].tenantId+" Token Missing to send Data to Atlantis API:::::")
        // }
    } catch (error) {
        console.log((new Date().toUTCString()) + ":::"+config[i].tenantId+" Error In Sending Data to Atlantis API:::::", JSON.stringify(error))
    }
}

async function getToken(index) {
    console.log("Get Token being triggered", config[index].tenantId, config[index].access_token, config[index].tokenTime);
    if(config[index].access_token != null && config[index].tokenTime != null){
    console.log(config[index].tokenTime ,  new moment(new Date()).add(0, 'm').toDate())
      if(config[index].tokenTime > new moment(new Date()).add(0, 'm').toDate()){
           return config[index].access_token;
      }else{
        config[index].tokenTime = null, config[index].access_token = null;
        getToken(index, function(req, response){
          console.log("refresh token generated", response);
          return config[index].access_token;
        })
      }
    }else{
      var tokenOptions = {
        method: 'POST',
        url: config[index].tokenApi.url,
        headers: {
          'content-type': 'application/json'
        },
        body: config[index].tokenApi.data,
        json: true
      };
     console.log(tokenOptions);
      request(tokenOptions, function (error2, tokenData, body2) {
        if (error2) {
          return false;
        } else if (tokenData && tokenData.statusCode && tokenData.statusCode == 200) {
          console.log(new moment(new Date()).add(60, 'm').toDate());
          tokenTime = new moment(new Date()).add(60, 'm').toDate();
          access_token = tokenData.body.access_token
          config[index].access_token = tokenData.body.access_token;
          config[index].tokenTime = tokenTime;
          console.log("new token given", config[index].tenantId, access_token);
          return access_token;
        }
      });
    }
};

function hex_to_ascii(str1) {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        //console.log(parseInt(hex.substr(n, 2), 16),"\n")
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}

function decimal_to_hex(data) {
    var hexString = "";
    var ascii = "";
    for (i = 0; i < data.length; i++) {
        var str = data[i].toString(16);
        if (str.length % 2) {
            str = '0' + str;
        }
        ascii = ascii + hex_to_ascii(str)
        hexString = hexString + str;
    }
    //console.log("Asciii:",ascii);
    return hexString;
}


function ascii_to_hexa(str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}

//initialiseConnections();
