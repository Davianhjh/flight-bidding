/**
 * Created by hujinhua on 17-7-3.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
var fs = require('fs');
var crypto = require('crypto');
var request = require('request');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});
/*
var AlipayConfig = {
    biz_content: {
        "timeout_express": "30m",
        "product_code": "QUICK_MSECURITY_PAY",
        "total_amount": "0.01",
        "subject": "1",
        "body": "我是测试数据",
        "out_trade_no":"070611382929370"
    },
    method: "alipay.trade.app.pay",
    charset: "utf-8",
    version: "1.0",
    app_id: "2017062807587266",
    timestamp: "2016-07-29 16:55:53",
    sign_type: "RSA2"
};
*/

var AlipayConfig = {
    app_id: "2017062807587266",
    charset: "utf-8",
    format: "json",
    method: "alipay.trade.app.pay",
    notify_url: "http://i.wenn.co/generate_204",
    timestamp: "2017-07-03 16:50:50",
    sign_type: "RSA2",
    biz_content: {
        body: "auction's final dealing price",
        subject: "updating flight class",
        out_trade_no: "",
        timeout_express:"30m",
        total_amount: "",
        seller_id: "",
        product_code:"FLIGHT_AUCTION_TICKET_UPDATING"
    },
    version:"1.0"
};

var WxpayConfig = {
    appid: "wx2421b1c4370ec43b",
    attach: "test data",
    body: "Wechat app payment",
    mch_id: "10000100",
    nonce_str: "",
    notify_url: "http://i.wenn.co/generate_204",
    out_trade_no: "",
    spbill_create_ip: "59.172.176.216",
    total_fee: 0,
    trade_type: "APP",
    sign: ""
};

var WxKey = "192006250b4c09247ec02edce69f6a2d";

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    flight: { type:String },
    id: { type:String },
    paymentPrice: { type:Number },
    paymentState: { type:Boolean }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var transactionInfoSchema = new mongoose.Schema({
    transactionID : { type:String },
    passengerID: { type:String },
    auctionID: { type:String },
    amount: { type:Number },
    date: { type:Number },
    method: { type:String },
    paymentState: { type:Boolean },
    signedstr: { type:String }
},{collection:"transactionInfo"});
var transactionInfoModel = db.model("transactionInfo", transactionInfoSchema, "transactionInfo");

