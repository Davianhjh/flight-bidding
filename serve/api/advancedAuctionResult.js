/**
 * Created by hujinhua on 17-7-21.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
db.on('error', function(error) {
    console.log(error);
});

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

router.get('/',function (req, res, next) {
    var passengerID = "";
    var auctionid = req.query.auctionid;
    var flight = req.query.flight;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1,
        auctionType: 5,
        hit: 0,
        price: -1,
        paid: false
    };
    userTokenModel.findOne({Token: token}, function (err, docs) {
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
                        biddingResultModel.find({auctionID:auctionid, id:passengerID})
                            .sort({biddingTime: -1})
                            .exec(function (err, docs) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                if(docs.length === 0){
                                    console.log("Passenger not take part in the auction");
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    resdata.price = docs[0].biddingPrice;
                                    advancedAuctionResultModel.findOne({id:passengerID, auctionID:auctionid}, function (err, lists) {
                                        if(err){
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.json(resdata);
                                            res.end();
                                        }
                                        else {
                                            if(lists !== null){
                                                resdata.hit = 1;
                                                resdata.paid = lists.paid;
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else {
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
    path: '/advancedAuctionResult'
};
