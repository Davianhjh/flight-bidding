/**
 * Created by hujinhua on 17-8-15.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
var LOTTERY_POOL = {};
var BASEPRICE_SWITCH = false;
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var Xinge = require('../api/Xinge');
var Xinge_Config = {
    access_id: 2100263276,
    secretKey: "ecc4c3ab199f1e5cca148e087d2ba0fd"
};

var xinge = new Xinge(Xinge_Config);

var lotteryResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    id: { type:String },
    flight: { type:String },
    seat: { type:String },
    biddingPrice: { type:Number },
    lotterynum: { type:Number },
    timeStamp: { type:Number },
    paymentState: { type:Boolean },
    luckyRegion: { type:Array },
    hit: { type:Boolean }
}, {collection:"lotteryResult"});
var lotteryResultModel = db.model("lotteryResult", lotteryResultSchema,"lotteryResult");

var lotteryRecordSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    id: { type:String },
    name: { type:String },
    tel: { type:String },
    seat: { type:String },
    lotterynum: { type:Number },
    luckyRegion: { type:Array },
    luckynum: { type:Number },
    total: { type:Number }
}, {collection:"lotteryRecord"});
var lotteryRecordModel = db.model("lotteryRecord", lotteryRecordSchema,"lotteryRecord");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    name: { type:String },
    tel: { type:String },
    flight: { type:String },
    date: { type:String },
    userstatus: { type: Number }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var flightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    state: { type:Number }
},{collection:"flightManage"});
var flightManageModel = db.model("flightMange", flightManageSchema,"flightManage");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight : { type:String },
    attentantUUID: { type:String },
    baseprice: { type:Number },
    timelap: { type:Number },
    seatnum: { type:Number },
    startTime: { type:Number },
    auctionType: { type: Number },
    auctionState: { type: Number },
    count: { type: Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var auctionFlightManageSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionType: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number },
    date: { type:String },
    timeLap: { type:Number },
    baseprice: { type:Number },
    flight: { type:String }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

var userTokenSchema = new mongoose.Schema({
    Token: { type:String },
    name: { type:String },
    tel: { type:String },
    deviceToken: { type:String }
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");

var serverTokenSchema = new mongoose.Schema({
    Token: { type:String }
},{collection:"serverToken"});
var serverTokenModel = db.model("serverToken", serverTokenSchema,"serverToken");
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

function getParticipateRegion(arr) {
    var str = [];
    for(var i=0;i<arr.length;i++){
        for(var j=0;j<arr[i].length;j++) {
            str.push(arr[i][j]);
        }
    }
    return str;
}

function getLuckyPerson(region, luckynum) {
    for(var i=0;i<region.length;i++){
        if(region[i] === luckynum)
            return true;
    }
    return false;
}

router.post('/', function (req, res, next) {
    var attendantID = "";
    var token = req.headers['agi-token'];
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var seatnum = req.body.seatnum;
    var type = req.body.type;
    var dateStr = req.body.date;

    var resdata = {
        result: 1,
        auction: -1,
        timelap: -1
    };

    if(typeof(seatnum) === "undefined" || seatnum <= 0){
        console.log("seat number params error");
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resdata));
        res.end();
        return;
    }

    if(typeof(auctionid) === "undefined"){
        auctionid = dateStr + flight + "LOT" + type;
    }

    auctionFlightManageModel.findOneAndUpdate({auctionID: auctionid}, {
        $set: {
            seatnum: seatnum,
            auctionState: 1
        }
    }, {new: false}, function (err, lists) {
        if (err) {
            console.log(err);
            console.log(500 + ": Server error");
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resdata));
            res.end();
        }
        else if (typeof(auctionid) === "undefined" || lists === null) {
            console.log(403 + ": auctionID invalid params error");
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resdata));
            res.end();
            return;
        }
        else {
            var auctionType = lists.auctionType;
            var baseprice = lists.baseprice;
            var date = lists.date;
            var timelap = lists.timeLap;
            var startTime = Date.parse(new Date());
            var auctionData = new auctionParamModel({
                "auctionID": auctionid,
                "flight": flight,
                "attentantUUID": "BACKEND",
                "baseprice": baseprice,
                "timelap": timelap,
                "seatnum": seatnum,
                "startTime": startTime,
                "auctionType": auctionType,
                "auctionState": 1,
                "count": 0
            });

            auctionParamModel.find({auctionID: auctionid}, function (error, docs) {
                if (error) {
                    console.log(error);
                    console.log(500 + ": Server error");
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(resdata));
                    res.end();
                }
                else {
                    if (docs.length === 0) {
                        auctionData.save(function (err) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                console.log('save success');
                                resdata.auction = 1;
                                resdata.timelap = timelap;
                                LOTTERY_POOL[auctionid] = 0;

                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));

                                flightInfoModel.update({
                                    flight: flight,
                                    date: date
                                }, {userstatus: -1}, {multi: true}, function (err) {
                                    if (err) {
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        var updateState = function () {
                                            return auctionParamModel.findOneAndUpdate({auctionID: auctionid}, {auctionState: 2, count:LOTTERY_POOL[auctionid]}, {new: false}, function (err, list) {
                                                if (err)
                                                    console.log(err);
                                                else {
                                                    var flight = list.flight;
                                                    var basePrice = lists.baseprice;
                                                    auctionFlightManageModel.update({auctionID: auctionid}, {auctionState:2}, function (error) {
                                                        if (error)
                                                            console.log(error);
                                                        else {
                                                            console.log('update auctionState to 2');
                                                            flightManageModel.update({state: 0}, function (error) {
                                                                if (error)
                                                                    console.log(error);
                                                                else {
                                                                    console.log("update flight " + flight + "'s state to 2");
                                                                    var Xinge_Option = {
                                                                        device_token: "",
                                                                        message_type: 1,
                                                                        message: {
                                                                            content: '',
                                                                            title: ''
                                                                        },
                                                                        action: {
                                                                            action_type: 1,
                                                                            activity: "com.agiview.flightupdating.client.ResultActivity"
                                                                        },
                                                                        path: "/v2/push/single_device"
                                                                        // TO be added
                                                                    };
                                                                    var LUCKYNUM = 0;
                                                                    var total = LOTTERY_POOL[auctionid];
                                                                    var MAX = Math.pow(2,31);
                                                                    var MIN = Math.pow(2,30);
                                                                    var candidateID = [];
                                                                    var LUCKYID = "";
                                                                    if(total === 1){
                                                                        LUCKYNUM = 1;
                                                                        console.log("Only one ticket");
                                                                    }
                                                                    else if(total === 0){
                                                                        LUCKYNUM = 0;
                                                                        console.log("no one in");
                                                                    }
                                                                    else if(total < basePrice && BASEPRICE_SWITCH){
                                                                        LUCKYNUM = Math.floor((Math.random()*(MAX-MIN)+MIN) % basePrice);
                                                                        if(LUCKYNUM === 0)
                                                                            LUCKYNUM = basePrice;
                                                                    }
                                                                    else {
                                                                        LUCKYNUM = Math.floor((Math.random()*(MAX-MIN)+MIN) % total);
                                                                        if(LUCKYNUM === 0)
                                                                            LUCKYNUM = total;
                                                                    }
                                                                    console.log("LUCKYNUM: " + LUCKYNUM);
                                                                    LOTTERY_POOL[auctionid] = 0;
                                                                    if(LUCKYNUM <= total) {
                                                                        // TODO someone got hit
                                                                        lotteryResultModel.find({auctionID: auctionid}, function (err, docs) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                            }
                                                                            else {
                                                                                for (var i = 0; i < docs.length; i++) {
                                                                                    var region = getParticipateRegion(docs[i].luckyRegion);
                                                                                    var passengerID = docs[i].id;
                                                                                    console.log(passengerID + ": " + region);
                                                                                    candidateID.push(passengerID);
                                                                                    if (getLuckyPerson(region, LUCKYNUM)) {
                                                                                        LUCKYID = passengerID;
                                                                                        console.log("find the lucky one: " + LUCKYID);
                                                                                        lotteryResultModel.findOneAndUpdate({
                                                                                            auctionID: auctionid,
                                                                                            id: LUCKYID
                                                                                        }, {hit: true}, function (err, doc) {
                                                                                            if (err) {
                                                                                                console.log(err);
                                                                                            }
                                                                                            else {
                                                                                                userTokenModel.find({id: LUCKYID}, function (err, lists) {
                                                                                                    if (err) {
                                                                                                        console.log("Error: " + err);
                                                                                                    }
                                                                                                    else {
                                                                                                        Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                        Xinge_Option.message.title = "Flight updating service message";
                                                                                                        Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，以" + LUCKYNUM + "的幸运数字，成功获得商务舱位，请您通过app进行支付。";
                                                                                                        xinge.send(Xinge_Option, function (err, result) {
                                                                                                            if (err) {
                                                                                                                console.log('ERROR: ' + err);
                                                                                                            }
                                                                                                            console.log(result);
                                                                                                        });
                                                                                                        var recordData = new lotteryRecordModel({
                                                                                                            auctionID: auctionid,
                                                                                                            flight: flight,
                                                                                                            id: LUCKYID,
                                                                                                            name: lists[0].name,
                                                                                                            tel: lists[0].tel,
                                                                                                            seat: doc.seat,
                                                                                                            lotterynum: doc.lotterynum,
                                                                                                            luckyRegion: doc.luckyRegion,
                                                                                                            luckynum: LUCKYNUM,
                                                                                                            total: total
                                                                                                        });
                                                                                                        lotteryRecordModel.find({
                                                                                                            auctionID: auctionid,
                                                                                                            id: LUCKYID
                                                                                                        }, function (err, arr) {
                                                                                                            if (err) {
                                                                                                                console.log(err);
                                                                                                            }
                                                                                                            else {
                                                                                                                if (arr.length === 0) {
                                                                                                                    recordData.save(function (err) {
                                                                                                                        if (err) {
                                                                                                                            console.log(err);
                                                                                                                        }
                                                                                                                        else {
                                                                                                                            console.log("lottery record saved");
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                                else {
                                                                                                                    console.log("Error: repeat lottery record");
                                                                                                                }
                                                                                                            }
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }
                                                                                candidateID.forEach(function (doc, index) {
                                                                                    flightInfoModel.update({
                                                                                        flight: flight,
                                                                                        id: doc
                                                                                    }, {userstatus: 1}, function (err) {
                                                                                        if (err) {
                                                                                            console.log(err);
                                                                                        }
                                                                                        else {
                                                                                            if (doc !== LUCKYID) {
                                                                                                userTokenModel.find({id: doc}, function (err, lists) {
                                                                                                    if (err) {
                                                                                                        console.log("Error: " + err);
                                                                                                    }
                                                                                                    else {
                                                                                                        Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                        Xinge_Option.message.title = "Flight updating service message";
                                                                                                        Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                                        xinge.send(Xinge_Option, function (err, result) {
                                                                                                            if (err) {
                                                                                                                console.log('ERROR: ' + err);
                                                                                                            }
                                                                                                            console.log(result);
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                        }
                                                                                    });
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                    else {
                                                                        // TODO no one got hit
                                                                        for (var i = 0; i < docs.length; i++) {
                                                                            var region = getParticipateRegion(docs[i].luckyRegion);
                                                                            var passengerID = docs[i].id;
                                                                            console.log(passengerID + ": " + region);
                                                                            candidateID.push(passengerID);
                                                                        }
                                                                        var recordData = new lotteryRecordModel({
                                                                            auctionID: auctionid,
                                                                            flight: flight,
                                                                            id: "",
                                                                            name: "",
                                                                            tel: "",
                                                                            seat: "",
                                                                            lotterynum: "",
                                                                            luckyRegion: "",
                                                                            luckynum: LUCKYNUM
                                                                        });
                                                                        lotteryRecordModel.find({
                                                                            auctionID: auctionid,
                                                                            id: LUCKYID
                                                                        }, function (err, arr) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                            }
                                                                            else {
                                                                                if (arr.length === 0) {
                                                                                    recordData.save(function (err) {
                                                                                        if (err) {
                                                                                            console.log(err);
                                                                                        }
                                                                                        else {
                                                                                            console.log("lottery record saved");
                                                                                            candidateID.forEach(function (doc, index) {
                                                                                                flightInfoModel.update({
                                                                                                    flight: flight,
                                                                                                    id: doc
                                                                                                }, {userstatus: 1}, function (err) {
                                                                                                    if (err) {
                                                                                                        console.log(err);
                                                                                                    }
                                                                                                    else {
                                                                                                        userTokenModel.find({id: doc}, function (err, lists) {
                                                                                                            if (err) {
                                                                                                                console.log("Error: " + err);
                                                                                                            }
                                                                                                            else {
                                                                                                                Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                                Xinge_Option.message.title = "Flight updating service message";
                                                                                                                Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                                                xinge.send(Xinge_Option, function (err, result) {
                                                                                                                    if (err) {
                                                                                                                        console.log('ERROR: ' + err);
                                                                                                                    }
                                                                                                                    console.log(result);
                                                                                                                });
                                                                                                            }
                                                                                                        });
                                                                                                    }
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    console.log("Error: repeat lottery record");
                                                                                }
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        };
                                        setTimeout(updateState, timelap * 1000);

                                    }
                                    res.end();
                                });
                            }
                        });
                    }
                    else {
                        console.log(403 + ': repeated auction id save failure');
                        res.write(JSON.stringify(resdata));
                        res.end();
                    }
                }
            });
        }
    });
});

module.exports = {
    router: router,
    path: '/startLottery',
    lotteryPool: LOTTERY_POOL
};