var userTokenSchema = new mongoose.Schema({
    Token: { type:String },
    name: { type:String },
    tel: { type:String }
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var jwt = require('jsonwebtoken');

function getTransID(str) {
    var result ="";
    var reg= /^[A-Za-z]+$/;
    for(var i=0;i<str.length;i++){
        if(reg.test(str.charAt(i))){
            var tmp = str.charCodeAt(i) - 64;
            result = result + tmp.toString();
        }
        else {
            result = result + str.charAt(i);
        }
    }
    return result;
}

function encodeMyStr(myString) {
    var array = myString.split('&');
    var result = [];
    array.forEach(function (item, index) {
        var tmp = item.split('=');
        if(index === array.length-1){
            tmp[1] = encodeURIComponent(tmp[1]+"==");
        }
        else {
            tmp[1] = encodeURIComponent(tmp[1]);
        }
        if(index === 0)
            result = result + tmp.join('=');
        else if(index === array.length-1){
            result = result + '&' + tmp[0] + "=" + tmp[1];
        }
        else {
            result = result + '&' + tmp.join('=');
        }
    });
    return result;
}

function getParams(params) {
    var sPara = [];
    if(!params) return null;
    for(var key in params) {
        if((!params[key]) || key === "sign") {
            continue;
        }
        if(key === "biz_content"){
            sPara.push([key, JSON.stringify(params[key])]);
        }
        else sPara.push([key, params[key]]);
    }
    sPara = sPara.sort();
    var prestr = '';
    for(var i2 = 0; i2 < sPara.length; i2++) {
        var obj = sPara[i2];
        if(i2 === sPara.length - 1) {
            prestr = prestr + obj[0] + '=' + obj[1] + '';
        }
        else {
            prestr = prestr + obj[0] + '=' + obj[1] + '&';
        }
    }
    return prestr;
}

function getSign(params) {
    try {
        var privatePem = fs.readFileSync('/home/hujinhua/flight-updating-server/private.pem');
        var key = privatePem.toString();
        var prestr = getParams(params);
        var mysign = crypto.createSign('RSA-SHA256');
        mysign.update(prestr);
        mysign = mysign.sign(key, 'base64');
        return mysign;
    } catch(err) {
        console.log('err', err)
    }
}

function getVerifyParams(params) {
    var sPara = [];
    if(!params) return null;
    for(var key in params) {
        if((!params[key]) || key === "sign" || key === "sign_type") {
            continue;
        }
        sPara.push([key, params[key]]);
    }
    sPara = sPara.sort();
    var prestr = '';
    for(var i2 = 0; i2 < sPara.length; i2++) {
        var obj = sPara[i2];
        if(i2 === sPara.length - 1) {
            prestr = prestr + obj[0] + '=' + obj[1] + '';
        } else {
            prestr = prestr + obj[0] + '=' + obj[1] + '&';
        }
    }
    return prestr;
}

function verifySign(params, sign, algorithm) {
    try {
        var publicPem = fs.readFileSync('/home/hujinhua/flight-updating-server/Alipay_public.pem');
        var publicKey = publicPem.toString();
        var prestr = getVerifyParams(params);
        var verify = crypto.createVerify(algorithm);
        return verify.verify(publicKey, sign, 'base64');
    } catch(err) {
        console.log('veriSign err', err)
    }
}

function getNonceStr(){
    return Math.random().toString(36).substr(2,18);
}

function MD5Sign(params){
    var prestr = getParams(params) + "&key=" + WxKey;
    var sign = crypto.createHash('md5').update(prestr, 'utf8').digest('hex').toUpperCase();
    return sign;
}
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

router.post('/',function (req, res, next) {
    var passengerID = "";
    var action = req.query.action;
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var method = req.query.method;
    var token = req.headers['agi-token'];

    var resdata = {
        result : 1
    };
    userTokenModel.find({Token: token}, function (err, docs) {
        if (err) {
            console.log(err);
            console.log(500 + ": Server error");
            resdata.result = -1;
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resdata));
            res.end();
        }
        else {
            if (docs.length === 0) {
                console.log(400 + ": Token is wrong");
                resdata.result = -1;
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(resdata));
                res.end();
            }
            else {
                jwt.verify(token, 'secret', function (error1, decoded) {
                    if (error1) {
                        console.log(error1);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify(resdata));
                        res.end();
                    }
                    else {
                        passengerID = decoded.id;

                        if (action === "createBilling") {
                            resdata = {
                                result: 1,
                                method: "Alipay",
                                status: false,
                                transactionID: "",
                                signType: "RSA2",
                                signedstr: ""
                            };
                            biddingResultModel.find({id: passengerID, auctionID: auctionid}, function (err, docs) {
                                if (err) {
                                    console.log(err);
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    if (docs.length === 0) {
                                        console.log(404 + ": Passenger not participate in the bidding on flight " + flight);
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        var timestamp = Date.parse(new Date());
                                        var transactionid = getTransID(auctionid + passengerID) + "2";
                                        //var transactionid = parseInt(Math.random()*10000000 + 1);
                                        console.log(transactionid);
                                        var total_amount = docs[0].paymentPrice;

                                        if(method === "Alipay") {
                                            AlipayConfig.biz_content.total_amount = total_amount.toString();
                                            AlipayConfig.biz_content.out_trade_no = transactionid;
                                            var mySign = getSign(AlipayConfig);
                                            var myParam = getParams(AlipayConfig);
                                            var str = myParam + '&sign=' + mySign;
                                            var signedstr = encodeMyStr(str);
                                            var transactionData = new transactionInfoModel({
                                                "transactionID": transactionid,
                                                "passengerID": passengerID,
                                                "auctionID": auctionid,
                                                "amount": total_amount,
                                                "date": timestamp,
                                                "method": method,
                                                "paymentState": false,
                                                "signedstr": signedstr
                                            });
                                            transactionInfoModel.find({transactionID: transactionid}, function (err, docs) {
                                                if (err) {
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else if (docs.length === 0) {
                                                    transactionData.save(function (err) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                        else {
                                                            console.log('save success');
                                                            resdata.signedstr = signedstr;
                                                            resdata.transactionID = transactionid;
                                                            //console.log(signedstr);
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                    });
                                                }
                                                else {
                                                    console.log(403 + ': repeated transaction id');
                                                    resdata.signedstr = docs[0].signedstr;
                                                    resdata.transactionID = transactionid;
                                                    resdata.status = true;
                                                    //console.log(signedstr);
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                            });
                                        }
                                        else if(method === "wxpay"){
                                            WxpayConfig.nonce_str = getNonceStr();
                                            WxpayConfig.out_trade_no = auctionid + passengerID;
                                            WxpayConfig.total_fee = total_amount;
                                            WxpayConfig.sign = MD5Sign(WxpayConfig);
                                            var formdata = "<xml>";
                                            formdata += "<appid>" + WxpayConfig.appid + "</appid>";
                                            formdata += "<attach>" + WxpayConfig.attach + "</attach>";
                                            formdata += "<body>" + WxpayConfig.body + "</body>";
                                            formdata += "<mch_id>" + WxpayConfig.mch_id + "</mch_id>";
                                            formdata += "<nonce_str>" + WxpayConfig.nonce_str + "</nonce_str>";
                                            formdata += "<notify_url>" + WxpayConfig.notify_url + "</notify_url>";
                                            formdata += "<out_trade_no>" + WxpayConfig.out_trade_no + "</out_trade_no>";
                                            formdata += "<spbill_create_ip>" + WxpayConfig.spbill_create_ip + "</spbill_create_ip>";
                                            formdata += "<total_fee>" + WxpayConfig.total_fee + "</total_fee>";
                                            formdata += "<trade_type>" + WxpayConfig.trade_type + "</trade_type>";
                                            formdata += "<sign>" + WxpayConfig.sign + "</sign>";
                                            formdata += "</xml>";
                                            request({
                                                url: "https://api.mch.weixin.qq.com/pay/unifiedorder",
                                                method: "POST",
                                                body: formdata
                                            },function (err, response, body) {
                                                if(err){
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    console.log(formdata);
                                                    console.log(response.statusCode);
                                                    console.log(body);
                                                    res.end("end");
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                        }
                        else if (action === "confirmPayment") {
                            resdata = {
                                result: 1,
                                acknowledged: false
                            };
                            var alipay_trade_app_pay_response = req.body.alipay_trade_app_pay_response;
                            var sign = req.body.sign;
                            var sign_type = req.body.sign_type;
                            if (sign_type === 'RSA2')
                                sign_type = "RSA-SHA256";
                            else sign_type = "";
                            //var tmp = verifySign(alipay_trade_app_pay_response, sign, sign_type);

                            var tradeID = alipay_trade_app_pay_response.out_trade_no;
                            var total_amount = alipay_trade_app_pay_response.total_amount;
                            var seller_id = alipay_trade_app_pay_response.seller_id;
                            var app_id = alipay_trade_app_pay_response.app_id;
                            transactionInfoModel.find({transactionID: tradeID}, function (err, docs) {
                                if (err) {
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else if (docs.length === 0) {
                                    console.log(403 + ': out_trade_no is not correct');
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    if (docs[0].amount == total_amount && seller_id === "2088721362369575" && app_id === "2017062807587266") {
                                        resdata.acknowledged = true;
                                        transactionInfoModel.update({transactionID: tradeID}, {paymentState: true}, function (err) {
                                            if (err) {
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                biddingResultModel.update({
                                                    auctionID: auctionid,
                                                    id: passengerID
                                                }, {paymentState: true}, function (err) {
                                                    if (err) {
                                                        console.log(500 + ": Server error");
                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                        res.write(JSON.stringify(resdata));
                                                        res.end();
                                                    }
                                                    else {
                                                        console.log("payment confirmed successfully");
                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                        res.write(JSON.stringify(resdata));
                                                        res.end();
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        console.log("total_amount / seller_id / app_id not correct");
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/transaction'
};