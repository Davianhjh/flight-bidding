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
    id: { type:String },
    flight: { type:String },
    biddingPrice: { type:Number },
    biddingTime: { type:Number },
    heat: { type: Number },
    paymentState: { type:Boolean }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var auctionResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    name: { type:String },
    id: { type:String },
    tel: { type:String },
    seatnum: { type:String },
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

var userTokenSchema = new mongoose.Schema({
    Token: { type:String },
    name: { type:String },
    tel: { type:String }
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");

var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var objectArraySort = function (keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName];
        var valueM = objectM[keyName];
        if (valueN < valueM) return 1;
        else if (valueN > valueM) return -1;
        else return 0
    }
};

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

router.get('/',function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        auctionType: 0,
        //rank: -1,
        //seats: -1,
        hit: 0,
        price: -1,
        paid: false
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
                        auctionParamModel.findOne({auctionID: auctionid}, function (err, docs) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                if (docs === null) {
                                    console.log(404 + ": auctionID not found in auctionParam");
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    var auctionType = docs.auctionType;
                                    resdata.auctionType = auctionType;
                                    biddingResultModel.find({auctionID:auctionid, id:passengerID})
                                        .exec(function (err, arr) {
                                            if(err){
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else if(arr.length === 0){
                                                console.log("Passenger not take part in the auction");
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else {
                                                arr.sort(objectArraySort('biddingTime'));
                                                if(auctionType === 2)
                                                    resdata.initial = arr[0].biddingPrice;
                                                resdata.price = arr[0].biddingPrice;
                                                auctionResultModel.findOne({auctionID: auctionid, id:passengerID})
                                                    .exec(function (err, lists) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log(500 + ": Server error");
                                                            res.json(resdata);
                                                            res.end();
                                                        }
                                                        else if(lists !== null){
                                                            resdata.hit = 1;
                                                            resdata.price = lists.price;
                                                            resdata.paid = lists.paid;
                                                            res.json(resdata);
                                                            res.end();
                                                        }
                                                        else {
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
        }
    });
});

module.exports = {
    router: router,
    path: '/biddingResult'
};