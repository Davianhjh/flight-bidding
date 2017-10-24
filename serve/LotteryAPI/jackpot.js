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
    serverTokenModel.findOne({Token: token}, function (err, docs) {
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
                jwt.verify(token, 'secret', function (error1) {
                    if (error1) {
                        console.log(error1);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.json(resdata);
                        res.end();
                    }
                    else {
                        lotteryRecordModel.findOne({auctionID:auctionid}, function (err, docs) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                if(docs === null){
                                    console.log("Error: lotteryRecord not found / lottery not ended yet");
                                    resdata.timestamp = Date.parse(new Date());
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    resdata.timestamp = Date.parse(new Date());
                                    resdata.lucky = (docs.luckynum).toString();
                                    resdata.total = (docs.total).toString();
                                    if(docs.id !== "") {
                                        var data = {
                                            name: docs.name,
                                            tel: docs.tel,
                                            seat: docs.seat,
                                            lotterynum: docs.lotterynum,
                                            luckyRegion: regionFormat(docs.luckyRegion)
                                        };
                                        resdata.person.push(data);
                                    }
                                    res.json(resdata);
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
                    if (error1) {
                        console.log(error1);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.json(resdata);
                        res.end();
                    }
                    else {
                        passengerID = decoded.id;
                        lotteryRecordModel.findOne({auctionID:auctionid}, function (err, docs) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                if(docs === null){
                                    console.log(403 + ": lotteryRecord not found / lottery not stopped yet");
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    resdata.luckynum = docs.luckynum;
                                    resdata.total = docs.total;
                                    if(docs.id === passengerID){
                                        resdata.hit = 1;
                                    }
                                    lotteryResultModel.find({auctionID:auctionid, id:passengerID})
                                        .sort({timeStamp: -1})
                                        .exec(function (err, docs) {
                                            if(err){
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else if(docs.length === 0) {
                                                    console.log(404 + ": passenger not take part in the lottery bidding");
                                                    res.json(resdata);
                                                    res.end();
                                            }
                                            else {
                                                if(docs[0].paymentState === true) {
                                                    resdata.lotterynum = docs[0].lotterynum;
                                                    resdata.luckyRegion = regionFormat(docs[0].luckyRegion);
                                                    res.json(resdata);
                                                    res.end();
                                                }
                                                else {
                                                    resdata.lotterynum = docs[1].lotterynum;
                                                    resdata.luckyRegion = regionFormat(docs[1].luckyRegion);
                                                    res.json(resdata);
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
