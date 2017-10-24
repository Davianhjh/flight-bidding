/**
 * Created by hujinhua on 17-8-8.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    flight: { type:String },
    date: { type:String },
    seat: { type: String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

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

var auctionResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    name: { type:String },
    id: { type:String },
    tel: { type:String },
    seat: { type:String },
    price: { type:String },
    paid: { type:Boolean }
},{collection:"auctionResult"});
var auctionResultModel = db.model("auctionResult", auctionResultSchema,"auctionResult");

var advancedAuctionResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    name: { type:String },
    id: { type:String },
    tel: { type:String },
    seat: { type:String },
    price: { type:String },
    paid: { type:Boolean }
},{collection:"advancedAuctionResult"});
var advancedAuctionResultModel = db.model("advancedAuctionResult", advancedAuctionResultSchema, "advancedAuctionResult");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionType: { type:Number },
    seatnum: { type:Number },
    startTime: { type:Number },
    auctionState: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var auctionFlightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    origin: { type:String },
    O_code: { type:String },
    destination: { type:String },
    D_code: { type:String },
    departure: { type:String },
    landing: { type:String },
    auctionID: { type:String },
    auctionType: { type:Number },
    stageType: { type:Number},
    baseprice: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number },
    timeLap: { type: Number }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

var flightManageSchema = new mongoose.Schema({
    flight: { type:String },
    origin: { type:String },
    O_code: { type:String },
    destination: { type:String },
    D_code: { type:String },
    date: { type:String },
    departure: { type:String },
    landing: { type:String },
    state: { type:Number }
},{collection:"flightManage"});
var flightManageModel = db.model("flightMange", flightManageSchema,"flightManage");

var adminTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var adminTokenModel = db.model("adminToken", adminTokenSchema,"adminToken");

var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

var PAIED = "已付款";
var UNPAIED = "未付款";

function zeroFill (i) {
    return (i < 10 ? '0' : '') + i
}

function dateFormat(nowDate) {
    return nowDate.getFullYear() + "-" + zeroFill(nowDate.getMonth() + 1) + "-" + zeroFill(nowDate.getDate()) + " " + zeroFill(nowDate.getHours()) + ":" + zeroFill(nowDate.getMinutes());
}

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
    var date = req.body.date;
    var stage = req.body.stage;         // better change may avoid some bug
    var auctionType = req.body.type;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        flight: "",
        date: "",
        origin: "",
        destination: "",
        departure: "",
        landing: "",
        auctionType: -1,
        basePrice: -1,
        seat: -1,
        auctionState: -1,
        startTime: -1,
        person: []
    };
    if(parseInt(auctionType) === 6) {
        var auctionid = date + flight + "LOT6" + "S" + stage;
    }
    else {
        auctionid = date + flight + "TYPE" + auctionType + "S" + stage;
    }

    adminTokenModel.findOne({Token: token}, function (err, docs) {
        if (err) {
            console.log(err);
            console.log(500 + ": Server error");
            resdata.result = -1;
            res.json(resdata);
            res.end();
        }
        else {
            if (docs === null) {
                console.log(token);
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
                        resdata.flight = flight;
                        resdata.date = date.slice(0,4) + "-" + date.slice(4,6) + "-" + date.slice(6,8);
                        auctionFlightManageModel.findOne({auctionID:auctionid}, function (err, lists) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else if(lists === null){
                                console.log(404 + ": params error, flight's auction not found");
                                flightManageModel.findOne({flight:flight, date:date}, function (err, arr) {
                                    if(err){
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        resdata.departure = arr.departure;
                                        resdata.landing = arr.landing;
                                        resdata.origin = arr.origin;
                                        resdata.destination = arr.destination;
                                        res.json(resdata);
                                        res.end();
                                    }
                                });
                            }
                            else {
                                resdata.departure = lists.departure;
                                resdata.landing = lists.landing;
                                resdata.origin = lists.origin;
                                resdata.destination = lists.destination;
                                resdata.auctionType = lists.auctionType;
                                resdata.basePrice = lists.baseprice;
                                resdata.auctionState = lists.auctionState;
                                auctionParamModel.findOne({auctionID:auctionid}, function (err, arr) {
                                    if(err){
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else if(arr === null){
                                        console.log(404 + ": flight's auction not started yet");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        var startDate = new Date(arr.startTime);
                                        resdata.startTime = dateFormat(startDate);
                                        resdata.seat = arr.seatnum;
                                        if(resdata.auctionType === 5){
                                            advancedAuctionResultModel.find({auctionID:auctionid}, function (err, lists) {
                                                if(err){
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                    res.json(resdata);
                                                    res.end();
                                                }
                                                else {
                                                    if(lists.length === 0){
                                                        console.log("No seat sold during advanced auction");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else {
                                                        lists.forEach(function (item, index) {
                                                            flightInfoModel.findOne({id:item.id,flight:flight,date:date}, function (err, doc) {
                                                                if(err){
                                                                    console.log(err);
                                                                    console.log(500 + ": Server error");
                                                                    res.json(resdata);
                                                                    res.end()
                                                                }
                                                                else if(doc === null){
                                                                    console.log(404 + ": passenger not found in flightInfo");
                                                                    res.json(resdata);
                                                                    res.end()
                                                                }
                                                                else{
                                                                    var data = {
                                                                        name: item.name,
                                                                        tel: item.tel,
                                                                        seat: doc.seat,
                                                                        price: item.price,
                                                                        paid: item.paid
                                                                    };
                                                                    if(item.paid)
                                                                        data.paid = PAIED;
                                                                    else data.paid = UNPAIED;
                                                                    resdata.person.push(data);
                                                                    if(index === lists.length-1){
                                                                        res.json(resdata);
                                                                        res.end();
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                        else if(resdata.auctionType === 1 || resdata.auctionType === 2 || resdata.auctionType === 3 || resdata.auctionType === 4){
                                            auctionResultModel.find({auctionID: auctionid}).exec(function (err, lists) {
                                                if (err) {
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                    res.json(resdata);
                                                    res.end();
                                                }
                                                else {
                                                    if (lists.length === 0) {
                                                        console.log(404 + ": auctionID not found in auctionResult");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else {
                                                        lists.forEach(function (item, index) {
                                                            flightInfoModel.findOne({id:item.id,flight:flight,date:date}, function (err, doc) {
                                                                if(err){
                                                                    console.log(err);
                                                                    console.log(500 + ": Server error");
                                                                    res.json(resdata);
                                                                    res.end()
                                                                }
                                                                else if(doc === null){
                                                                    console.log(404 + ": passenger not found in flightInfo");
                                                                    res.json(resdata);
                                                                    res.end()
                                                                }
                                                                else{
                                                                    var data = {
                                                                        name: item.name,
                                                                        tel: item.tel,
                                                                        seat: doc.seat,
                                                                        price: item.price,
                                                                        paid: item.paid
                                                                    };
                                                                    if(item.paid)
                                                                        data.paid = PAIED;
                                                                    else data.paid = UNPAIED;
                                                                    resdata.person.push(data);
                                                                    if(index === lists.length-1){
                                                                        res.json(resdata);
                                                                        res.end();
                                                                    }
                                                                }
                                                            });
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                        else if(resdata.auctionType === 6){
                                            auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                                                if (err) {
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                    res.json(resdata);
                                                    res.end();
                                                }
                                                else {
                                                    if (docs.length === 0) {
                                                        console.log(404 + ": auctionID not found in auctionParam");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else {
                                                        lotteryRecordModel.find({auctionID:auctionid}, function (err, docs) {
                                                            if(err){
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                            else {
                                                                if(docs.length === 0){
                                                                    console.log("Error: lotteryRecord not found / lottery not ended yet");
                                                                    resdata.timestamp = Date.parse(new Date());
                                                                    res.json(resdata);
                                                                    res.end();
                                                                }
                                                                else {
                                                                    resdata.timestamp = Date.parse(new Date());
                                                                    resdata.lucky = docs[0].luckynum;
                                                                    resdata.total = docs[0].total;
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
                                                                    res.json(resdata);
                                                                    res.end();
                                                                }
                                                            }
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                        else {
                                            console.log(404 + ": auctionType params error");
                                            res.json(resdata);
                                            res.end();
                                        }
                                    }
                                });
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
    path: '/consoleResult'
};