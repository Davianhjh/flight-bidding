/**
 * Created by hujinhua on 2017/6/14.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
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

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    id: { type:String },
    flight: { type:String },
    seat: { type:String },
    biddingPrice: { type:Number },
    biddingTime: { type:Number },
    paymentState: { type:Boolean },
    paymentPrice: { type:Number }
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

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionState: { type:Number },
    auctionType: { type:Number },
    seatnum: { type:Number },
    timelap: { type:Number },
    startTime: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    date: { type:String },
    flight: { type:String },
    seat: { type:String },
    userstatus: { type: Number }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var userTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var jwt = require('jsonwebtoken');

var router = require('express').Router();

var RANK_WEIGHT = 60;
var PRICE_WEIGHT = 25;
var TIME_WEIGHT = 15;

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

    if(typeof(price) === "undefined"){
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resdata));
        res.end();
    }

    userTokenModel.find({Token:token}, function (err, docs) {
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
                    if(error1) {
                        console.log(error1);
                        console.log(403+ ": Token is not valid");
                        resdata.result = -1;
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify(resdata));
                        res.end();
                    }
                    else {
                        passengerID = decoded.id;

                        flightInfoModel.find({id: passengerID, flight: flight}, function (err, docs) {
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
                                    var resultData = new biddingResultModel({
                                        auctionID: auctionid,
                                        id: passengerID,
                                        flight: flight,
                                        seat: docs[0].seat,
                                        biddingPrice: price,
                                        biddingTime: Date.parse(new Date()),
                                        paymentState: false,
                                        paymentPrice: 0
                                    });
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
                                            else if (docs[0].auctionState === -1 || docs[0].auctionState === 0 || docs[0].auctionState === 2) {
                                                console.log(403 + ": error auctionState " + docs[0].auctionState);
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                var seatnum = docs[0].seatnum;
                                                var timeLap = docs[0].timelap;
                                                var startTime = docs[0].startTime;
                                                if (docs[0].auctionType === 1 || docs[0].auctionType === 2 || docs[0].auctionType === 4) {
                                                    biddingResultModel.find({
                                                        auctionID: auctionid,
                                                        id: passengerID
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
                                                                resultData.save(function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        console.log('bidding success');
                                                                        flightInfoModel.update({
                                                                            id: passengerID,
                                                                            flight: flight,
                                                                            date: date
                                                                        }, {userstatus: 1}, function (err) {
                                                                            if (err) {
                                                                                console.log(500 + ": Server error");
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                resdata.bid = 1;
                                                                                resdata.price = price;
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                console.log('repeating bidding');
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                        }
                                                    });
                                                }
                                                else if (docs[0].auctionType === 3) {
                                                    biddingResultModel.find({
                                                        auctionID: auctionid,
                                                        id: passengerID
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
                                                                resultData.save(function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        flightInfoModel.update({
                                                                            id: passengerID,
                                                                            flight: flight,
                                                                            date: date
                                                                        }, {userstatus: 1}, function (err) {
                                                                            if (err) {
                                                                                console.log(500 + ": Server error");
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                var heat = 0;
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
                                                                                        else {
                                                                                            for (var i = 0, result = 0; i < docs.length; i++) {
                                                                                                if (docs[i].id === passengerID) {
                                                                                                    result = i + 1;
                                                                                                }
                                                                                            }
                                                                                            if (result <= seatnum && result !== 0) {
                                                                                                prob1 = (100 - 10 * (result - 1) / seatnum) * RANK_WEIGHT / 100;
                                                                                            }
                                                                                            else {
                                                                                                var tmp = (90 - 5 * Math.pow((result - seatnum), 2));
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
                                                                                                    if (price > base) {
                                                                                                        prob2 = (90 + 10 * (price - base) / base) * PRICE_WEIGHT / 100;
                                                                                                    }
                                                                                                    else {
                                                                                                        var tmp = 90 * (price / base) * PRICE_WEIGHT / 100;
                                                                                                        if (tmp <= 10) {
                                                                                                            prob2 = (Math.random() * 10) * PRICE_WEIGHT / 100;
                                                                                                        }
                                                                                                        else {
                                                                                                            prob2 = tmp * PRICE_WEIGHT / 100;
                                                                                                        }
                                                                                                    }
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
                                                                                                    console.log("HEAT: " + heat);
                                                                                                    var heatData = new heatBiddingModel({
                                                                                                        auctionID: auctionid,
                                                                                                        flight: flight,
                                                                                                        id: passengerID,
                                                                                                        biddingPrice: price,
                                                                                                        heatState: 0,
                                                                                                        heat: heat
                                                                                                    });
                                                                                                    heatBiddingModel.find({
                                                                                                        auctionID: auctionid,
                                                                                                        id: passengerID
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
                                                                                                                        console.log("bidding success");
                                                                                                                        resdata.bid = 1;
                                                                                                                        resdata.price = price;
                                                                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                                        res.write(JSON.stringify(resdata));
                                                                                                                        res.end();
                                                                                                                    }
                                                                                                                })
                                                                                                            }
                                                                                                            else {
                                                                                                                console.log('repeating bidding in heatBidding');
                                                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                                res.write(JSON.stringify(resdata));
                                                                                                                res.end();
                                                                                                            }
                                                                                                        }
                                                                                                    });
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
                                                                console.log('repeating bidding in biddingResult');
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                        }
                                                    });
                                                }
                                                else if(docs[0].auctionType === 5){
                                                    biddingResultModel.find({
                                                        auctionID: auctionid,
                                                        id: passengerID
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
                                                                resultData.save(function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        console.log('bidding success');
                                                                        flightInfoModel.update({
                                                                            id: passengerID,
                                                                            flight: flight,
                                                                            date: date
                                                                        }, {userstatus: 1}, function (err) {
                                                                            if (err) {
                                                                                console.log(500 + ": Server error");
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                resdata.bid = 1;
                                                                                resdata.price = price;
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                biddingResultModel.update({
                                                                    auctionID: auctionid,
                                                                    id: passengerID
                                                                }, {biddingPrice: price, biddingTime:Date.parse(new Date())}, function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        resdata.bid = 1;
                                                                        resdata.price = price;
                                                                        console.log('bidding success');
                                                                        flightInfoModel.update({
                                                                            id: passengerID,
                                                                            flight: flight,
                                                                            date: date
                                                                        }, {userstatus: 1}, function (err) {
                                                                            if (err) {
                                                                                console.log(500 + ": Server error");
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                resdata.bid = 1;
                                                                                resdata.price = price;
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
    path: '/biddingPrice'
};