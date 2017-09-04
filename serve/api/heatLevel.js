/**
 * Created by hujinhua on 17-7-7.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
var async = require('async');
console.time('series');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var chartDataSchema = new mongoose.Schema({
    auctionID: { type:String },
    probability: { type: Array },
    price: { type: Array }
},{collection:"chartData"});
var chartDataModel = db.model("chartData", chartDataSchema,"chartData");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionState: { type:Number },
    seatnum: { type:Number },
    startTime: { type:Number },
    timelap: { type:Number },
    baseprice: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    flight: { type: String },
    seat: { type:String },
    userstatus: { type: Number }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var biddingResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number },
    seat: { type:String },
    paymentState: { type:Boolean }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var heatBiddingSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number },
    heatState: { type:Number },
    heat: { type:Number }
},{collection:"heatBidding"});
var heatBiddingModel = db.model("heatBidding", heatBiddingSchema,"heatBidding");

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

var RANK_WEIGHT = 60;
var PRICE_WEIGHT = 25;
var TIME_WEIGHT = 15;

router.get('/',function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];
    var heat = 0;

    var resdata = {
        result: 1,
        max: 1000,
        delta: 0,
        initial: 0,
        heat: 0
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
                        heatBiddingModel.find({id: passengerID, auctionID: auctionid}, function (err, docs) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if (docs.length === 0) {
                                    console.log(403 + ": Haven't bidden for a price yet");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else if (docs.length === 1) {
                                    resdata.delta = 0;
                                    resdata.initial = docs[0].biddingPrice;
                                    auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                        if (err) {
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                        }
                                        else {
                                            if (docs.length === 0) {
                                                console.log(404 + ": auctionID not exist");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else if (docs[0].auctionState === -1 || docs[0].auctionState === 0) {
                                                console.log(403 + ": error auctionState " + docs[0].auctionState);
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                var seatnum = docs[0].seatnum;
                                                var baseprice = docs[0].baseprice;
                                                var price = resdata.initial + resdata.delta;
                                                var now_heat = 0;
                                                var prob1 = 0;
                                                var prob2 = 0;
                                                var prob3 = 0;
                                                biddingResultModel.find({auctionID: auctionid})
                                                    .sort({biddingPrice: -1})
                                                    .exec(function (err, docs) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                        }
                                                        else if(price >= baseprice){
                                                            for (var i = 0, result = 0; i < docs.length; i++) {
                                                                if (docs[i].id === passengerID) {
                                                                    result = i + 1;
                                                                }
                                                            }
                                                            if (result <= seatnum && result !== 0) {
                                                                prob1 = (100 - 10 * (result-1)/seatnum) * RANK_WEIGHT / 100;
                                                            }
                                                            else {
                                                                var tmp = (50 - 5 * Math.pow((result - seatnum), 2));
                                                                if (tmp < 10) {
                                                                    prob1 = (Math.random() * 10) * RANK_WEIGHT / 100;
                                                                }
                                                                else {
                                                                    prob1 = tmp * RANK_WEIGHT / 100;
                                                                }
                                                            }
                                                            chartDataModel.find({auctionID: auctionid}, function (err, docs) {
                                                                if (err) {
                                                                    console.log(err);
                                                                    console.log(500 + ": Server error");
                                                                }
                                                                else {
                                                                    var base = docs[0].price[8];
                                                                    if(price > base){
                                                                        prob2 = (90 + 10*(price-base)/base)*PRICE_WEIGHT/100;
                                                                    }
                                                                    else {
                                                                        var tmp = 40*(price/base)*PRICE_WEIGHT/100;
                                                                        if(tmp <= 10){
                                                                            prob2 = (Math.random()*10)*PRICE_WEIGHT/100;
                                                                        }
                                                                        else {
                                                                            prob2 = tmp*PRICE_WEIGHT/100;
                                                                        }
                                                                    }
                                                                    auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                            console.log(500 + ": Server error");
                                                                        }
                                                                        else {
                                                                            var timeLap = docs[0].timelap;
                                                                            var startTime = docs[0].startTime;
                                                                            var nowTime = Date.parse(new Date());
                                                                            if ((nowTime - startTime) < timeLap * 1000 / 3) {
                                                                                prob3 = TIME_WEIGHT / 3;
                                                                            }
                                                                            else if ((nowTime - startTime) < 2 * timeLap * 1000 / 3 && (nowTime - startTime) > timeLap * 1000 / 3) {
                                                                                prob3 = 2 * TIME_WEIGHT / 3;
                                                                            }
                                                                            else {
                                                                                prob3 = TIME_WEIGHT;
                                                                            }
                                                                            now_heat = prob1 + prob2 + prob3;
                                                                            if (now_heat <= 10) {
                                                                                heat = Math.floor(Math.random() * 5 + 5);
                                                                            }
                                                                            else if (now_heat >= 100) {
                                                                                heat = Math.floor(Math.random() * 2 + 98)
                                                                            }
                                                                            else {
                                                                                heat = Math.floor(now_heat);
                                                                            }
                                                                            if (heat <= 10) {
                                                                                resdata.heat = Math.floor(Math.random() * 5 + 5);
                                                                            }
                                                                            else {
                                                                                resdata.heat = Math.floor(heat);
                                                                            }
                                                                            resdata.heat = heat;
                                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                                            res.write(JSON.stringify(resdata));
                                                                            res.end();
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            resdata.heat = Math.floor(Math.random()*15 + 5);
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                    });
                                            }
                                        }
                                    });
                                }
                                else if (docs[1].heatState === 1) {
                                        resdata.delta = docs[1].biddingPrice - docs[0].biddingPrice;
                                        resdata.initial = docs[0].biddingPrice;
                                        auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                            if (err) {
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                if (docs.length === 0) {
                                                    console.log(404 + ": auctionID not exist");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else if (docs[0].auctionState === -1 || docs[0].auctionState === 0) {
                                                    console.log(403 + ": error auctionState " + docs[0].auctionState);
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    var seatnum = docs[0].seatnum;
                                                    var baseprice = docs[0].baseprice;
                                                    var price = resdata.initial + resdata.delta;
                                                    var now_heat = 0;
                                                    var prob1 = 0;
                                                    var prob2 = 0;
                                                    var prob3 = 0;
                                                    biddingResultModel.find({auctionID: auctionid})
                                                        .sort({biddingPrice: -1})
                                                        .exec(function (err, docs) {
                                                            if (err) {
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                            }
                                                            else if(price >= baseprice){
                                                                for (var i = 0, result = 0; i < docs.length; i++) {
                                                                    if (docs[i].id === passengerID) {
                                                                        result = i + 1;
                                                                    }
                                                                }
                                                                if (result <= seatnum && result !== 0) {
                                                                    prob1 = (100 - 10 * (result-1)/seatnum) * RANK_WEIGHT / 100;
                                                                }
                                                                else {
                                                                    var tmp = (50 - 5 * Math.pow((result - seatnum), 2));
                                                                    if (tmp < 10) {
                                                                        prob1 = (Math.random() * 10) * RANK_WEIGHT / 100;
                                                                    }
                                                                    else {
                                                                        prob1 = tmp * RANK_WEIGHT / 100;
                                                                    }
                                                                }
                                                                chartDataModel.find({auctionID: auctionid}, function (err, docs) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                    }
                                                                    else {
                                                                        var base = docs[0].price[8];
                                                                        if(price > base){
                                                                            prob2 = (90 + 10*(price-base)/base)*PRICE_WEIGHT/100;
                                                                        }
                                                                        else {
                                                                            var tmp = 40*(price/base)*PRICE_WEIGHT/100;
                                                                            if(tmp <= 10){
                                                                                prob2 = (Math.random()*10)*PRICE_WEIGHT/100;
                                                                            }
                                                                            else {
                                                                                prob2 = tmp*PRICE_WEIGHT/100;
                                                                            }
                                                                        }
                                                                        auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                console.log(500 + ": Server error");
                                                                            }
                                                                            else {
                                                                                var timeLap = docs[0].timelap;
                                                                                var startTime = docs[0].startTime;
                                                                                var nowTime = Date.parse(new Date());
                                                                                if ((nowTime - startTime) < timeLap * 1000 / 3) {
                                                                                    prob3 = TIME_WEIGHT / 3;
                                                                                }
                                                                                else if ((nowTime - startTime) < 2 * timeLap * 1000 / 3 && (nowTime - startTime) > timeLap * 1000 / 3) {
                                                                                    prob3 = 2 * TIME_WEIGHT / 3;
                                                                                }
                                                                                else {
                                                                                    prob3 = TIME_WEIGHT;
                                                                                }
                                                                                now_heat = prob1 + prob2 + prob3;
                                                                                if (now_heat <= 10) {
                                                                                    heat = Math.floor(Math.random() * 5 + 5);
                                                                                }
                                                                                else if (now_heat >= 100) {
                                                                                    heat = Math.floor(Math.random() * 2 + 98)
                                                                                }
                                                                                else {
                                                                                    heat = Math.floor(now_heat);
                                                                                }
                                                                                if (heat <= 10) {
                                                                                    resdata.heat = Math.floor(Math.random() * 5 + 5);
                                                                                }
                                                                                else {
                                                                                    resdata.heat = Math.floor(heat);
                                                                                }
                                                                                resdata.heat = heat;
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                resdata.heat = Math.floor(Math.random()*15 + 5);
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                        });
                                                }
                                            }
                                        });
                                    }
                                else if (docs[0].heatState === 1) {
                                    resdata.delta = docs[0].biddingPrice - docs[1].biddingPrice;
                                    resdata.initial = docs[1].biddingPrice;
                                    auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                        if (err) {
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                        }
                                        else {
                                            if (docs.length === 0) {
                                                console.log(404 + ": auctionID not exist");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else if (docs[0].auctionState === -1 || docs[0].auctionState === 0) {
                                                console.log(403 + ": error auctionState " + docs[0].auctionState);
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                var seatnum = docs[0].seatnum;
                                                var baseprice = docs[0].baseprice;
                                                var price = resdata.initial + resdata.delta;
                                                var now_heat = 0;
                                                var prob1 = 0;
                                                var prob2 = 0;
                                                var prob3 = 0;
                                                biddingResultModel.find({auctionID: auctionid})
                                                    .sort({biddingPrice: -1})
                                                    .exec(function (err, docs) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                        }
                                                        else if(price >= baseprice){
                                                            for (var i = 0, result = 0; i < docs.length; i++) {
                                                                if (docs[i].id === passengerID) {
                                                                    result = i + 1;
                                                                }
                                                            }
                                                            if (result <= seatnum && result !== 0) {
                                                                prob1 = (100 - 10 * (result-1)/seatnum) * RANK_WEIGHT / 100;
                                                            }
                                                            else {
                                                                var tmp = (50 - 5 * Math.pow((result - seatnum), 2));
                                                                if (tmp < 10) {
                                                                    prob1 = (Math.random() * 10) * RANK_WEIGHT / 100;
                                                                }
                                                                else {
                                                                    prob1 = tmp * RANK_WEIGHT / 100;
                                                                }
                                                            }
                                                            chartDataModel.find({auctionID: auctionid}, function (err, docs) {
                                                                if (err) {
                                                                    console.log(err);
                                                                    console.log(500 + ": Server error");
                                                                }
                                                                else {
                                                                    var base = docs[0].price[8];
                                                                    if(price > base){
                                                                        prob2 = (90 + 10*(price-base)/base)*PRICE_WEIGHT/100;
                                                                    }
                                                                    else {
                                                                        var tmp = 40*(price/base)*PRICE_WEIGHT/100;
                                                                        if(tmp <= 10){
                                                                            prob2 = (Math.random()*10)*PRICE_WEIGHT/100;
                                                                        }
                                                                        else {
                                                                            prob2 = tmp*PRICE_WEIGHT/100;
                                                                        }
                                                                    }
                                                                    auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                                                        if (err) {
                                                                            console.log(err);
                                                                            console.log(500 + ": Server error");
                                                                        }
                                                                        else {
                                                                            var timeLap = docs[0].timelap;
                                                                            var startTime = docs[0].startTime;
                                                                            var nowTime = Date.parse(new Date());
                                                                            if ((nowTime - startTime) < timeLap * 1000 / 3) {
                                                                                prob3 = TIME_WEIGHT / 3;
                                                                            }
                                                                            else if ((nowTime - startTime) < 2 * timeLap * 1000 / 3 && (nowTime - startTime) > timeLap * 1000 / 3) {
                                                                                prob3 = 2 * TIME_WEIGHT / 3;
                                                                            }
                                                                            else {
                                                                                prob3 = TIME_WEIGHT;
                                                                            }
                                                                            now_heat = prob1 + prob2 + prob3;
                                                                            if (now_heat <= 10) {
                                                                                heat = Math.floor(Math.random() * 5 + 5);
                                                                            }
                                                                            else if (now_heat >= 100) {
                                                                                heat = Math.floor(Math.random() * 2 + 98)
                                                                            }
                                                                            else {
                                                                                heat = Math.floor(now_heat);
                                                                            }
                                                                            if (heat <= 10) {
                                                                                resdata.heat = Math.floor(Math.random() * 5 + 5);
                                                                            }
                                                                            else {
                                                                                resdata.heat = Math.floor(heat);
                                                                            }
                                                                            resdata.heat = heat;
                                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                                            res.write(JSON.stringify(resdata));
                                                                            res.end();
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            resdata.heat = Math.floor(Math.random()*15 + 5);
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                    });
                                            }
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

                        flightInfoModel.find({id: passengerID, flight:flight}, function (err, docs) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if (docs.length === 0) {
                                    console.log(404 + ": Passenger not found on flight" + flight);
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                        if (err) {
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                        }
                                        else {
                                            if (docs.length === 0) {
                                                console.log(404 + ": auctionID not exist");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else if (docs[0].auctionState === -1 || docs[0].auctionState === 0) {
                                                console.log(403 + ": error auctionState " + docs[0].auctionState);
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                var seatnum = docs[0].seatnum;
                                                var baseprice = docs[0].baseprice;
                                                heatBiddingModel.find({
                                                    auctionID: auctionid,
                                                    id: passengerID,
                                                    heatState: 0
                                                }, function (err, docs) {
                                                    if (err) {
                                                        console.log(err);
                                                        console.log(500 + ": Server error");
                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                        res.write(JSON.stringify(resdata));
                                                        res.end();
                                                    }
                                                    else {
                                                        var price = 0;
                                                        if (docs.length === 0) {
                                                            console.log(403 + ": Haven't bidden for a price yet");
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                        else {
                                                            price = docs[0].biddingPrice + delta;
                                                            var now_heat = 0;
                                                            var prob1 = 0;
                                                            var prob2 = 0;
                                                            var prob3 = 0;
                                                            biddingResultModel.find({auctionID: auctionid})
                                                                .sort({biddingPrice: -1})
                                                                .exec(function (err, docs) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                    }
                                                                    else if(price >= baseprice){
                                                                        var result = 0;
                                                                        for (var i = 0; i < docs.length; i++) {
                                                                            if (docs[i].id === passengerID) {
                                                                                result = i + 1;
                                                                            }
                                                                        }
                                                                        if (result <= seatnum && result !== 0) {
                                                                            prob1 = (100 - 10 * (result-1)/seatnum) * RANK_WEIGHT / 100;
                                                                        }
                                                                        else {
                                                                            var tmp = (50 - 5 * Math.pow((result - seatnum), 2));
                                                                            if (tmp < 10) {
                                                                                prob1 = (Math.random() * 10) * RANK_WEIGHT / 100;
                                                                            }
                                                                            else {
                                                                                prob1 = tmp * RANK_WEIGHT / 100;
                                                                            }
                                                                        }
                                                                        chartDataModel.find({auctionID:auctionid}, function (err, docs) {
                                                                            if(err){
                                                                                console.log(err);
                                                                                console.log(500 + ": Server error");
                                                                            }
                                                                            else {
                                                                                var base = docs[0].price[8];
                                                                                if(price > base){
                                                                                    prob2 = (90 + 10*(price-base)/base)*PRICE_WEIGHT/100;
                                                                                }
                                                                                else {
                                                                                    var tmp = 40*(price/base)*PRICE_WEIGHT/100;
                                                                                    if(tmp <= 10){
                                                                                        prob2 = (Math.random()*10)*PRICE_WEIGHT/100;
                                                                                    }
                                                                                    else {
                                                                                        prob2 = tmp*PRICE_WEIGHT/100;
                                                                                    }
                                                                                }
                                                                                auctionParamModel.find({auctionID:auctionid}, function (err, docs) {
                                                                                    if(err){
                                                                                        console.log(err);
                                                                                        console.log(500 + ": Server error");
                                                                                    }
                                                                                    else {
                                                                                        var timeLap = docs[0].timelap;
                                                                                        var startTime = docs[0].startTime;
                                                                                        var nowTime = Date.parse(new Date());
                                                                                        if((nowTime-startTime) < timeLap*1000/3){
                                                                                            prob3 = TIME_WEIGHT/3;
                                                                                        }
                                                                                        else if((nowTime-startTime) < (2*timeLap*1000/3) && (nowTime-startTime) > timeLap*1000/3){
                                                                                            prob3 = 2*TIME_WEIGHT/3;
                                                                                        }
                                                                                        else {
                                                                                            prob3 = TIME_WEIGHT;
                                                                                        }
                                                                                        now_heat = prob1 + prob2 + prob3;
                                                                                        if(now_heat <= 10){
                                                                                            heat = Math.floor(Math.random()*5 + 5);
                                                                                        }
                                                                                        else if(now_heat >= 100){
                                                                                            heat = Math.floor(Math.random()*5 + 95)
                                                                                        }
                                                                                        else {
                                                                                            heat = Math.floor(now_heat);
                                                                                        }
                                                                                        var heatData = new heatBiddingModel({
                                                                                            auctionID: auctionid,
                                                                                            flight: flight,
                                                                                            id: passengerID,
                                                                                            biddingPrice: price,
                                                                                            heatState: 1,
                                                                                            heat: heat
                                                                                        });
                                                                                        heatBiddingModel.find({
                                                                                            auctionID: auctionid,
                                                                                            id: passengerID,
                                                                                            heatState: 1
                                                                                        }, function (err, docs) {
                                                                                            if (err) {
                                                                                                console.log(err);
                                                                                                console.log(500 + ": Server error");
                                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                res.write(JSON.stringify(resdata));
                                                                                                res.end();
                                                                                            }
                                                                                            else {
                                                                                                if (docs.length === 0) {
                                                                                                    heatData.save(function (err) {
                                                                                                        if (err) {
                                                                                                            console.log(err);
                                                                                                            console.log(500 + ": Server error");
                                                                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                            res.write(JSON.stringify(resdata));
                                                                                                            res.end();
                                                                                                        }
                                                                                                        else {
                                                                                                            biddingResultModel.update({
                                                                                                                auctionID: auctionid,
                                                                                                                id: passengerID
                                                                                                            }, {biddingPrice: price}, function (err) {
                                                                                                                if (err) {
                                                                                                                    console.log(err);
                                                                                                                    console.log(500 + ": Server error");
                                                                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                                    res.write(JSON.stringify(resdata));
                                                                                                                    res.end();
                                                                                                                }
                                                                                                                else {
                                                                                                                    resdata.status = 1;
                                                                                                                    console.log('bidding success');
                                                                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                                    res.write(JSON.stringify(resdata));
                                                                                                                    res.end();
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                                else {
                                                                                                    heatBiddingModel.update({
                                                                                                        auctionID: auctionid,
                                                                                                        id: passengerID,
                                                                                                        heatState: 1
                                                                                                    }, {
                                                                                                        biddingPrice: price,
                                                                                                        heat: heat
                                                                                                    }, function (err) {
                                                                                                        if (err) {
                                                                                                            console.log(err);
                                                                                                            console.log(500 + ": Server error");
                                                                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                            res.write(JSON.stringify(resdata));
                                                                                                            res.end();
                                                                                                        }
                                                                                                        else {
                                                                                                            biddingResultModel.update({
                                                                                                                auctionID: auctionid,
                                                                                                                id: passengerID
                                                                                                            }, {biddingPrice: price}, function (err) {
                                                                                                                if (err) {
                                                                                                                    console.log(err);
                                                                                                                    console.log(500 + ": Server error");
                                                                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                                    res.write(JSON.stringify(resdata));
                                                                                                                    res.end();
                                                                                                                }
                                                                                                                else {
                                                                                                                    resdata.status = 1;
                                                                                                                    console.log('bidding success');
                                                                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                                    res.write(JSON.stringify(resdata));
                                                                                                                    res.end();
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                    else {
                                                                        heat = Math.floor(Math.random()*15 + 5);
                                                                        var heatData = new heatBiddingModel({
                                                                            auctionID: auctionid,
                                                                            flight: flight,
                                                                            id: passengerID,
                                                                            biddingPrice: price,
                                                                            heatState: 1,
                                                                            heat: heat
                                                                        });
                                                                        heatBiddingModel.find({
                                                                            auctionID: auctionid,
                                                                            id: passengerID,
                                                                            heatState: 1
                                                                        }, function (err, docs) {
                                                                            if (err) {
                                                                                console.log(err);
                                                                                console.log(500 + ": Server error");
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                if (docs.length === 0) {
                                                                                    heatData.save(function (err) {
                                                                                        if (err) {
                                                                                            console.log(err);
                                                                                            console.log(500 + ": Server error");
                                                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                            res.write(JSON.stringify(resdata));
                                                                                            res.end();
                                                                                        }
                                                                                        else {
                                                                                            biddingResultModel.update({
                                                                                                auctionID: auctionid,
                                                                                                id: passengerID
                                                                                            }, {biddingPrice: price}, function (err) {
                                                                                                if (err) {
                                                                                                    console.log(err);
                                                                                                    console.log(500 + ": Server error");
                                                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                    res.write(JSON.stringify(resdata));
                                                                                                    res.end();
                                                                                                }
                                                                                                else {
                                                                                                    resdata.status = 1;
                                                                                                    console.log('bidding success');
                                                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                    res.write(JSON.stringify(resdata));
                                                                                                    res.end();
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    heatBiddingModel.update({
                                                                                        auctionID: auctionid,
                                                                                        id: passengerID,
                                                                                        heatState: 1
                                                                                    }, {
                                                                                        biddingPrice: price,
                                                                                        heat: heat
                                                                                    }, function (err) {
                                                                                        if (err) {
                                                                                            console.log(err);
                                                                                            console.log(500 + ": Server error");
                                                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                            res.write(JSON.stringify(resdata));
                                                                                            res.end();
                                                                                        }
                                                                                        else {
                                                                                            biddingResultModel.update({
                                                                                                auctionID: auctionid,
                                                                                                id: passengerID
                                                                                            }, {biddingPrice: price}, function (err) {
                                                                                                if (err) {
                                                                                                    console.log(err);
                                                                                                    console.log(500 + ": Server error");
                                                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                    res.write(JSON.stringify(resdata));
                                                                                                    res.end();
                                                                                                }
                                                                                                else {
                                                                                                    resdata.status = 1;
                                                                                                    console.log('bidding success');
                                                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                    res.write(JSON.stringify(resdata));
                                                                                                    res.end();
                                                                                                }
                                                                                            });
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
                                            }
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