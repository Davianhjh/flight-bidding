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
    //seat: { type:String },
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

function zeroFill (i) {
    return (i < 10 ? '0' : '') + i
}

var objectArraySort = function (keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName];
        var valueM = objectM[keyName];
        if (valueN < valueM) return 1;
        else if (valueN > valueM) return -1;
        else return 0
    }
};

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

    var nowDate = new Date();
    var date = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());

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
        else if (docs === null) {
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
                                lotteryResultModel.create({
                                    auctionID: auctionid,
                                    id: passengerID,
                                    flight: flight,
                                    biddingPrice: price,
                                    lotterynum: 0,
                                    timeStamp: Date.parse(new Date()),
                                    paymentState: false,
                                    luckyRegion: [],
                                    hit: false
                                },function (err) {
                                    if (err) {
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        console.log('saving success');
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
                        }
                    });
                }
            });
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

    userTokenModel.findOne({Token: token}, function (err, docs) {
        if (err) {
            console.log(err);
            console.log(500 + ": Server error");
            resdata.result = -1;
            res.json(resdata);
            res.end();
        }
        else if (docs === null) {
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
                    auctionParamModel.findOne({auctionID:auctionid, flight:flight}, function (err, docs) {
                        if(err){
                            console.log(500 + ": Server error");
                            res.json(resdata);
                            res.end();
                        }
                        else if(docs === null){
                                console.log(404 + ": lottery auction not found");
                                res.json(resdata);
                                res.end();
                        }
                        else {
                            if(docs.auctionState === 1){
                                resdata.total = POOL.lotteryPool[auctionid];
                            }
                            else {
                                resdata.total = docs.count;
                            }
                            lotteryResultModel.find({auctionID:auctionid, flight:flight, id:passengerID})
                                .exec(function (err, docs) {
                                    if (err) {
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        if(docs.length === 0){
                                            console.log(404 + ': passenger not found in lotteryResult');
                                            res.json(resdata);
                                            res.end();
                                        }
                                        else {
                                            docs.sort(objectArraySort('timeStamp'));
                                            resdata.paid = docs[0].paymentState;
                                            if(docs[0].paymentState === false && docs.length !== 1){
                                                lotteryResultModel.find({auctionID:auctionid, flight:flight, id:passengerID, paymentState:true})
                                                    .exec(function (err, docs) {
                                                        if (err) {
                                                            console.log(500 + ": Server error");
                                                            res.json(resdata);
                                                            res.end();
                                                        }
                                                        else {
                                                            docs.sort(objectArraySort('timeStamp'));
                                                            resdata.lotterynum = docs[0].lotterynum;
                                                            resdata.luckyRegion = regionFormat(docs[0].luckyRegion);
                                                            res.json(resdata);
                                                            res.end();
                                                        }
                                                    });
                                            }
                                            else {
                                                resdata.lotterynum = docs[0].lotterynum;
                                                resdata.luckyRegion = regionFormat(docs[0].luckyRegion);
                                                res.json(resdata);
                                                res.end();
                                            }
                                        }
                                    }
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = {
    router: router,
    path: '/lotteryPrice'
};