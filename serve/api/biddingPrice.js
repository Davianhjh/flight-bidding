/**
 * Created by hujinhua on 2017/6/14.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var expData = require("./expChart");

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

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionState: { type:Number },
    auctionType: { type:Number },
    seatnum: { type:Number },
    timelap: { type:Number },
    startTime: { type:Number },
    baseprice: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var userStateSchema = new mongoose.Schema({
    userID: { type:String },
    flight: { type:String },
    date: { type:String },
    auctionID: { type:String },
    userstatus: { type:Number },
    timeStamp: { type:Number }
},{collection:"userState"});
var userStateModel = db.model("userState", userStateSchema, "userState");

var userTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var jwt = require('jsonwebtoken');

var router = require('express').Router();

var RANK_WEIGHT = 60;
var PRICE_WEIGHT = 31;
var TIME_WEIGHT = 9;

var objectArraySort = function (keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName];
        var valueM = objectM[keyName];
        if (valueN < valueM) return -1;
        else if (valueN > valueM) return 1;
        else return 0
    }
};

router.get('/', function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var price = req.query.price;
    var date = req.query.date;
    var token = req.headers['agi-token'];
    var resdata = {
        result: 1,
        bid: -1,
        price: -1
    };
    if(typeof(price) === "undefined" || price <= 0){
        console.log("Error: price params error");
        res.json(resdata);
        res.end();
        return;
    }

    userTokenModel.findOne({Token:token}, function (err, docs) {
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
                    if(error1) {
                        console.log(error1);
                        console.log(403+ ": Token is not valid");
                        resdata.result = -1;
                        res.json(resdata);
                        res.end();
                    }
                    else {
                        passengerID = decoded.id;
                        auctionParamModel.findOne({auctionID: auctionid}, function (err, docs) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                if (docs === null) {
                                    console.log(404 + ": auctionID not exist");
                                    res.json(resdata);
                                    res.end();
                                }
                                else if (docs.auctionState === -1 || docs.auctionState === 0 || docs.auctionState === 2) {
                                    console.log(403 + ": error auctionState " + docs.auctionState);
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    var seatnum = docs.seatnum;
                                    var baseprice = docs.baseprice;
                                    var timeLap = docs.timelap;
                                    var startTime = docs.startTime;
                                    if (docs.auctionType === 1 || docs.auctionType === 2 || docs.auctionType === 4 || docs.auctionType === 5) {
                                        biddingResultModel.create({
                                            auctionID: auctionid,
                                            id: passengerID,
                                            flight: flight,
                                            //seat: docs[0].seat,
                                            biddingPrice: price,
                                            biddingTime: Date.parse(new Date()),
                                            paymentState: false,
                                            heat: 0
                                        }, function (err) {
                                            if (err) {
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else {
                                                console.log('bidding success');
                                                var now_time = Date.parse(new Date());
                                                userStateModel.create({userID:passengerID, flight:flight, date:date, auctionID:auctionid, userstatus:1, timeStamp:now_time}, function (err) {
                                                    if (err) {
                                                        console.log(500 + ": Server error");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else {
                                                        resdata.bid = 1;
                                                        resdata.price = price;
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    else if (docs.auctionType === 3) {
                                        var heat = 0;
                                        var now_heat = 0;
                                        var prob1 = 0;
                                        var prob2 = 0;
                                        var prob3 = 0;
                                        var sortedID = [];
                                        var result = 0;
                                        biddingResultModel.find({auctionID: auctionid})
                                            .exec(function (err, docs) {
                                                if (err) {
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                }
                                                else if(price >= baseprice) {
                                                    var tag = 0;
                                                    var tmp = 0;
                                                    if(docs.length === 0)
                                                        result = 1;
                                                    else {
                                                        var arr = docs.sort(objectArraySort('biddingPrice'));
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
                                                    }
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
                                                                var now_time = Date.parse(new Date());
                                                                userStateModel.create({
                                                                    userID: passengerID,
                                                                    flight: flight,
                                                                    date: date,
                                                                    auctionID: auctionid,
                                                                    userstatus: 1,
                                                                    timeStamp: now_time
                                                                }, function (err) {
                                                                    if (err) {
                                                                        console.log(500 + ": Server error");
                                                                        res.json(resdata);
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        resdata.bid = 1;
                                                                        resdata.price = price;
                                                                        res.json(resdata);
                                                                        res.end();
                                                                    }
                                                                });
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
                                                            var now_time = Date.parse(new Date());
                                                            userStateModel.create({
                                                                userID: passengerID,
                                                                flight: flight,
                                                                date: date,
                                                                auctionID: auctionid,
                                                                userstatus: 1,
                                                                timeStamp: now_time
                                                            }, function (err) {
                                                                if (err) {
                                                                    console.log(500 + ": Server error");
                                                                    res.json(resdata);
                                                                    res.end();
                                                                }
                                                                else {
                                                                    resdata.bid = 1;
                                                                    resdata.price = price;
                                                                    res.json(resdata);
                                                                    res.end();
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
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/biddingPrice'
};