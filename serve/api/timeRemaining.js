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
    auctionState: { type: Number }
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
        timeleft: -1
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
                console.log(err);
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
                                if (docs.length === 0) {
                                    console.log(404+": auctionID is wrong, auction not found");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    var timeLap = docs[0].timelap;
                                    var auctionState = docs[0].auctionState;
                                    var startTime = docs[0].startTime;
                                    if (auctionState === -1 || auctionState === 0 || auctionState === 2) {
                                        console.log(403+': error auctionState '+auctionState);
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        var nowTime = Date.parse(new Date());
                                        //console.log('NOW TIME: '+nowTime);
                                        //console.log('START TIME: '+startTime);
                                        var timeLeft = timeLap * 1000 - (nowTime - startTime);
                                        //console.log(timeLeft);
                                        if (timeLeft < 0) {
                                            console.log(403+': auction is closed');
                                            resdata.totaltime = timeLap;
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                            resdata.totaltime = -1;
                                        }
                                        else {
                                            resdata.timeleft = timeLeft/1000;
                                            resdata.totaltime = timeLap;
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                            resdata.totaltime = -1;
                                            resdata.timeleft = -1;
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