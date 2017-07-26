/**
 * Created by hujinhua on 2017/6/14.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    id: { type:String },
    flight: { type:String },
    seat: { type:String },
    biddingPrice: { type:Number },
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
    auctionType: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    auctionID: { type: String },
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

router.get('/', function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var price = req.query.price;
    var token = req.headers['agi-token'];
    var resdata = {
        result: 1,
        bid: -1,
        price: -1
    };

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
                console.log(err);
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
                                    var resultData = new biddingResultModel({
                                        auctionID: auctionid,
                                        id: passengerID,
                                        flight: flight,
                                        seat: docs[0].seat,
                                        biddingPrice: price,
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
                                                                            auctionID: auctionid
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
                                                                            auctionID: auctionid
                                                                        }, {userstatus: 1}, function (err) {
                                                                            if (err) {
                                                                                console.log(500 + ": Server error");
                                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                res.write(JSON.stringify(resdata));
                                                                                res.end();
                                                                            }
                                                                            else {
                                                                                var heatData = new heatBiddingModel({
                                                                                    auctionID: auctionid,
                                                                                    flight: flight,
                                                                                    id: passengerID,
                                                                                    biddingPrice: price,
                                                                                    heatState: 0,
                                                                                    heat: 0
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
                                                                            auctionID: auctionid
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
                                                                }, {biddingPrice: price}, function (err) {
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