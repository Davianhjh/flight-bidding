/**
 * Created by hujinhua on 2017/6/13.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var flightInfoSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    id: { type:String },
    userstatus: { type:Number },
    auctionState: { type:Number }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight : { type:String },
    baseprice: { type:Number },
    timelap: { type:Number },
    seatnum: { type:Number },
    startTime: { type:Number },
    auctionState: { type: Number },
    auctionType: { type: Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var userTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var jwt = require('jsonwebtoken');

var router = require('express').Router();

router.get('/', function (req, res, next) {
    var passengerID = "";
    var action = req.query.action;
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var date = req.query.date;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1
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

                        if (action === "status") {
                            var userstatus = -1;
                            flightInfoModel.find({id: passengerID, flight: flight, date: date}, function (error, docs) {
                                if (error) {
                                    console.log(error);
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    if (docs.length === 0) {
                                        console.log(404 + ": Passenger not existed on flight " + flight);
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        userstatus = docs[0].userstatus;
                                        auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                            if (err) {
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                resdata = {
                                                    result: 1,
                                                    userstatus: userstatus
                                                };
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                if (docs.length === 0) {
                                                    resdata = {
                                                        result: 1,
                                                        userstatus: userstatus,
                                                        auctionState: -1,
                                                        timetotal: -1,
                                                        price: -1,
                                                        type: -1
                                                    }
                                                }
                                                else {
                                                    resdata = {
                                                        result: 1,
                                                        userstatus: userstatus,
                                                        auctionState: docs[0].auctionState,
                                                        timetotal: docs[0].timelap,
                                                        price: docs[0].baseprice,
                                                        type: docs[0].auctionType
                                                    };
                                                }
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                                resdata = {
                                                    result: 1
                                                }
                                            }
                                        });

                                    }
                                }
                            });
                        }

                        else if (action === "agree") {
                            flightInfoModel.find({id: passengerID, flight: flight, date: date}, function (err, docs) {
                                if (err) {
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    if (docs.length === 0) {
                                        console.log(404 + ": Passenger not existed on flight " + flight);
                                        resdata = {
                                            result: 1,
                                            agree: -1
                                        };
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        flightInfoModel.update({
                                            id: passengerID,
                                            flight: flight,
                                            date: date
                                        }, {userstatus: 0}, function (err) {
                                            if (err) {
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                resdata = {
                                                    result: 1,
                                                    agree: 1
                                                };
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                        });
                                    }
                                }
                            });
                        }

                        else {
                            console.log(403 + ": query params error");
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.write(JSON.stringify(resdata));
                            res.end();
                        }
                    }
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/bidding'
};