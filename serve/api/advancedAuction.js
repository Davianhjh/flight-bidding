/**
 * Created by hujinhua on 17-7-20.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var Alidayu = require('./Alidayu');
var Text_Config = {
    AccessKeyId: '23300111',   //needed to be changed
    AccessSecret: '3403636b338e1003999dd946111111'   //needed to be changed
};

var alidayu = new Alidayu(Text_Config);
var Text_options = {
    SignName: '身份验证',
    TemplateParam: {
        name: '',
        flight: ''
    },
    PhoneNumbers: '',
    TemplateCode: 'SMS_4725038',  // needed to be changed
    OutId: '83db305a-70e9-11e7-86c0-484d7ec4298c' // needed to be changed
};

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
    flight: { type:String },
    auctionID: { type:String },
    auctionType: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

var biddingResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number }
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
    seat: { type:String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

var BASEPRICE = 512;
var TIMELAP = 60 * 2;
var AUCTIONTYPE = 5;

router.get('/', function (req, res, next) {
    var token = req.headers['agi-token'];
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var daynum = req.query.day;
    var seatnum = req.query.seat;
    var candidateID = [];

    var resdata = {
        result: 1,
        auction: -1,
        timelap: TIMELAP
    };

    auctionFlightManageModel.findOneAndUpdate({auctionID:auctionid,auctionType:5}, {$set: {seatnum:seatnum, auctionState:1}}, {new:false}, function (err, lists) {
        if(err){
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
            //var timelap = lists[0].timelap;
            var startTime = Date.parse(new Date());
            var auctionData = new auctionParamModel({
                "auctionID": auctionid,
                "flight": flight,
                "attentantUUID": "BACKEND",
                "baseprice": baseprice,
                "timelap": TIMELAP,
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
                    if (typeof(auctionid) === "undefined") {
                        console.log(403 + ": auctionID invalid params error");
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify(resdata));
                        res.end();
                    }
                    else if (docs.length === 0) {
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
                                resdata.timelap = TIMELAP;
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();

                                var day_count = 0;
                                var updateState = function () {
                                    auctionParamModel.find({auctionID: auctionid,flight: flight}, function (err, doc) {
                                        if(err){
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                            clearInterval(IntervalID);
                                        }
                                        else {
                                            var seat = doc[0].seatnum;
                                            biddingResultModel.find({auctionID: auctionid})
                                                .where("biddingPrice").gte(BASEPRICE)
                                                .where("id").nin(candidateID)
                                                .sort({biddingPrice:-1})
                                                .exec(function (err, docs) {
                                                    if (err) {
                                                        console.log(err);
                                                        console.log(500 + ": Server error");
                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                        res.write(JSON.stringify(resdata));
                                                        res.end();
                                                        clearInterval(IntervalID);
                                                    }
                                                    else {
                                                        var candidate = {};
                                                        var passenger = [];
                                                        var id_Array = [];
                                                        console.log("today's above baseprice bidding is " + docs.length);
                                                        if(docs.length >= seat){
                                                            console.log("No auction seats left");
                                                            for (var i = 0; i < seat; i++) {
                                                                candidateID.push(docs[i].id);
                                                                id_Array.push(docs[i].id);
                                                            }
                                                            //console.log(candidateID);
                                                            flightInfoModel.find({id: {$in: id_Array}}, function (err, lists) {
                                                                if (err) {
                                                                    console.log(err);
                                                                    console.log(500 + ": Server error");
                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                    res.write(JSON.stringify(resdata));
                                                                    res.end();
                                                                }
                                                                else {
                                                                    for (var i = 0; i < seat; i++) {
                                                                        for (var j = 0; j < lists.length; j++) {
                                                                            if (docs[i].id === lists[j].id) {
                                                                                candidate = {
                                                                                    auctionID: auctionid,
                                                                                    flight: docs[i].flight,
                                                                                    name: lists[j].name,
                                                                                    id: lists[j].id,
                                                                                    tel: lists[j].tel,
                                                                                    seat: lists[j].seat,
                                                                                    price: docs[i].biddingPrice.toString(),
                                                                                    paid: false
                                                                                };
                                                                                passenger.push(candidate);
                                                                                break;
                                                                            }
                                                                        }
                                                                    }
                                                                    // texting APIs (passenger)
                                                                    //
                                                                    lists.forEach(function (doc, index) {
                                                                        Text_options.PhoneNumbers = index.tel;
                                                                        Text_options.TemplateParam.flight = index.flight;
                                                                        Text_options.TemplateParam.name = index.name;
                                                                        alidayu.sms(options,function(err,result){
                                                                            if(err){
                                                                                console.log('ERROR'+err);
                                                                            }
                                                                            console.log(result);
                                                                        });
                                                                    });
                                                                    //
                                                                    console.log("finish texting all winners");

                                                                    advancedAuctionResultModel.collection.insert(passenger, function (err, array) {
                                                                        if(err){
                                                                            console.log(err);
                                                                            console.log(500 + ": Server error");
                                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                                            res.write(JSON.stringify(resdata));
                                                                            res.end();
                                                                        }
                                                                        else {
                                                                            console.log("advanced auction bidding result saved");
                                                                            //console.log(array);
                                                                            auctionParamModel.update({auctionID: auctionid}, {auctionState: 2}, function (err) {
                                                                                if (err)
                                                                                    console.log(err);
                                                                                else {
                                                                                    auctionFlightManageModel.update({auctionID: auctionid}, {auctionState:2}, function (error) {
                                                                                        if(error)
                                                                                            console.log(error);
                                                                                        else {
                                                                                            console.log('update auctionState to 2');
                                                                                            clearInterval(IntervalID);
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
                                                            var now_seat = seat - docs.length;
                                                            day_count += 1;
                                                            for (var j = 0; j < docs.length; j++) {
                                                                candidateID.push(docs[j].id);
                                                                id_Array.push(docs[j].id);
                                                            }
                                                            //console.log(candidateID);
                                                            if(day_count >= daynum) {
                                                                console.log("no auction days left");
                                                                flightInfoModel.find({id: {$in: id_Array}}, function (err, lists) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        for (var i = 0; i < docs.length; i++) {
                                                                            for (var j = 0; j < lists.length; j++) {
                                                                                if (docs[i].id === lists[j].id) {
                                                                                    candidate = {
                                                                                        auctionID: auctionid,
                                                                                        flight: docs[i].flight,
                                                                                        name: lists[j].name,
                                                                                        id: lists[j].id,
                                                                                        tel: lists[j].tel,
                                                                                        seat: lists[j].seat,
                                                                                        price: docs[i].biddingPrice.toString(),
                                                                                        paid: false
                                                                                    };
                                                                                    passenger.push(candidate);
                                                                                    break;
                                                                                }
                                                                            }
                                                                        }
                                                                        // texting APIs (passenger)
                                                                        //
                                                                        lists.forEach(function (doc, index) {
                                                                            Text_options.PhoneNumbers = index.tel;
                                                                            Text_options.TemplateParam.flight = index.flight;
                                                                            Text_options.TemplateParam.name = index.name;
                                                                            alidayu.sms(options,function(err,result){
                                                                                if(err){
                                                                                    console.log('ERROR'+err);
                                                                                }
                                                                                console.log(result);
                                                                            });
                                                                        });
                                                                        //
                                                                        console.log("finish texting all winners");

                                                                        advancedAuctionResultModel.collection.insert(passenger, function (err, array) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                console.log(500 + ": Server error");
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                console.log("advanced auction bidding result saved");
                                                                                //console.log(array);
                                                                                auctionParamModel.update({auctionID: auctionid}, {auctionState: 2}, function (err) {
                                                                                    if (err)
                                                                                        console.log(err);
                                                                                    else {
                                                                                        auctionFlightManageModel.update({auctionID: auctionid}, {auctionState:2}, function (error) {
                                                                                            if(error)
                                                                                                console.log(error);
                                                                                            else {
                                                                                                console.log('update auctionState to 2');
                                                                                                clearInterval(IntervalID);
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
                                                                console.log("auction is still proceeding");
                                                                flightInfoModel.find({id: {$in: id_Array}}, function (err, lists) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        for (var i = 0; i < docs.length; i++) {
                                                                            for (var j = 0; j < lists.length; j++) {
                                                                                if (docs[i].id === lists[j].id) {
                                                                                    candidate = {
                                                                                        auctionID: auctionid,
                                                                                        flight: docs[i].flight,
                                                                                        name: lists[j].name,
                                                                                        id: lists[j].id,
                                                                                        tel: lists[j].tel,
                                                                                        seat: lists[j].seat,
                                                                                        price: docs[i].biddingPrice.toString(),
                                                                                        paid: false
                                                                                    };
                                                                                    passenger.push(candidate);
                                                                                    break;
                                                                                }
                                                                            }
                                                                        }
                                                                        // texting APIs (passenger)
                                                                        //
                                                                        lists.forEach(function (doc, index) {
                                                                            Text_options.PhoneNumbers = index.tel;
                                                                            Text_options.TemplateParam.flight = index.flight;
                                                                            Text_options.TemplateParam.name = index.name;
                                                                            alidayu.sms(options,function(err,result){
                                                                                if(err){
                                                                                    console.log('ERROR'+err);
                                                                                }
                                                                                console.log(result);
                                                                            });
                                                                        });
                                                                        //
                                                                        console.log("finish texting " + passenger.length + " winners on Day " + day_count);

                                                                        advancedAuctionResultModel.collection.insert(passenger, function (err, array) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                console.log(500 + ": Server error");
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                console.log("advanced auction bidding result saved");
                                                                                //console.log(array);
                                                                                var startTime = Date.parse(new Date());
                                                                                return auctionParamModel.update({auctionID: auctionid}, {startTime:startTime, seatnum: now_seat}, function (err) {
                                                                                    if (err)
                                                                                        console.log(err);
                                                                                    else {
                                                                                        console.log("update seatnum to " + now_seat + " on Day " + day_count);
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    }
                                                });
                                        }
                                    });
                                };
                                var IntervalID = setInterval(updateState, TIMELAP * 1000);
                            }
                        });
                    }
                    else {
                        console.log(403 + ': repeated auction id save failure');
                        res.writeHead(200, {'Content-Type': 'application/json'});
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
    path: '/advancedAuction'
};
