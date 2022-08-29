var tcpIpsockets = require("./tcpclient-patna");
const receivers = [];
const express = require('express')
const bodyParser = require('body-parser')
// var cron = require('node-cron');
const app = express()
const port = 3001

app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

(async()=>{
try{
    await tcpIpsockets.initialiseConnections(receivers);
    connsole.log("receivers are connected");
    //console.log(receivers)
}catch(e){

}
})().catch(e=>{})

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

function hex_to_ascii(str1) {
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        //console.log(parseInt(hex.substr(n, 2), 16),"\n")
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}

function ascii_to_hexa(str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}



app.get('/', (req, res) => res.send('Hello World!'))


//0060009AF20501f1
//prefix f200 --- //30303630303038304632303246463030  -- "ff";
//Buffer.from([0xf2, 0x00, 0x30, 0x30, 0x36, 0x30, 0x30, 0x30, 0x38, 0x30, 0x46, 0x32, 0x30, 0x32, 0x46, 0x46, 0x30, 0x30, 0xff ])

//f20030303630303038304632303546323031ff
//Buffer.from([0xf2, 0x00, 0x30, 0x30, 0x36, 0x30, 0x30, 0x30, 0x38, 0x30, 0x46, 0x32, 0x30, 0x35, 0x46, 0x32, 0x30, 0x31, 0xff ])


app.post('/services/:tenantId/pas/prerecorded', async (req, res) => {
    var ConvertedHexa = ascii_to_hexa(req.body.msgid);
    var prefixes = "f200" + ConvertedHexa + "ff";
   // console.log(Buffer.from(prefixes, "hex"));
    receivers[req.params.tenantId].write(Buffer.from(prefixes, "hex"));
    res.send({"msg":"connected", "hexa": ConvertedHexa, "orginal": req.body.msgid, "prefixes": prefixes, "bffr": Buffer.from(prefixes, "hex")});
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))


//0 1 * * * every day.
 
// cron.schedule('0/2 * * * *', () => {
//   console.log('running a task two hrs');
//  process.exit(0);
// }); 
