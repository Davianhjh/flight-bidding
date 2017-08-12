/**
 * Created by hujinhua on 17-8-8.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

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

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number },
    seat: { type:String },
    paymentState: { type:Boolean },
    paymentPrice:{ type:Number }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

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

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    name: { type:String },
    tel: { type:String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

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

router.post('/', function (req, res, next) {
    var passenger = [];
    var candidate = {};
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
                                                if(resdata.auctionType === 1 || resdata.auctionType === 2 || resdata.auctionType === 3){
                                                    biddingResultModel.find({auctionID: auctionid}).sort({biddingPrice: -1}).exec(function (err, docs) {
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
                                                                var candidateID = [];
                                                                for (var i = 0; i < resdata.seat && i < docs.length; i++)
                                                                    candidateID.push(docs[i].id);
                                                                flightInfoModel.find({id: {$in: candidateID}}, function (err, lists) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        for (var i = 0; i < docs.length && i < resdata.seat; i++) {
                                                                            for (var j = 0; j < lists.length; j++) {
                                                                                if (docs[i].id === lists[j].id) {
                                                                                    candidate = {
                                                                                        name: lists[j].name,
                                                                                        tel: lists[j].tel,
                                                                                        seat: docs[i].seat,
                                                                                        price: docs[i].biddingPrice.toString(),
                                                                                        paid: docs[i].paymentState
                                                                                    };
                                                                                    if(docs[i].paymentState)
                                                                                        candidate.paid = PAIED;
                                                                                    else candidate.paid = UNPAIED;
                                                                                    passenger.push(candidate);
                                                                                    break;
                                                                                }
                                                                            }
                                                                        }
                                                                        resdata.person = passenger;
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    });
                                                }
                                                else if(resdata.auctionType === 4){
                                                    biddingResultModel.find({auctionID: auctionid}).sort({biddingPrice: 1}).exec(function (err, docs) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                        else {
                                                            if (docs.length === 0) {
                                                                console.log(404 + ": auctionID not found in biddingResult");
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                            else {
                                                                var candidateID = [];
                                                                for (var i = 0; i < resdata.seat && i < docs.length; i++)
                                                                    candidateID.push(docs[i].id);
                                                                flightInfoModel.find({id: {$in: candidateID}}, function (err, lists) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                    else {
                                                                        for (var i = 0; i < docs.length && i < resdata.seat; i++) {
                                                                            for (var j = 0; j < lists.length; j++) {
                                                                                if (docs[i].id === lists[j].id) {
                                                                                    candidate = {
                                                                                        name: lists[j].name,
                                                                                        tel: lists[j].tel,
                                                                                        seat: docs[i].seat,
                                                                                        price: docs[i].biddingPrice.toString(),
                                                                                        paid: docs[i].paymentState
                                                                                    };
                                                                                    if(docs[i].paymentState)
                                                                                        candidate.paid = PAIED;
                                                                                    else candidate.paid = UNPAIED;
                                                                                    passenger.push(candidate);
                                                                                    break;
                                                                                }
                                                                            }
                                                                        }
                                                                        resdata.person = passenger;
                                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                                        res.write(JSON.stringify(resdata));
                                                                        res.end();
                                                                    }
                                                                });
                                                            }
                                                        }
                                                    });
                                                }
                                                else if(resdata.auctionType === 5){
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
                                                                    if(docs[i].paymentState)
                                                                        candidate.paid = PAIED;
                                                                    else candidate.paid = UNPAIED;
                                                                    resdata.person.push(data);
                                                                }
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
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