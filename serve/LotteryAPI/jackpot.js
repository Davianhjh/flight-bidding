/**
 * Created by hujinhua on 17-8-16.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

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

var lotteryRecordSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    id: { type:String },
    name: { type:String },
    tel: { type:String },
    seat: { type:String },
    lotterynum: { type:Number },
    luckyRegion: { type:Array },
    luckynum: { type:Number },
    total: { type:Number }
}, {collection:"lotteryRecord"});
var lotteryRecordModel = db.model("lotteryRecord", lotteryRecordSchema,"lotteryRecord");

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

var serverTokenSchema = new mongoose.Schema({
    Token: { type:String }
},{collection:"serverToken"});
var serverTokenModel = db.model("serverToken", serverTokenSchema,"serverToken");

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

router.post('/', function (req, res, next) {
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        timestamp: -1,
        flight: flight,
        lucky: -1,
        person: []
    };
    serverTokenModel.find({Token: token}, function (err, docs) {
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
                                    console.log(404 + ": auctionID not found in auctionParam");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    lotteryRecordModel.find({auctionID:auctionid}, function (err, docs) {
                                        if(err){
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                        }
                                        else {
                                            if(docs.length === 0){
                                                console.log("Error: lotteryRecord not found / lottery not ended yet");
                                                resdata.timestamp = Date.parse(new Date());
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                resdata.timestamp = Date.parse(new Date());
                                                resdata.lucky = (docs[0].luckynum).toString();
                                                resdata.total = (docs[0].total).toString();
                                                if(docs.id !== "") {
                                                    var data = {
                                                        name: docs[0].name,
                                                        tel: docs[0].tel,
                                                        seat: docs[0].seat,
                                                        lotterynum: docs[0].lotterynum,
                                                        luckyRegion: regionFormat(docs[0].luckyRegion)
                                                    };
                                                    resdata.person.push(data);
                                                }
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

router.get('/',function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        auctionType: 6,
        seats: 1,
        hit: 0,
        lotterynum: 0,
        luckyRegion: [],
        luckynum: 0,
        total: 0
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
                        lotteryRecordModel.find({auctionID:auctionid}, function (err, docs) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                            }
                            else {
                                if(docs.length === 0){
                                    console.log(403 + ": lotteryRecord not found / lottery not stopped yet");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    resdata.luckynum = docs[0].luckynum;
                                    resdata.total = docs[0].total;
                                    if(docs[0].id === passengerID){
                                        resdata.hit = 1;
                                    }
                                    lotteryResultModel.find({auctionID:auctionid, id:passengerID}, function (err, docs) {
                                        if(err){
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                        }
                                        else {
                                            if(docs.length === 0) {
                                                console.log(404 + ": passenger not take part in the lottery bidding");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                resdata.lotterynum = docs[0].lotterynum;
                                                resdata.luckyRegion = regionFormat(docs[0].luckyRegion);
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
    path: '/jackpot'
};
