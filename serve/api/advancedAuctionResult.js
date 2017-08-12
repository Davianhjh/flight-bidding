/**
 * Created by hujinhua on 17-7-21.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
db.on('error', function(error) {
    console.log(error);
});

var flightInfoSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    userstatus: { type: Number }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

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

var auctionFlightManageSchema = new mongoose.Schema({
    flight: { type:String },
    auctionID: { type:String },
    auctionType: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var userTokenSchema = new mongoose.Schema({
    Token: { type:String },
    name: { type:String },
    tel: { type:String }
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");

var adminTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var adminTokenModel = db.model("adminToken", adminTokenSchema,"adminToken");

var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

router.post('/', function (req, res, next) {
    var token = req.headers['agi-token'];
    var auctionid = req.body.auctionid;

    var resdata = {
        result: 1,
        timestamp: -1,
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
                        auctionFlightManageModel.find({auctionID:auctionid}, function (err, docs) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                resdata.result = -1;
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if(docs.length === 0){
                                    resdata.timestamp = Date.parse(new Date());
                                    console.log(404+": auctionID params error, auction not exist");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
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
                                                resdata.timestamp = Date.parse(new Date());
                                                console.log("No seat sold during advanced auction");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                for(var i=0; i<lists.length; i++){
                                                    var data = {
                                                        auctionID: lists[i].auctionID,
                                                        flight: lists[i].flight,
                                                        name: lists[i].name,
                                                        tel: lists[i].tel,
                                                        seat: lists[i].seat,
                                                        price: lists[i].price,
                                                        paid: lists[i].paid
                                                    };
                                                    resdata.person.push(data);
                                                }
                                                resdata.timestamp = Date.parse(new Date());
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
    userTokenModel.find({Token: token}, function (err, docs) {
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
                        biddingResultModel.find({auctionID:auctionid, id:passengerID}, function (err, docs) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if(docs.length === 0){
                                    console.log("Passenger not take part in the auction");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    resdata.price = docs[0].biddingPrice;
                                    advancedAuctionResultModel.find({id:passengerID}, function (err, lists) {
                                        if(err){
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                        }
                                        else {
                                            if(lists.length === 0){
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                resdata.hit = 1;
                                                resdata.paid = lists[0].paid;
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
    path: '/advancedAuctionResult'
};
