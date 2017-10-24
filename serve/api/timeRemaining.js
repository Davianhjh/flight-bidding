/**
 * Created by hujinhua on 2017/6/14.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    timelap: { type:Number },
    startTime: { type:Number },
    auctionState: { type: Number },
    auctionType: { type: Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var userTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var jwt = require('jsonwebtoken');

var router = require('express').Router();

router.get('/', function (req, res, next) {
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];
    var resdata = {
        result: 1,
        totaltime: -1,
        timeleft: -1,
        auctiontype: 0
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
                console.log(err);
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
                        auctionParamModel.findOne({auctionID:auctionid}, function (err, docs) {
                            if(err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                if (docs === null) {
                                    console.log(404+": auctionID is wrong, auction not found");
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    var timeLap = docs.timelap;
                                    var auctionState = docs.auctionState;
                                    var auctionType = docs.auctionType;
                                    var startTime = docs.startTime;
                                    if (auctionState === -1 || auctionState === 0 || auctionState === 2) {
                                        console.log(403+': error auctionState '+auctionState);
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        var nowTime = Date.parse(new Date());
                                        var timeLeft = timeLap * 1000 - (nowTime - startTime);
                                        if (timeLeft < 0) {
                                            console.log(403+': auction is closed');
                                            resdata.totaltime = timeLap;
                                            resdata.auctiontype = auctionType;
                                            res.json(resdata);
                                            res.end();
                                        }
                                        else {
                                            resdata.timeleft = timeLeft/1000;
                                            resdata.totaltime = timeLap;
                                            resdata.auctiontype = auctionType;
                                            res.json(resdata);
                                            res.end();
                                        }
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
    path: '/timeRemaining'
};