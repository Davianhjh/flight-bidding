/**
 * Created by hujinhua on 17-8-15.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var POOL = require('./startLottery');

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

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionState: { type:Number },
    auctionType: { type:Number },
    seatnum: { type:Number },
    timelap: { type:Number },
    startTime: { type:Number },
    count: { type:Number }
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
var bodyParser = require('body-parser');
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

function regionFormat(arr){
    var res = [];
    for(var i=0;i<arr.length;i++){
        var length = arr[i].length;
        var start = arr[i][0];
        var end = arr[i][length-1];
        res[i] = [start, end];
    }
    return res;
}

router.post('/',function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var price = req.body.price;
    var token = req.headers['agi-token'];
    var resdata = {
        result: 1,
        bid: -1,
        price: -1
    };

    if(typeof(price) === "undefined" || price <= 0){
        console.log("Error: price params error");
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resdata));
        res.end();
        return;
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
                                    var resultData = new lotteryResultModel({
                                        auctionID: auctionid,
                                        id: passengerID,
                                        flight: flight,
                                        seat: docs[0].seat,
                                        biddingPrice: price,
                                        lotterynum: 0,
                                        timeStamp: Date.parse(new Date()),
                                        paymentState: false,
                                        luckyRegion: [],
                                        hit: false
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
                                                lotteryResultModel.find({auctionID:auctionid,id:passengerID}, function (err, docs) {
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
                                                                    console.log('saving success');
                                                                    resdata.bid = 1;
                                                                    resdata.price = price;
                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                    res.write(JSON.stringify(resdata));
                                                                    res.end();
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            lotteryResultModel.update({auctionID:auctionid, id:passengerID}, {biddingPrice:price, timeStamp:Date.parse(new Date()), paymentState:false}, function (err) {
                                                                if(err){
                                                                    console.log(err);
                                                                    console.log(500 + ": Server error");
                                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                                    res.write(JSON.stringify(resdata));
                                                                    res.end();
                                                                }
                                                                else {
                                                                    console.log('updating success');
                                                                    resdata.bid = 1;
                                                                    resdata.price = price;
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
                                    })
                                }
                            }
                        });
                    }
                });
            }
        }
    })
});

router.get('/', function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];
    var resdata = {
        result: 1,
        lotterynum: 0,
        luckyRegion: [],
        total: 0,
        paid: true
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
                        auctionParamModel.find({auctionID:auctionid, flight:flight}, function (err, docs) {
                            if(err){
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if(docs.length === 0){
                                    console.log(404 + ": lottery auction not found");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    if(docs[0].auctionState === 1){
                                        resdata.total = POOL.lotteryPool[auctionid];
                                    }
                                    else {
                                        resdata.total = docs[0].count;
                                    }
                                    lotteryResultModel.find({auctionID:auctionid, flight:flight, id:passengerID}, function (err, docs) {
                                        if (err) {
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                        }
                                        else {
                                            if(docs.length === 0){
                                                console.log(404 + ': passenger not found in lotteryResult');
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                resdata.lotterynum = docs[0].lotterynum;
                                                resdata.luckyRegion = regionFormat(docs[0].luckyRegion);
                                                resdata.paid = docs[0].paymentState;
                                                console.log(resdata);
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
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
    path: '/lotteryPrice'
};