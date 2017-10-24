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

var flightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    state: { type:Number }
},{collection:"flightManage"});
var flightManageModel = db.model("flightMange", flightManageSchema,"flightManage");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    name: { type:String },
    tel: { type:String },
    flight: { type:String },
    seat: { type:String },
    date: { type:String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight : { type:String },
    attendantUUID: { type:String },
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
    var token = req.headers['agi-token'];
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var seatnum = req.body.seatnum;
    var type = req.body.type;
    var stage = req.body.stage;
    var dateStr = req.body.date;

    var resdata = {
        result: 1,
        auction: -1,
        timelap: -1
    };

    if(typeof(seatnum) === "undefined" || parseInt(seatnum) <= 0){
        console.log("seat number params error");
        res.json(resdata);
        res.end();
        return;
    }
    if(typeof(auctionid) === "undefined"){
        auctionid = dateStr + flight + "LOT" + type + "S" + stage.toString();

    }
    seatnum = parseInt(seatnum);
    auctionFlightManageModel.findOneAndUpdate({auctionID: auctionid}, {
        $set: {
            seatnum: seatnum,
            auctionState: 1
        }
    }, {new: false}, function (err, lists) {
        if (err) {
            console.log(err);
            console.log(500 + ": Server error");
            res.json(resdata);
            res.end();
        }
        else if (typeof(auctionid) === "undefined" || lists === null) {
            console.log(403 + ": auctionID invalid params error");
            res.json(resdata);
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
                "attendantUUID": "BACKEND",
                "baseprice": baseprice,
                "timelap": timelap,
                "seatnum": seatnum,
                "startTime": startTime,
                "auctionType": auctionType,
                "auctionState": 1,
                "count": 0
            });
            auctionParamModel.findOne({auctionID: auctionid}, function (error, docs) {
                if (error) {
                    console.log(error);
                    console.log(500 + ": Server error");
                    res.json(resdata);
                    res.end();
                }
                else {
                    if (docs === null) {
                        auctionData.save(function (err) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                console.log('save success');
                                resdata.auction = 1;
                                resdata.timelap = timelap;
                                LOTTERY_POOL[auctionid] = 0;
                                res.json(resdata);

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
                                                    flightManageModel.update({flight: flight, date:dateStr},{state: 0}, function (error) {
                                                        if (error)
                                                            console.log(error);
                                                        else {
                                                            console.log("update flight " + flight + "'s state to 0");
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
                                                            var candidateID = [];
                                                            var total = LOTTERY_POOL[auctionid];
                                                            var MAX = Math.pow(2,31);
                                                            var MIN = Math.pow(2,30);
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
                                                                lotteryResultModel.find({auctionID: auctionid, paymentState:true})
                                                                    .sort({timeStamp: 1})
                                                                    .exec(function (err, docs) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                        }
                                                                        else if(docs.length !== 0){
                                                                            var region,passengerID,lotterynum;
                                                                            do {
                                                                                var cell = docs[docs.length - 1].id;
                                                                                if (!candidateID.includes(cell)) {
                                                                                    candidateID.push(docs[docs.length - 1].id);
                                                                                    region = getParticipateRegion(docs[docs.length - 1].luckyRegion);
                                                                                    passengerID = docs[docs.length - 1].id;
                                                                                    lotterynum = docs[docs.length - 1].lotterynum;
                                                                                    //console.log(passengerID + ": " + region);
                                                                                    var tag = 0;
                                                                                    if (getLuckyPerson(region, LUCKYNUM) && tag === 0) {
                                                                                        LUCKYID = passengerID;
                                                                                        console.log("find the lucky one: " + LUCKYID);
                                                                                        flightInfoModel.findOne({id: LUCKYID, flight: flight, date: date}, function (err, arr) {
                                                                                            if(err){
                                                                                                console.log("Error: " + err);
                                                                                            }
                                                                                            else {
                                                                                                lotteryRecordModel.create({
                                                                                                    auctionID: auctionid,
                                                                                                    flight: flight,
                                                                                                    id: LUCKYID,
                                                                                                    name: arr.name,
                                                                                                    tel: arr.tel,
                                                                                                    seat: arr.seat,
                                                                                                    lotterynum: lotterynum,
                                                                                                    luckyRegion: region,
                                                                                                    luckynum: LUCKYNUM,
                                                                                                    total: total
                                                                                                }, function (err) {
                                                                                                    if(err){
                                                                                                        console.log("Error: " + err);
                                                                                                    }
                                                                                                    else {
                                                                                                        console.log("lottery record saved");
                                                                                                        tag = 1;
                                                                                                    }
                                                                                                })
                                                                                            }
                                                                                        });
                                                                                        // sending the winner
                                                                                        userTokenModel.findOne({id: LUCKYID}, function (err, lists) {
                                                                                            if (err) {
                                                                                                console.log("Error: " + err);
                                                                                            }
                                                                                            else {
                                                                                                Xinge_Option.device_token = lists.deviceToken;
                                                                                                Xinge_Option.message.title = "Flight updating service message";
                                                                                                Xinge_Option.message.content = "尊敬的乘客" + lists.name + "您好，您所竞拍的" + flight + "号航班，以" + LUCKYNUM + "的幸运数字，成功获得商务舱位，请您通过app进行支付。";
                                                                                                xinge.send(Xinge_Option, function (err, result) {
                                                                                                    if (err) {
                                                                                                        console.log('ERROR: ' + err);
                                                                                                    }
                                                                                                    console.log(result);
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                    else {
                                                                                        userTokenModel.findOne({id: passengerID}, function (err, lists) {
                                                                                            if (err) {
                                                                                                console.log("Error: " + err);
                                                                                            }
                                                                                            else {
                                                                                                Xinge_Option.device_token = lists.deviceToken;
                                                                                                Xinge_Option.message.title = "Flight updating service message";
                                                                                                Xinge_Option.message.content = "尊敬的乘客" + lists.name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
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
                                                                                docs.pop();
                                                                            } while (docs.length !== 0);
                                                                        }
                                                                });
                                                            }
                                                            else {
                                                                // TODO no one got hit
                                                                do {
                                                                    var cell = docs[docs.length - 1].id;
                                                                    if (!candidateID.includes(cell)) {
                                                                        candidateID.push(docs[docs.length - 1].id);
                                                                    }
                                                                    docs.pop();
                                                                } while (docs.length !== 0);

                                                                lotteryRecordModel.create({
                                                                    auctionID: auctionid,
                                                                    flight: flight,
                                                                    id: "",
                                                                    name: "",
                                                                    tel: "",
                                                                    seat: "",
                                                                    lotterynum: "",
                                                                    luckyRegion: "",
                                                                    luckynum: LUCKYNUM
                                                                }, function (err, arr) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                    }
                                                                    else {
                                                                        console.log("No winner");
                                                                        console.log("lottery record saved");
                                                                    }
                                                                });

                                                                candidateID.forEach(function (doc) {
                                                                    userTokenModel.findOne({id: doc}, function (err, lists) {
                                                                        if (err) {
                                                                            console.log("Error: " + err);
                                                                        }
                                                                        else {
                                                                            Xinge_Option.device_token = lists.deviceToken;
                                                                            Xinge_Option.message.title = "Flight updating service message";
                                                                            Xinge_Option.message.content = "尊敬的乘客" + lists.name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                            xinge.send(Xinge_Option, function (err, result) {
                                                                                if (err) {
                                                                                    console.log('ERROR: ' + err);
                                                                                }
                                                                                console.log(result);
                                                                            });
                                                                        }
                                                                    });
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
                                res.end();
                            }
                        });
                    }
                    else {
                        res.json(resdata);
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
