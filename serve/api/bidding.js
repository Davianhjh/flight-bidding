/**
 * Created by hujinhua on 2017/6/13.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var userStateSchema = new mongoose.Schema({
    userID: { type:String },
    flight: { type:String },
    date: { type:String },
    auctionID: { type:String },
    userstatus: { type:Number },
    timeStamp: { type:Number }
},{collection:"userState"});
var userStateModel = db.model("userState", userStateSchema, "userState");

var userTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var jwt = require('jsonwebtoken');

var router = require('express').Router();

router.get('/', function (req, res, next) {
    var passengerID = "";
    var action = req.query.action;
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var date = req.query.date;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1
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
                        if (action === "agree") {
                            var now_time = Date.parse(new Date());
                            userStateModel.create({
                                userID:passengerID,
                                flight:flight, date:date,
                                auctionID:auctionid,
                                userstatus:0,
                                timeStamp:now_time
                            }, function (err) {
                                if (err) {
                                    console.log(500 + ": Server error");
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    resdata = {
                                        result: 1,
                                        agree: 1
                                    };
                                    res.json(resdata);
                                    res.end();
                                }
                            });
                        }
                        else {
                            console.log(403 + ": query params error");
                            res.json(resdata);
                            res.end();
                        }
                    }
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/bidding'
};