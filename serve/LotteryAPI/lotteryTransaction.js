/**
 * Created by hujinhua on 17-8-15.
 */
/**
 * Created by hujinhua on 17-7-3.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
var fs = require('fs');
var crypto = require('crypto');
var request = require('request');
var WxPay = require('../api/WxPay');
var POOL = require('./startLottery');
var TEST_SWITCH = true;

mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

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

var Wxpay_Config = {
    appid: "wxd930ea5d5a258f4f",
    attach: "test data",
    body: "Wechat app payment",
    mch_id: "10000100",
    nonce_str: "",
    notify_url: "http://220.202.15.42:10006/Wxpay_notify",
    out_trade_no: "",
    spbill_create_ip: "",
    total_fee: 0,
    trade_type: "APP",
    key: "192006250b4c09247ec02edce69f6a2d"
};

var WxPay_Options = {
    spbill_create_ip: "",
    out_trade_no: '',
    total_fee: 0
};

var lotteryResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    id: { type:String },
    flight: { type:String },
    //seat: { type:String },
    biddingPrice: { type:Number },
    lotterynum: { type:Number },
    timeStamp: { type:Number },
    paymentState: { type:Boolean },
    luckyRegion: { type:Array },
    hit: { type:Boolean }
}, {collection:"lotteryResult"});
var lotteryResultModel = db.model("lotteryResult", lotteryResultSchema,"lotteryResult");

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

function verifySign(params, sign, algorithm) {
    try {
        var publicPem = fs.readFileSync('/home/hujinhua/flight-updating-server/Alipay_public.pem');
        var publicKey = publicPem.toString();
        var prestr = JSON.stringify(params);
        var verify = crypto.createVerify(algorithm);
        verify.update(prestr);
        return verify.verify(publicKey, sign, 'base64');
    } catch(err) {
        console.log('verifySign err', err)
    }
}

function regionFormat(arr){
    var res = [];
    for(var i=0;i<arr.length;i++){
        var length = arr[i].length;
        var start = arr[i][0];
        var end = arr[i][length-1];
        res[i] = [start, end];
    }
    return res;
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
    var user_ip = req.connection.remoteAddress;

    var resdata = {
        result : 1
    };
    userTokenModel.findOne({Token: token}, function (err, docs) {
        if (err) {
            console.log(err);
            console.log(500 + ": Server error");
            resdata.result = -1;
            res.json(resdata);
            res.end();
        }
        else {
            if (docs === null) {
                console.log(400 + ": Token is wrong");
                resdata.result = -1;
                res.json(resdata);
                res.end();
            }
            else {
                jwt.verify(token, 'secret', function (error1, decoded) {
                    if (error1) {
                        console.log(error1);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.json(resdata);
                        res.end();
                    }
                    else {
                        passengerID = decoded.id;
                        if (action === "createBilling") {
                            lotteryResultModel.find({id: passengerID, auctionID: auctionid, paymentState:false})
                                .sort({timeStamp: -1})
                                .exec(function (err, docs) {
                                    if (err) {
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        if (docs.length === 0) {
                                            console.log(404 + ": Passenger not participate in the lottery ticket on flight " + flight);
                                            res.json(resdata);
                                            res.end();
                                        }
                                        else {
                                            var timestamp = Date.parse(new Date());
                                            var transactionid = getTransID(flight + passengerID) + (timestamp/1000).toString();
                                            console.log(transactionid);
                                            var total_amount = docs[0].biddingPrice;
                                            if (method === "Alipay") {
                                                resdata = {
                                                    result: 1,
                                                    method: method,
                                                    status: false,
                                                    transactionID: "",
                                                    signType: "RSA2",
                                                    signedstr: "",
                                                    price: 0
                                                };
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
                                                transactionInfoModel.findOne({transactionID: transactionid}, function (err, docs) {
                                                    if (err) {
                                                        console.log(err);
                                                        console.log(500 + ": Server error");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else if (docs === null) {
                                                        transactionData.save(function (err) {
                                                            if (err) {
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                            else {
                                                                console.log('save success');
                                                                resdata.signedstr = signedstr;
                                                                resdata.transactionID = transactionid;
                                                                resdata.price = total_amount;
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        console.log(403 + ': repeated transaction id');
                                                        resdata.signedstr = docs.signedstr;
                                                        resdata.transactionID = transactionid;
                                                        resdata.price = total_amount;
                                                        resdata.status = true;
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                });
                                            }
                                            else if (method === "wxpay") {
                                                var wxpay = new WxPay(Wxpay_Config);
                                                WxPay_Options.out_trade_no = transactionid;
                                                WxPay_Options.total_fee = total_amount;
                                                WxPay_Options.spbill_create_ip = user_ip;
                                                wxpay.requestPay(WxPay_Options, function (err, result) {
                                                    if (err) {
                                                        console.log('ERROR: ' + err);
                                                    }
                                                    else if (result.return_code === 'FAIL') {
                                                        console.log("return_msg: " + result.return_msg);
                                                        resdata.prepay_id = "";
                                                        resdata.signedstr = "";
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else if (result.result_code !== 'SUCCESS') {
                                                        console.log("result_code" + result.return_code);
                                                        resdata.prepay_id = "";
                                                        resdata.signedstr = "";
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else {
                                                        console.log(result);
                                                        var timeStamp = Date.parse(new Date()) / 1000;
                                                        var Prepay_Config = {
                                                            appid: Wxpay_Config.appid,
                                                            partnerid: Wxpay_Config.mch_id,
                                                            package: "Sign=WXPay",
                                                            key: Wxpay_Config.key
                                                        };
                                                        var Prepay_options = {
                                                            prepay_id: result.prepay_id,
                                                            timestamp: timeStamp
                                                        };
                                                        var prepay = new WxPay(Prepay_Config);
                                                        var data = prepay.WXsign(Prepay_options);
                                                        resdata.appid = Wxpay_Config.appid;
                                                        resdata.partnerid = Wxpay_Config.mch_id;
                                                        resdata.prepay_id = result.prepay_id;
                                                        resdata.package = "Sign=WXPay";
                                                        resdata.noncestr = data.noncestr;
                                                        resdata.timestamp = timeStamp;
                                                        resdata.sign = data.sign;
                                                        res.json(resdata);
                                                        res.end();
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
                                acknowledged: false,
                                total: 0,
                                lotterynum: -1,
                                luckyRegion: []
                            };
                            if(TEST_SWITCH){
                                lotteryResultModel.find({auctionID: auctionid, id: passengerID, paymentState:true})
                                    .sort({timeStamp: -1})
                                    .exec(function (err, docs) {
                                    if (err) {
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        if(docs.length === 0) {
                                            var init = [];
                                            var now_lotterynum = 0;
                                        }
                                        else {
                                            init = docs[0].luckyRegion;
                                            now_lotterynum = docs[0].lotterynum;
                                        }
                                        var tradeID = req.body.out_trade_no;
                                        var total_amount = parseInt(req.body.total_amount);
                                        transactionInfoModel.findOne({transactionID: tradeID}, function (err, docs) {
                                            if (err) {
                                                console.log(500 + ": Server error");
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else if (docs === null) {
                                                console.log(403 + ': out_trade_no is not correct');
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else {
                                                resdata.acknowledged = true;
                                                transactionInfoModel.update({transactionID: tradeID}, {paymentState: true}, function (err) {
                                                    if (err) {
                                                        console.log(500 + ": Server error");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else {
                                                        var start = POOL.lotteryPool[auctionid] + 1;
                                                        POOL.lotteryPool[auctionid] += total_amount;
                                                        resdata.total = POOL.lotteryPool[auctionid];
                                                        console.log("NOW POOL: " + POOL.lotteryPool[auctionid]);
                                                        var region = [];
                                                        for (var i = 0; i < total_amount; i++) {
                                                            region.push(start + i);
                                                        }
                                                        init.push(region);
                                                        now_lotterynum += total_amount;
                                                        lotteryResultModel.create({
                                                            auctionID: auctionid,
                                                            id: passengerID,
                                                            flight: flight,
                                                            biddingPrice: 0,
                                                            lotterynum: now_lotterynum,
                                                            timeStamp: Date.parse(new Date()),
                                                            paymentState: true,
                                                            luckyRegion: init,
                                                            hit: false
                                                        }, function (err) {
                                                            if (err) {
                                                                console.log(500 + ": Server error");
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                            else {
                                                                console.log("payment confirmed successfully");
                                                                resdata.acknowledged = true;
                                                                resdata.lotterynum = now_lotterynum;
                                                                resdata.luckyRegion = regionFormat(init);
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            else {
                                if (method === "Alipay") {
                                    var alipay_trade_app_pay_response = req.body.alipay_trade_app_pay_response;
                                    var sign = req.body.sign;
                                    var sign_type = req.body.sign_type;
                                    if (sign_type === 'RSA2')
                                        sign_type = "RSA-SHA256";
                                    else if (sign_type === 'RSA')
                                        sign_type = "RSA-SHA1";
                                    else {
                                        console.log(403 + ': sign_type is not correct');
                                        res.json(resdata);
                                        res.end();
                                        return;
                                    }
                                    lotteryResultModel.find({auctionID: auctionid, id: passengerID, paymentState: true})
                                        .sort({timeStamp: -1})
                                        .exec(function (err, docs) {
                                        if (err) {
                                            console.log(500 + ": Server error");
                                            res.json(resdata);
                                            res.end();
                                        }
                                        else {
                                            if (docs.length === 0) {
                                                console.log(404 + ': passenger not found in lotteryResult');
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else {
                                                if(docs.length === 0) {
                                                    var init = [];
                                                    var now_lotterynum = 0;
                                                }
                                                else {
                                                    init = docs[0].luckyRegion;
                                                    now_lotterynum = docs[0].lotterynum;
                                                }
                                                var verifyResult = verifySign(alipay_trade_app_pay_response, sign, sign_type);
                                                if (verifyResult) {
                                                    // sign is verified successfully
                                                    var tradeID = alipay_trade_app_pay_response.out_trade_no;
                                                    var total_amount = parseInt(alipay_trade_app_pay_response.total_amount);
                                                    var seller_id = alipay_trade_app_pay_response.seller_id;
                                                    var app_id = alipay_trade_app_pay_response.app_id;
                                                    transactionInfoModel.findOne({transactionID: tradeID}, function (err, docs) {
                                                        if (err) {
                                                            console.log(500 + ": Server error");
                                                            res.json(resdata);
                                                            res.end();
                                                        }
                                                        else if (docs === null) {
                                                            console.log(403 + ': out_trade_no is not correct');
                                                            res.json(resdata);
                                                            res.end();
                                                        }
                                                        else {
                                                            if (docs.amount === total_amount && seller_id === "2088721362369575" && app_id === "2017062807587266") {
                                                                resdata.acknowledged = true;
                                                                transactionInfoModel.update({transactionID: tradeID}, {paymentState: true}, function (err) {
                                                                    if (err) {
                                                                        console.log(500 + ": Server error");
                                                                        res.json(resdata);
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        var start = POOL.lotteryPool[auctionid] + 1;
                                                                        POOL.lotteryPool[auctionid] += total_amount;
                                                                        resdata.total = POOL.lotteryPool[auctionid];
                                                                        var region = [];
                                                                        for (var i = 0; i < total_amount; i++) {
                                                                            region.push(start + i);
                                                                        }
                                                                        init.push(region);
                                                                        now_lotterynum += total_amount;
                                                                        lotteryResultModel.create({
                                                                            auctionID: auctionid,
                                                                            id: passengerID,
                                                                            flight: flight,
                                                                            biddingPrice: 0,
                                                                            lotterynum: now_lotterynum,
                                                                            timeStamp: Date.parse(new Date()),
                                                                            paymentState: true,
                                                                            luckyRegion: init,
                                                                            hit: false
                                                                        }, function (err) {
                                                                            if (err) {
                                                                                console.log(500 + ": Server error");
                                                                                res.json(resdata);
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                console.log("payment confirmed successfully");
                                                                                resdata.acknowledged = true;
                                                                                resdata.lotterynum = now_lotterynum;
                                                                                resdata.luckyRegion = regionFormat(init);
                                                                                res.json(resdata);
                                                                                res.end();
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                console.log("total_amount / seller_id / app_id not correct");
                                                                resdata.lotterynum = now_lotterynum;
                                                                resdata.luckyRegion = regionFormat(init);
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                        }
                                                    });
                                                }
                                                else {
                                                    console.log(403 + ": signature verify failed");
                                                    resdata.lotterynum = now_lotterynum;
                                                    resdata.luckyRegion = regionFormat(init);
                                                    res.json(resdata);
                                                    res.end();
                                                }
                                            }
                                        }
                                    });
                                }
                                else {
                                    //TODO weichat payment confirm
                                }
                            }
                        }
                    }
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/lotteryTransaction'
};
