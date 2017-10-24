/**
 * Created by hujinhua on 17-7-20.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var Wangyiyun = require('./Wangyiyun');
var Wangyi_Config = {
    AppKey: "888e5c9cee83a47f5365744a12ec1c83",
    AppSecret: "9ad8ea5e3441"
};

var wangyi = new Wangyiyun(Wangyi_Config);

var Xinge = require('./Xinge');
var Xinge_Config = {
    access_id: 2100263276,
    secretKey: "ecc4c3ab199f1e5cca148e087d2ba0fd"
};

var xinge = new Xinge(Xinge_Config);
/*
var Alidayu = require('./Alidayu');
var Text_Config = {
    AccessKeyId: '23300111',   //needed to be changed
    AccessSecret: '3403636b338e1003999dd946111111'   //needed to be changed
};

var alidayu = new Alidayu(Text_Config);
var Alidayu_options = {
    SignName: 'flight auction wins',
    TemplateParam: {
        name: '',
        flight: '',
        price: ''
    },
    PhoneNumbers: '',
    TemplateCode: 'SMS_4725038',  // needed to be changed
    OutId: '83db305a-70e9-11e7-86c0-484d7ec4298c' // needed to be changed
};
*/

var flightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    state: { type:Number }
},{collection:"flightManage"});
var flightManageModel = db.model("flightMange", flightManageSchema,"flightManage");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight : { type:String },
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
    flight: { type:String },
    date: { type:String },
    auctionID: { type:String },
    auctionType: { type:Number },
    stageType: { type:Number},
    baseprice: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number },
    timeLap: { type: Number }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

var biddingResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number },
    biddingTime: { type:Number }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var advancedAuctionResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    name: { type:String },
    id: { type:String },
    tel: { type:String },
    seat: { type:String },
    price: { type:String },
    paid: { type:Boolean }
},{collection:"advancedAuctionResult"});
var advancedAuctionResultModel = db.model("advancedAuctionResult", advancedAuctionResultSchema, "advancedAuctionResult");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    name: { type:String },
    tel: { type:String },
    flight: { type:String },
    seat: { type:String },
    date: { type:String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var userStateSchema = new mongoose.Schema({
    userID: { type:String },
    flight: { type:String },
    date: { type:String },
    auctionID: { type:String },
    userstatus: { type:Number },
    timeStamp: { type:Number }
},{collection:"userState"});
var userStateModel = db.model("userState", userStateSchema, "userState");

var adminTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var adminTokenModel = db.model("adminToken", adminTokenSchema,"adminToken");

var userTokenSchema = new mongoose.Schema({
    id: {type: String},
    name: {type:String},
    tel: {type: String},
    deviceToken: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

var AUCTIONTYPE = 5;

router.post('/', function (req, res, next) {
    var token = req.headers['agi-token'];
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var daynum = req.body.day;
    var seatnum = req.body.seat;

    var resdata = {
        result: 1,
        auction: -1
    };
    var Wangyiyun_Options = {
        templateid: "3061769",
        mobiles: "",
        name: "",
        flight: "",
        price: ""
    };

    adminTokenModel.findOne({Token: token}, function (err, docs) {
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
                jwt.verify(token, 'secret', function (error1) {
                    if (error1) {
                        console.log(error1);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.json(resdata);
                        res.end();
                    }
                    else {
                        auctionFlightManageModel.findOneAndUpdate({auctionID:auctionid,auctionType:AUCTIONTYPE}, {$set: {seatnum:seatnum, auctionState:1}}, {new:false}, function (err, lists) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else if (typeof(auctionid) === "undefined" || lists === null) {
                                console.log(403 + ": auctionID invalid params error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                var baseprice = lists.baseprice;
                                var date = lists.date;
                                var startTime = Date.parse(new Date());
                                var timeLap = lists.timeLap;
                                auctionParamModel.create({
                                    auctionID: auctionid,
                                    flight: flight,
                                    attendantUUID: "BACKEND",
                                    baseprice: baseprice,
                                    timelap: timeLap,
                                    seatnum: seatnum,
                                    startTime: startTime,
                                    auctionType: AUCTIONTYPE,
                                    auctionState: 1,
                                    count: 0}, function (err) {
                                    if (err) {
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        console.log('auctionParam save success');
                                        resdata.auction = 1;
                                        resdata.timelap = timeLap;
                                        res.json(resdata);
                                        res.end();

                                        var Xinge_Option = {
                                            device_token: "",
                                            message_type: 1,
                                            message: {
                                                content:'',
                                                title:''
                                            },
                                            action: {
                                                action_type: 1,
                                                activity: "com.agiview.flightupdating.client.ResultActivity"
                                            },
                                            path: "/v2/push/single_device"
                                            // TO be added
                                        };
                                        var day_count = 0;
                                        var updateState = function () {
                                            auctionParamModel.findOne({auctionID: auctionid,flight: flight}, function (err, doc) {
                                                if(err){
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                    clearInterval(IntervalID);
                                                }
                                                else {
                                                    var seat = doc.seatnum;
                                                    var candidateID = [];
                                                    var candidate = [];

                                                    biddingResultModel.find({auctionID: auctionid})
                                                        .where("biddingTime").gte(doc.startTime)
                                                        .where("biddingTime").lt(doc.startTime + timeLap*1000)
                                                        .sort({biddingPrice:1})
                                                        .exec(function (err, arr) {
                                                            if (err) {
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                                clearInterval(IntervalID);
                                                            }
                                                            else if(arr.length === 0) {
                                                                console.log(404 + ": no passenger take part in the bidding");
                                                                day_count += 1;
                                                                startTime = Date.parse(new Date());
                                                                return auctionParamModel.update({auctionID: auctionid}, {
                                                                    startTime: startTime,
                                                                    seatnum: seat
                                                                }, function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        clearInterval(IntervalID);
                                                                    }
                                                                    else {
                                                                        console.log("update seatnum to " + seat + " on Day " + day_count);
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                var tag = 0;
                                                                do {
                                                                    var cell = arr[arr.length - 1].id;
                                                                    if (!candidateID.includes(cell)) {
                                                                        candidateID.push(arr[arr.length - 1].id);
                                                                        candidate.push(arr[arr.length - 1]);
                                                                        if (arr[arr.length - 1].biddingPrice >= baseprice)
                                                                            tag++;
                                                                    }
                                                                    arr.pop();
                                                                } while (arr.length !== 0);

                                                                console.log("today's total number of bidding is " + candidateID.length);
                                                                console.log(candidateID);
                                                                console.log("today's above baseprice bidding is " + tag);

                                                                if(tag >= seat){                              // the number of candidates is above the number of seats
                                                                    console.log("No auction seats left");
                                                                    candidate.forEach(function (item, index) {
                                                                        if(index < seat) {                    // filter the winner (all the seats on bidding are sold)
                                                                            flightInfoModel.findOne({
                                                                                id: item.id,
                                                                                flight: flight,
                                                                                date: date
                                                                            }, function (err, lists) {
                                                                                if (err) {
                                                                                    console.log(err);
                                                                                    console.log(500 + ": Server error");
                                                                                    clearInterval(IntervalID);
                                                                                }
                                                                                else {
                                                                                    var now_time = Date.parse(new Date());
                                                                                    userStateModel.create({
                                                                                        userID: item.id,
                                                                                        flight: flight,
                                                                                        date: date,
                                                                                        auctionID: auctionid,
                                                                                        userstatus: 2,
                                                                                        timeStamp: now_time
                                                                                    }, function (err) {
                                                                                        if(err){
                                                                                            console.log(err);
                                                                                            console.log(500 + ": Server error");
                                                                                            clearInterval(IntervalID);
                                                                                        }
                                                                                        else {
                                                                                            console.log("userstatus updated succeeded");
                                                                                        }
                                                                                    });
                                                                                    advancedAuctionResultModel.create({
                                                                                        auctionID: auctionid,
                                                                                        flight: flight,
                                                                                        name: lists.name,
                                                                                        id: item.id,
                                                                                        tel: lists.tel,
                                                                                        seat: lists.seat,
                                                                                        price: item.biddingPrice.toString(),
                                                                                        paid: false
                                                                                    }, function (err) {
                                                                                        if(err) {
                                                                                            console.log(err);
                                                                                            console.log(500 + ": Server error");
                                                                                            clearInterval(IntervalID);
                                                                                        }
                                                                                        else {
                                                                                            console.log("advanced auction bidding result saved");
                                                                                        }
                                                                                    });
                                                                                    // sending & texting winners
                                                                                    Wangyiyun_Options.mobiles = lists.tel;
                                                                                    Wangyiyun_Options.flight = flight;
                                                                                    Wangyiyun_Options.name = lists.name;
                                                                                    Wangyiyun_Options.price = item.price;
                                                                                    wangyi.text(Wangyiyun_Options,function(err,result){
                                                                                        if(err){
                                                                                            console.log('ERROR'+err);
                                                                                        }
                                                                                        console.log(result);
                                                                                    });
                                                                                    userTokenModel.findOne({id:item.id}, function (err, cells) {
                                                                                        if(err){
                                                                                            console.log("Error: " + err);
                                                                                        }
                                                                                        else {
                                                                                            Xinge_Option.device_token = cells.deviceToken;
                                                                                            Xinge_Option.message.title = "Flight updating service message";
                                                                                            Xinge_Option.message.content = "尊敬的乘客" + lists.name + "您好，您所竞拍的" + flight + "号航班，以" + item.biddingPrice + "的价格，成功竞得商务舱位，请您通过app进行支付。";
                                                                                            xinge.send(Xinge_Option, function (err, result) {
                                                                                                if(err){
                                                                                                    console.log('ERROR: '+err);
                                                                                                }
                                                                                                console.log(result);
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                        }
                                                                        else {                                       // the loser left
                                                                            now_time = Date.parse(new Date());
                                                                            userStateModel.create({
                                                                                userID: item.id,
                                                                                flight: flight,
                                                                                date: date,
                                                                                auctionID: auctionid,
                                                                                userstatus: 1,
                                                                                timeStamp: now_time
                                                                            }, function (err) {
                                                                                if(err) {
                                                                                    console.log(err);
                                                                                    console.log(500 + ": Server error");
                                                                                    clearInterval(IntervalID);
                                                                                }
                                                                                else {
                                                                                    console.log("advanced auction bidding result saved");
                                                                                }
                                                                            });
                                                                            // sending losers
                                                                            userTokenModel.findOne({id:item.id}, function (err, cells) {
                                                                                if(err){
                                                                                    console.log("Error: " + err);
                                                                                }
                                                                                else {
                                                                                    Xinge_Option.device_token = cells.deviceToken;
                                                                                    Xinge_Option.message.title = "Flight updating service message";
                                                                                    Xinge_Option.message.content = "尊敬的乘客" + lists.name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                    xinge.send(Xinge_Option, function (err, result) {
                                                                                        if(err){
                                                                                            console.log('ERROR: '+err);
                                                                                        }
                                                                                        console.log(result);
                                                                                    });
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                    console.log("finish sending today's all candidates");
                                                                    // change auctionState and close the auction
                                                                    auctionParamModel.update({auctionID: auctionid}, {auctionState: 2}, function (err) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                            console.log(500 + ": Server error");
                                                                            clearInterval(IntervalID);
                                                                        }
                                                                        else {
                                                                            auctionFlightManageModel.update({auctionID: auctionid}, {auctionState:2}, function (error) {
                                                                                if(error) {
                                                                                    console.log(error);
                                                                                    console.log(500 + ": Server error");
                                                                                    clearInterval(IntervalID);
                                                                                }
                                                                                else {
                                                                                    console.log('update auctionState to 2');
                                                                                    flightManageModel.update({flight:flight, date:date}, {state:0}, function (error) {
                                                                                        if(error) {
                                                                                            console.log(error);
                                                                                            console.log(500 + ": Server error");
                                                                                            clearInterval(IntervalID);
                                                                                        }
                                                                                        else {
                                                                                            console.log("update flight " + flight + "'s state to 0");
                                                                                            candidateID = [];
                                                                                            candidate = [];
                                                                                            clearInterval(IntervalID);
                                                                                        }
                                                                                    });
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                                else {                                              //  the number of seats is above the number of candidates
                                                                    var now_seat = seat - tag;                      //  after this period, the number of seats left
                                                                    var now_time;
                                                                    day_count += 1;
                                                                    if(day_count >= daynum){                        //  judge whether is the last period (IS the last period)
                                                                        console.log("no auction days left");
                                                                        candidate.forEach(function (item, index) {
                                                                            if (index < tag) {                     //  filter the winner (all the candidates above basePrice tag maybe 0)
                                                                                flightInfoModel.findOne({
                                                                                    id: item.id,
                                                                                    flight: flight,
                                                                                    date: date
                                                                                }, function (err, lists) {
                                                                                    if (err) {
                                                                                        console.log(err);
                                                                                        console.log(500 + ": Server error");
                                                                                        clearInterval(IntervalID);
                                                                                    }
                                                                                    else {
                                                                                        now_time = Date.parse(new Date());
                                                                                        userStateModel.create({
                                                                                            userID: item.id,
                                                                                            flight: flight,
                                                                                            date: date,
                                                                                            auctionID: auctionid,
                                                                                            userstatus: 2,
                                                                                            timeStamp: now_time
                                                                                        }, function (err) {
                                                                                            if(err) {
                                                                                                console.log(err);
                                                                                                console.log(500 + ": Server error");
                                                                                                clearInterval(IntervalID);
                                                                                            }
                                                                                            else {
                                                                                                console.log("advanced auction bidding result saved");
                                                                                            }
                                                                                        });
                                                                                        advancedAuctionResultModel.create({
                                                                                            auctionID: auctionid,
                                                                                            flight: flight,
                                                                                            name: lists.name,
                                                                                            id: item.id,
                                                                                            tel: lists.tel,
                                                                                            seat: lists.seat,
                                                                                            price: item.biddingPrice.toString(),
                                                                                            paid: false
                                                                                        }, function (err) {
                                                                                            if(err) {
                                                                                                console.log(err);
                                                                                                console.log(500 + ": Server error");
                                                                                                clearInterval(IntervalID);
                                                                                            }
                                                                                            else {
                                                                                                console.log("advanced auction bidding result saved");
                                                                                            }
                                                                                        });
                                                                                        // Sending & testing winners
                                                                                        Wangyiyun_Options.mobiles = lists.tel;
                                                                                        Wangyiyun_Options.flight = flight;
                                                                                        Wangyiyun_Options.name = lists.name;
                                                                                        Wangyiyun_Options.price = item.price;
                                                                                        wangyi.text(Wangyiyun_Options,function(err,result){
                                                                                            if(err){
                                                                                                console.log('ERROR'+err);
                                                                                            }
                                                                                            console.log(result);
                                                                                        });
                                                                                        userTokenModel.findOne({id:item.id}, function (err, cells) {
                                                                                            if(err){
                                                                                                console.log("Error: " + err);
                                                                                            }
                                                                                            else {
                                                                                                Xinge_Option.device_token = cells.deviceToken;
                                                                                                Xinge_Option.message.title = "Flight updating service message";
                                                                                                Xinge_Option.message.content = "尊敬的乘客" + cells.name + "您好，您所竞拍的" + flight + "号航班，以" + item.price + "的价格，成功竞得商务舱位，请您通过app进行支付。";
                                                                                                xinge.send(Xinge_Option, function (err, result) {
                                                                                                    if(err){
                                                                                                        console.log('ERROR: '+err);
                                                                                                    }
                                                                                                    console.log(result);
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                            else {                                  //  the loser left
                                                                                now_time = Date.parse(new Date());
                                                                                userStateModel.create({
                                                                                    userID: item.id,
                                                                                    flight: flight,
                                                                                    date: date,
                                                                                    auctionID: auctionid,
                                                                                    userstatus: 1,
                                                                                    timeStamp: now_time
                                                                                }, function (err) {
                                                                                    if(err) {
                                                                                        console.log(err);
                                                                                        console.log(500 + ": Server error");
                                                                                        clearInterval(IntervalID);
                                                                                    }
                                                                                    else {
                                                                                        console.log("advanced auction bidding result saved");
                                                                                    }
                                                                                });
                                                                                // sending losers
                                                                                userTokenModel.findOne({id:item.id}, function (err, cells) {
                                                                                    if(err){
                                                                                        console.log("Error: " + err);
                                                                                    }
                                                                                    else {
                                                                                        Xinge_Option.device_token = cells.deviceToken;
                                                                                        Xinge_Option.message.title = "Flight updating service message";
                                                                                        Xinge_Option.message.content = "尊敬的乘客" + cells.name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                        xinge.send(Xinge_Option, function (err, result) {
                                                                                            if(err){
                                                                                                console.log('ERROR: '+err);
                                                                                            }
                                                                                            console.log(result);
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                        console.log("finish sending today's all candidates");
                                                                        // change auctionState and close the auction
                                                                        auctionParamModel.update({auctionID: auctionid}, {auctionState: 2}, function (err) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                console.log(500 + ": Server error");
                                                                                clearInterval(IntervalID);
                                                                            }
                                                                            else {
                                                                                auctionFlightManageModel.update({auctionID: auctionid}, {auctionState:2}, function (error) {
                                                                                    if(error) {
                                                                                        console.log(error);
                                                                                        console.log(500 + ": Server error");
                                                                                        clearInterval(IntervalID);
                                                                                    }
                                                                                    else {
                                                                                        console.log('update auctionState to 2');
                                                                                        flightManageModel.update({flight:flight, date:date}, {state:0}, function (error) {
                                                                                            if(error) {
                                                                                                console.log(error);
                                                                                                console.log(500 + ": Server error");
                                                                                                clearInterval(IntervalID);
                                                                                            }
                                                                                            else {
                                                                                                console.log("update flight " + flight + "'s state to 0");
                                                                                                candidateID = [];
                                                                                                candidate = [];
                                                                                                clearInterval(IntervalID);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                    else {
                                                                        console.log("auction is still proceeding"); //  NOT the last period (auction is still going on)
                                                                        candidate.forEach(function (item, index) {
                                                                            if(index < tag) {                       //  filter the winner (all the candidates above basePrice tag maybe 0)
                                                                                flightInfoModel.findOne({
                                                                                    id: item.id,
                                                                                    flight: flight,
                                                                                    date: date
                                                                                }, function (err, lists) {
                                                                                    if (err) {
                                                                                        console.log(err);
                                                                                        console.log(500 + ": Server error");
                                                                                        clearInterval(IntervalID);
                                                                                    }
                                                                                    else {
                                                                                        now_time = Date.parse(new Date());
                                                                                        userStateModel.create({
                                                                                            userID: item.id,
                                                                                            flight: flight,
                                                                                            date: date,
                                                                                            auctionID: auctionid,
                                                                                            userstatus: 2,
                                                                                            timeStamp: now_time
                                                                                        },function (err) {
                                                                                            if(err) {
                                                                                                console.log(err);
                                                                                                console.log(500 + ": Server error");
                                                                                                clearInterval(IntervalID);
                                                                                            }
                                                                                            else {
                                                                                                console.log("advanced auction bidding result saved");
                                                                                            }
                                                                                        });
                                                                                        advancedAuctionResultModel.create({
                                                                                            auctionID: auctionid,
                                                                                            flight: flight,
                                                                                            name: lists.name,
                                                                                            id: item.id,
                                                                                            tel: lists.tel,
                                                                                            seat: lists.seat,
                                                                                            price: item.biddingPrice.toString(),
                                                                                            paid: false
                                                                                        }, function (err) {
                                                                                            if(err) {
                                                                                                console.log(err);
                                                                                                console.log(500 + ": Server error");
                                                                                                clearInterval(IntervalID);
                                                                                            }
                                                                                            else {
                                                                                                console.log("advanced auction bidding result saved");
                                                                                            }
                                                                                        });
                                                                                        // sending & texting winners
                                                                                        Wangyiyun_Options.mobiles = lists.tel;
                                                                                        Wangyiyun_Options.flight = flight;
                                                                                        Wangyiyun_Options.name = lists.name;
                                                                                        Wangyiyun_Options.price = item.price;
                                                                                        wangyi.text(Wangyiyun_Options,function(err,result){
                                                                                            if(err){
                                                                                                console.log('ERROR'+err);
                                                                                            }
                                                                                            console.log(result);
                                                                                        });
                                                                                        userTokenModel.findOne({id:item.id}, function (err, cells) {
                                                                                            if(err){
                                                                                                console.log("Error: " + err);
                                                                                            }
                                                                                            else {
                                                                                                Xinge_Option.device_token = cells.deviceToken;
                                                                                                Xinge_Option.message.title = "Flight updating service message";
                                                                                                Xinge_Option.message.content = "尊敬的乘客" + cells.name + "您好，您所竞拍的" + flight + "号航班，以" + item.biddingPrice + "的价格，成功竞得商务舱位，请您通过app进行支付。";
                                                                                                xinge.send(Xinge_Option, function (err, result) {
                                                                                                    if(err){
                                                                                                        console.log('ERROR: '+err);
                                                                                                    }
                                                                                                    console.log(result);
                                                                                                });
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                            else {                                  //  the loser left
                                                                                now_time = Date.parse(new Date());
                                                                                userStateModel.create({
                                                                                    userID: item.id,
                                                                                    flight: flight,
                                                                                    date: date,
                                                                                    auctionID: auctionid,
                                                                                    userstatus: 0,
                                                                                    timeStamp: now_time
                                                                                }, function (err) {
                                                                                    if(err) {
                                                                                        console.log(err);
                                                                                        console.log(500 + ": Server error");
                                                                                        clearInterval(IntervalID);
                                                                                    }
                                                                                    else {
                                                                                        console.log("advanced auction bidding result saved");
                                                                                    }
                                                                                });
                                                                                // sending losers
                                                                                userTokenModel.findOne({id:item.id}, function (err, cells) {
                                                                                    if(err){
                                                                                        console.log("Error: " + err);
                                                                                    }
                                                                                    else {
                                                                                        Xinge_Option.device_token = cells.deviceToken;
                                                                                        Xinge_Option.message.title = "Flight updating service message";
                                                                                        Xinge_Option.message.content = "尊敬的乘客" + cells.name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                        xinge.send(Xinge_Option, function (err, result) {
                                                                                            if(err){
                                                                                                console.log('ERROR: '+err);
                                                                                            }
                                                                                            console.log(result);
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                        console.log("finish sending today's all candidates");
                                                                        //  updating the auctionParams and open another round
                                                                        startTime = Date.parse(new Date());
                                                                        return auctionParamModel.update({auctionID: auctionid}, {
                                                                            startTime: startTime,
                                                                            seatnum: now_seat
                                                                        }, function (err) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                clearInterval(IntervalID);
                                                                            }
                                                                            else {
                                                                                console.log("update seatnum to " + now_seat + " on Day " + day_count);
                                                                                candidateID = [];
                                                                                candidate = [];
                                                                            }
                                                                        });
                                                                    }
                                                                }
                                                            }
                                                        });
                                                }
                                            });
                                        };
                                        var IntervalID = setInterval(updateState, timeLap * 1000);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/advancedAuction'
};