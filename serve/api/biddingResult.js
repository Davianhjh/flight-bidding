/**
 * Created by hujinhua on 2017/6/14.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    name: { type:String },
    tel: { type:String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number },
    seat: { type:String },
    paymentState: { type:Boolean }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var auctionResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    name: { type:String },
    id: { type:String },
    tel: { type:String },
    seat: { type:String },
    price: { type:Number },
    paid: { type:Boolean }
},{collection:"auctionResult"});
var auctionResultModel = db.model("auctionResult", auctionResultSchema,"auctionResult");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionType: { type:Number },
    seatnum: { type:Number },
    baseprice: { type:Number }
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


router.post('/', function (req, res, next) {
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        timestamp: -1,
        flight: flight,
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
                        auctionParamModel.find({auctionID:auctionid}, function (err, docs) {
                            if(err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if(docs.length === 0) {
                                    console.log(404+": auctionID not found in auctionParam");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    var seatnum = docs[0].seatnum;
                                    var auctionType = docs[0].auctionType;
                                    var baseprice = docs[0].baseprice;
                                    var candidate = {};
                                    var candidateID = [];
                                    var passenger = [];
                                    var winner = [];

                                    if(auctionType !== 4) {
                                        biddingResultModel.find({auctionID: auctionid})
                                            .where('biddingPrice').gte(baseprice)
                                            .sort({biddingPrice: -1})
                                            .exec(function (err, docs) {
                                                if (err) {
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    if (docs.length === 0) {
                                                        console.log("No passenger won");
                                                        resdata.timestamp = Date.parse(new Date());
                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                        res.write(JSON.stringify(resdata));
                                                        res.end();
                                                    }
                                                    else {
                                                        for (var i = 0; i < docs.length; i++) {
                                                            if (i < seatnum)
                                                                winner.push(docs[i].id);
                                                            candidateID.push(docs[i].id);
                                                        }
                                                        flightInfoModel.find({id: {$in: winner}}, function (err, lists) {
                                                            if (err) {
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                            else {
                                                                for (var i = 0; i < docs.length && i < seatnum; i++) {
                                                                    for (var j = 0; j < lists.length; j++) {
                                                                        if (docs[i].id === lists[j].id) {
                                                                            candidate = {
                                                                                id: lists[j].id,
                                                                                name: lists[j].name,
                                                                                tel: lists[j].tel,
                                                                                seat: docs[i].seat,
                                                                                price: docs[i].biddingPrice.toString(),
                                                                                paid: docs[i].paymentState
                                                                            };
                                                                            passenger.push(candidate);
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                                resdata.timestamp = Date.parse(new Date());
                                                                resdata.flight = flight;
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
                                    else {
                                        biddingResultModel.find({auctionID: auctionid})
                                            .where("biddingPrice").lte(baseprice)
                                            .sort({biddingPrice: 1})
                                            .exec(function (err, docs) {
                                                if (err) {
                                                    console.log(err);
                                                    console.log(500 + ": Server error");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    if (docs.length === 0) {
                                                        console.log("No participate");
                                                        resdata.timestamp = Date.parse(new Date());
                                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                                        res.write(JSON.stringify(resdata));
                                                        res.end();
                                                    }
                                                    else {
                                                        for (var i = 0; i < docs.length; i++) {
                                                            if (i < seatnum)
                                                                winner.push(docs[i].id);
                                                            candidateID.push(docs[i].id);
                                                        }
                                                        flightInfoModel.find({id: {$in: winner}}, function (err, lists) {
                                                            if (err) {
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                                res.write(JSON.stringify(resdata));
                                                                res.end();
                                                            }
                                                            else {
                                                                for (var i = 0; i < docs.length && i < seatnum; i++) {
                                                                    for (var j = 0; j < lists.length; j++) {
                                                                        if (docs[i].id === lists[j].id) {
                                                                            candidate = {
                                                                                id: lists[j].id,
                                                                                name: lists[j].name,
                                                                                tel: lists[j].tel,
                                                                                seat: docs[i].seat,
                                                                                price: docs[i].biddingPrice.toString(),
                                                                                paid: docs[i].paymentState
                                                                            };
                                                                            passenger.push(candidate);
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                                resdata.timestamp = Date.parse(new Date());
                                                                resdata.flight = flight;
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
        auctionType: 0,
        rank: -1,
        seats: -1,
        hit: 0,
        price: -1,
        paid: false
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
                        auctionParamModel.find({auctionID: auctionid}, function (err, docs) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                            }
                            else {
                                if (docs.length === 0) {
                                    console.log(404 + ": auctionID not found in auctionParam");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    var condition = {};
                                    var seatnum = docs[0].seatnum;
                                    var auctionType = docs[0].auctionType;
                                    resdata.seats = seatnum;
                                    resdata.auctionType = auctionType;
                                    if(auctionType === 4)
                                        condition = {biddingPrice: 1};
                                    else {
                                        condition = {biddingPrice: -1};
                                    }
                                    biddingResultModel.find({auctionID:auctionid})
                                        .sort(condition)
                                        .exec(function (err, docs) {
                                            if (err) {
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                for(var j = 0; j < docs.length; j++){
                                                    if(docs[j].id === passengerID) {
                                                        resdata.rank = j + 1;
                                                        if(auctionType === 2){
                                                            resdata.initial = docs[j].biddingPrice;
                                                        }
                                                        else {
                                                            resdata.price = docs[j].biddingPrice;
                                                        }
                                                    }
                                                }
                                                auctionResultModel.find({auctionID: auctionid})
                                                    .sort(condition)
                                                    .exec(function (err, lists) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                        else {
                                                            for (var i = 0; i < lists.length; i++) {
                                                                if (lists[i].id === passengerID) {
                                                                    resdata.hit = 1;
                                                                    resdata.price = lists[i].price;
                                                                    resdata.paid = lists[i].paid;
                                                                    break;
                                                                }
                                                            }
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
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/biddingResult'
};