/**
 * Created by hujinhua on 2017/6/13.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

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
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

var BASEPRICE = 512;
var TIMELAP = 180;
var AUCTIONTYPE = 1;

router.post('/', function (req, res, next) {
    var attendantID = "";
    var token = req.headers['agi-token'];
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var seatnum = req.body.seatnum;

    var resdata = {
        result: 1,
        auction: -1,
        timelap: -1
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
                jwt.verify(token, 'secret', function (err, decoded) {
                    if (err) {
                        console.log(err);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify(resdata));
                        res.end();
                    }
                    else {
                        attendantID = decoded.id;
                        if (flight === "CZ6605")
                            AUCTIONTYPE = 1;
                        else if (flight === "HU7187")
                            AUCTIONTYPE = 2;
                        var startTime = Date.parse(new Date());
                        var auctionData = new auctionParamModel({
                            "auctionID": auctionid,
                            "flight": flight,
                            "attentantUUID": attendantID,
                            "baseprice": BASEPRICE,
                            "timelap": TIMELAP,
                            "seatnum": seatnum,
                            "startTime": startTime,
                            "auctionType": AUCTIONTYPE,
                            "auctionState": 1,
                            "count": 0
                        });

                        auctionParamModel.find({auctionID: auctionid}, function (error, docs) {
                            if (error) {
                                console.log(error);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if (typeof(auctionid) === "undefined") {
                                    console.log(403 + ": auctionID invalid params error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else if (docs.length === 0) {
                                    auctionData.save(function (err) {
                                        if (err) {
                                            console.log(err);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                        }
                                        else {
                                            console.log('save success');
                                            resdata.auction = 1;
                                            resdata.timelap = TIMELAP;
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));

                                            var updateState = function () {
                                                return auctionParamModel.update({auctionID: auctionid}, {auctionState: 2}, function (err) {
                                                    if (err)
                                                        console.log(err);
                                                    else console.log('update auctionState to 2');
                                                });
                                            };
                                            setTimeout(updateState, TIMELAP * 1000);

                                            res.end();
                                        }
                                    });
                                }
                                else {
                                    console.log(403 + ': repeated auction id save failure');
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
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

module.exports = {
    router: router,
    path: '/startAuction'
};