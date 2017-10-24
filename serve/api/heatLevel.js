/**
 * Created by hujinhua on 17-7-7.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
var async = require('async');
db.on('error', function(error) {
    console.log(error);
});

var expData = require("./expChart");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionState: { type:Number },
    seatnum: { type:Number },
    startTime: { type:Number },
    timelap: { type:Number },
    baseprice: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    id: { type:String },
    flight: { type:String },
    biddingPrice: { type:Number },
    biddingTime: { type:Number },
    heat: { type: Number },
    paymentState: { type:Boolean }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var userTokenSchema = new mongoose.Schema({
    Token: { type:String },
    name: { type:String },
    tel: { type:String }
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");

var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

var objectArraySort = function (keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName];
        var valueM = objectM[keyName];
        if (valueN < valueM) return -1;
        else if (valueN > valueM) return 1;
        else return 0
    }
};

var RANK_WEIGHT = 60;
var PRICE_WEIGHT = 31;
var TIME_WEIGHT = 9;

router.get('/',function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        max: 1000,
        delta: 0,
        initial: 0,
        heat: 0
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
                        biddingResultModel.find({id:passengerID,auctionID:auctionid})
                            .sort({biddingTime: -1})
                            .exec(function (err, docs) {
                                if(err){
                                    console.log(err);
                                    console.log(500 + ": Server error");
                                    res.json(resdata);
                                    res.end();
                                }
                                else if(docs.length === 0){
                                    console.log(403 + ": Haven't bidden for a price yet");
                                    res.json(resdata);
                                    res.end();
                                }
                                else if(docs.length === 1) {
                                    resdata.delta = 0;
                                    resdata.initial = docs[0].biddingPrice;
                                    resdata.heat = docs[0].heat;
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    resdata.delta = docs[0].biddingPrice - docs[docs.length-1].biddingPrice;
                                    resdata.initial = docs[docs.length-1].biddingPrice;
                                    resdata.heat = docs[0].heat;
                                    res.json(resdata);
                                    res.end();
                                }
                            });
                    }
                });
            }
        }
    });
});

router.post('/',function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var delta = req.body.delta;
    var token = req.headers['agi-token'];
    var heat = 0;

    var resdata = {
        result: 1,
        status: -1
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
                        auctionParamModel.findOne({auctionID: auctionid}, function (err, arr) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                if (arr === null) {
                                    console.log(404 + ": auctionID not exist");
                                    res.json(resdata);
                                    res.end();
                                }
                                else if (arr.auctionState === -1 || arr.auctionState === 0) {
                                    console.log(403 + ": error auctionState " + arr.auctionState);
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    var seatnum = arr.seatnum;
                                    var baseprice = arr.baseprice;
                                    var startTime = arr.startTime;
                                    var timeLap = arr.timelap;
                                    biddingResultModel.find({id:passengerID,auctionID:auctionid})
                                        .exec(function (err, docs) {
                                            if(err){
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else if(docs.length !== 0){
                                                docs.sort(objectArraySort('biddingTime'));
                                                var price = docs[docs.length - 1].biddingPrice + delta;
                                                var now_heat = 0;
                                                var prob1 = 0;
                                                var prob2 = 0;
                                                var prob3 = 0;
                                                var sortedID = [];
                                                var result = 0;
                                                biddingResultModel.find({auctionID: auctionid})
                                                    .exec(function (err, lists) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                        }
                                                        else if (price >= baseprice) {
                                                            var tag = 0;
                                                            var tmp = 0;
                                                            var arr = lists.sort(objectArraySort('biddingPrice'));
                                                            do {
                                                                var cell = arr[arr.length - 1].id;
                                                                if (!sortedID.includes(cell)) {
                                                                    sortedID.push(cell);
                                                                    tag++;
                                                                    if (arr[arr.length - 1].biddingPrice < price) {
                                                                        result = tag;
                                                                        break;
                                                                    }
                                                                }
                                                                arr.pop();
                                                            } while (arr.length !== 0);
                                                            if (result <= seatnum && result !== 0) {
                                                                prob1 = (100 - 10 * (result - 1) / seatnum) * RANK_WEIGHT / 100;
                                                            }
                                                            else {
                                                                tmp = (50 - 5 * Math.pow((result - seatnum), 2));
                                                                if (tmp < 10) {
                                                                    prob1 = RANK_WEIGHT * (price / 100) / 100;
                                                                }
                                                                else {
                                                                    prob1 = tmp + RANK_WEIGHT * (price / 100) / 100;
                                                                }
                                                            }
                                                            var base = expData.previous_data[auctionid];
                                                            if (price > base) {
                                                                prob2 = (90 + 10 * (price - base) / base) * PRICE_WEIGHT / 100;
                                                            }
                                                            else {
                                                                tmp = 90 * Math.pow((base - price) / base, 2) * PRICE_WEIGHT / 100;
                                                                if (tmp <= 10) {
                                                                    prob2 = tmp + 10;
                                                                }
                                                                else {
                                                                    prob2 = (price / base) * PRICE_WEIGHT + 10;
                                                                }
                                                            }
                                                            var nowTime = Date.parse(new Date());
                                                            if ((nowTime - startTime) < timeLap * 1000 / 3) {
                                                                prob3 = TIME_WEIGHT / 3;
                                                            }
                                                            else if ((nowTime - startTime) < (2 * timeLap * 1000 / 3) && (nowTime - startTime) > timeLap * 1000 / 3) {
                                                                prob3 = 2 * TIME_WEIGHT / 3;
                                                            }
                                                            else {
                                                                prob3 = TIME_WEIGHT;
                                                            }
                                                            now_heat = prob1 + prob2 + prob3;
                                                            if (now_heat >= 100) {
                                                                heat = Math.floor(Math.random() * 3 + 97)
                                                            }
                                                            else {
                                                                heat = Math.floor(now_heat);
                                                                biddingResultModel.create({
                                                                    auctionID: auctionid,
                                                                    id: passengerID,
                                                                    flight: flight,
                                                                    biddingPrice: price,
                                                                    biddingTime: Date.parse(new Date()),
                                                                    paymentState: false,
                                                                    heat: heat
                                                                }, function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.json(resdata);
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        console.log('bidding success');
                                                                        resdata.status = 1;
                                                                        res.json(resdata);
                                                                        res.end();
                                                                    }
                                                                });
                                                            }
                                                        }
                                                        else {
                                                            heat = Math.floor(5 * (price / 100));
                                                            biddingResultModel.create({
                                                                auctionID: auctionid,
                                                                id: passengerID,
                                                                flight: flight,
                                                                biddingPrice: price,
                                                                biddingTime: Date.parse(new Date()),
                                                                paymentState: false,
                                                                heat: heat
                                                            }, function (err) {
                                                                if (err) {
                                                                    console.log(err);
                                                                    console.log(500 + ": Server error");
                                                                    res.json(resdata);
                                                                    res.end();
                                                                }
                                                                else {
                                                                    console.log('bidding success');
                                                                    resdata.status = 1;
                                                                    res.json(resdata);
                                                                    res.end();
                                                                }
                                                            });
                                                        }
                                                    });
                                            }
                                            else {
                                                console.log(403 + ": Haven't bidden for a price yet");
                                                res.json(resdata);
                                                res.end();
                                            }
                                        });
                                }
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
    path: '/heatLevel'
};