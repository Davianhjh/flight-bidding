/**
 * Created by hujinhua on 17-7-7.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionState: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    auctionID: { type: String },
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

var Auction_Count = {};

router.get('/',function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        max: 1000,
        delta: 0,
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
                                    if (!Auction_Count[auctionid])
                                        Auction_Count[auctionid] = 0;
                                    resdata.delta = 0;
                                    resdata.heat = Auction_Count[auctionid];
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    if (!Auction_Count[auctionid])
                                        Auction_Count[auctionid] = 0;
                                    if (docs[1].heatState === 1) {
                                        resdata.delta = docs[1].biddingPrice - docs[0].biddingPrice;
                                        resdata.heat = Auction_Count[auctionid];
                                    }
                                    else if (docs[0].heatState === 1) {
                                        resdata.delta = docs[0].biddingPrice - docs[1].biddingPrice;
                                        resdata.heat = Auction_Count[auctionid];
                                    }
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
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

                        flightInfoModel.find({id: passengerID}, function (err, docs) {
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
                                            else if (docs[0].auctionState === -1 || docs[0].auctionState === 0 || docs[0].auctionState === 2) {
                                                console.log(403 + ": error auctionState " + docs[0].auctionState);
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
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
                                                            Auction_Count[auctionid] = parseInt(Math.random() * 5 + 1) + Auction_Count[auctionid];
                                                            if (Auction_Count[auctionid] >= 100)
                                                                Auction_Count[auctionid] = 100;
                                                            var heatData = new heatBiddingModel({
                                                                auctionID: auctionid,
                                                                flight: flight,
                                                                id: passengerID,
                                                                biddingPrice: price,
                                                                heatState: 1,
                                                                heat: Auction_Count[auctionid]
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
                                                                                        console.log('heat: ' + Auction_Count[auctionid]);
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
                                                                            heat: Auction_Count[auctionid]
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
                                                                                        console.log('heat: ' + Auction_Count[auctionid]);
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