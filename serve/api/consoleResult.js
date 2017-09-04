/**
 * Created by hujinhua on 17-8-8.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

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

var flightManageSchema = new mongoose.Schema({
    id: { type:String },
    flight: { type:String },
    date: { type:String },
    origin: { type:String },
    destination: { type:String },
    departure: { type:String },
    landing: { type:String },
    state: { type: Number }
},{collection:"flightManage"});
var flightManageModel = db.model("flightMange", flightManageSchema,"flightManage");

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
    auctionID: { type:String },
    auctionType: { type:Number },
    baseprice: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

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

    adminTokenModel.find({Token: token}, function (err, docs) {
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
                console.log(token);
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
                        resdata.flight = flight;
                        resdata.date = date.slice(0,4) + "-" + date.slice(4,6) + "-" + date.slice(6,8);
                        flightManageModel.find({flight:flight, date:date}, function (err, docs) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else if(docs.length === 0){
                                console.log(404 + ": flight params error, flight not found");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                resdata.departure = docs[0].departure;
                                resdata.landing = docs[0].landing;
                                resdata.origin = docs[0].origin;
                                resdata.destination = docs[0].destination;
                                auctionFlightManageModel.find({flight:flight, date:date}, function (err, lists) {
                                    if(err){
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else if(lists.length === 0){
                                        console.log(404 + ": flight params error, flight's auction not found");
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        var auctionid = lists[0].auctionID;
                                        resdata.auctionType = lists[0].auctionType;
                                        resdata.basePrice = lists[0].baseprice;
                                        resdata.auctionState = lists[0].auctionState;
                                        auctionParamModel.find({auctionID:auctionid}, function (err, arr) {
                                            if(err){
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else if(arr.length === 0){
                                                console.log(404 + ": flight's auction not started yet");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                var startDate = new Date(arr[0].startTime);
                                                resdata.startTime = dateFormat(startDate);
                                                resdata.seat = arr[0].seatnum;
                                                if(resdata.auctionType === 5){
                                                    advancedAuctionResultModel.find({auctionID:auctionid}, function (err, lists) {
                                                        if(err){
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                        else {
                                                            if(lists.length === 0){
                                                                console.log("No seat sold during advanced auction");
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                            else {
                                                                for(var i=0; i<lists.length; i++){
                                                                    var data = {
                                                                        name: lists[i].name,
                                                                        tel: lists[i].tel,
                                                                        seat: lists[i].seat,
                                                                        price: lists[i].price,
                                                                        paid: lists[i].paid
                                                                    };
                                                                    if(lists[i].paid)
                                                                        data.paid = PAIED;
                                                                    else data.paid = UNPAIED;
                                                                    resdata.person.push(data);
                                                                }
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                        }
                                                    });
                                                }
                                                else if(resdata.auctionType === 1 || resdata.auctionType === 2 || resdata.auctionType === 3 || resdata.auctionType === 4){
                                                    auctionResultModel.find({auctionID: auctionid}).exec(function (err, lists) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                        else {
                                                            if (docs.length === 0) {
                                                                console.log(404 + ": auctionID not found in auctionResult");
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                            else {
                                                                for(var i=0; i<lists.length; i++){
                                                                    var data = {
                                                                        name: lists[i].name,
                                                                        tel: lists[i].tel,
                                                                        seat: lists[i].seat,
                                                                        price: lists[i].price,
                                                                        paid: lists[i].paid
                                                                    };
                                                                    if(lists[i].paid)
                                                                        data.paid = PAIED;
                                                                    else data.paid = UNPAIED;
                                                                    resdata.person.push(data);
                                                                }
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                        }
                                                    });
                                                }
                                                else if(resdata.auctionType === 6){
                                                    //TODO lottery result show
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
                                                else {
                                                    console.log(404 + ": auctionType params error");
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
        }
    });
});

module.exports = {
    router: router,
    path: '/consoleResult'
};