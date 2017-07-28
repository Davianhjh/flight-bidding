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
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number },
    seat: { type:String },
    paymentState: { type:Boolean },
    paymentPrice:{ type:Number }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionType: { type:Number },
    seatnum: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    name: { type:String },
    tel: { type:String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

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
    var passenger = [];
    var candidate = {};
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        timestamp: -1,
        flight: -1,
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
                                    if(auctionType !== 4) {
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
                                                    var flight = docs[0].flight;
                                                    var candidateID = [];
                                                    for (var i = 0; i < seatnum && i < docs.length; i++)
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
                                                            for (var i = 0; i < docs.length && i < seatnum; i++) {
                                                                for (var j = 0; j < lists.length; j++) {
                                                                    if (docs[i].id === lists[j].id) {
                                                                        candidate = {
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
                                                    var flight = docs[0].flight;
                                                    var candidateID = [];
                                                    for (var i = 0; i < seatnum && i < docs.length; i++)
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
                                                            for (var i = 0; i < docs.length && i < seatnum; i++) {
                                                                for (var j = 0; j < lists.length; j++) {
                                                                    if (docs[i].id === lists[j].id) {
                                                                        candidate = {
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
                                    var seatnum = docs[0].seatnum;
                                    var auctionType = docs[0].auctionType;
                                    var paymentPrice = 0;
                                    resdata.seats = seatnum;
                                    resdata.auctionType = auctionType;
                                    if(auctionType !== 4) {
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
                                                    var result = false;
                                                    for (var i = 0; i < docs.length; i++) {
                                                        if (docs[i].id === passengerID) {
                                                            result = i + 1;
                                                            resdata.rank = result;
                                                            resdata.price = docs[i].biddingPrice;
                                                            resdata.paid = docs[i].paymentState;
                                                            if (auctionType === 2 && i < seatnum && i < docs.length && docs.length === seatnum)
                                                                paymentPrice = docs[seatnum-1].biddingPrice;
                                                            else if (auctionType === 2 && i < seatnum && i < docs.length)
                                                                paymentPrice = docs[Math.min(seatnum, docs.length)].biddingPrice;
                                                        }
                                                    }
                                                    if (result <= seatnum && result !== false) {
                                                        resdata.hit = 1;
                                                        if (auctionType === 1 || auctionType === 3)
                                                            paymentPrice = resdata.price;
                                                    }
                                                    biddingResultModel.update({
                                                        auctionID: auctionid,
                                                        id: passengerID
                                                    }, {paymentPrice: paymentPrice}, function (err) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                        else {
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
                                                    console.log(404 + ": auctionID not found in auctionResult");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    var result = false;
                                                    for (var i = 0; i < docs.length; i++) {
                                                        if (docs[i].id === passengerID) {
                                                            result = i + 1;
                                                            resdata.rank = result;
                                                            resdata.price = docs[i].biddingPrice;
                                                            resdata.paid = docs[i].paymentState;
                                                        }
                                                    }
                                                    if (result <= seatnum && result !== false) {
                                                        resdata.hit = 1;
                                                        paymentPrice = resdata.price;
                                                    }
                                                    biddingResultModel.update({
                                                        auctionID: auctionid,
                                                        id: passengerID
                                                    }, {paymentPrice: paymentPrice}, function (err) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                                            res.write(JSON.stringify(resdata));
                                                            res.end();
                                                        }
                                                        else {
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

module.exports = {
    router: router,
    path: '/biddingResult'
};