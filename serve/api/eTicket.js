/**
 * Created by hujinhua on 17-10-9.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
db.on('error', function(error) {
    console.log(error);
});

var auctionFlightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    origin: { type:String },
    O_code: { type:String },
    destination: { type:String },
    D_code: { type:String },
    departure: { type:String },
    landing: { type:String },
    auctionID: { type:String }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

var userTokenSchema = new mongoose.Schema({
    Token: {type: String},
    name: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var jwt = require('jsonwebtoken');

var router = require('express').Router();

router.get('/', function (req, res, next) {
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];

    var resdata = {
        result: 1
    };

    if(typeof(auctionid) === "undefined"){
        console.log("auctionID params invalid error");
        res.json(resdata);
        res.end();
        return;
    }

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
                jwt.verify(token, 'secret', function (error1) {
                    if (error1) {
                        console.log(error1);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.json(resdata);
                        res.end();
                    }
                    else {
                        resdata.name = docs.name;
                        auctionFlightManageModel.findOne({auctionID:auctionid}, function (err, list) {
                            if(err){
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else if(list === null){
                                console.log(404 + ": auctionID not found in auctionFlightManage");
                                res.json(resdata);
                                res.end();
                            }
                            else {
                                resdata.flight = list.flight;
                                resdata.date = list.date;
                                resdata.origin = list.origin;
                                resdata.destination = list.destination;

                                // the stubborn data (all of the following information need to get from airline co.)
                                resdata.class = "C";                  // change to Business class after the bidding
                                resdata.seat = "C2";                  // allocated Business class seat
                                resdata.onBoardTime = "21:10";        // the deadline passenger on board
                                resdata.entrance = "A4";              // the entrance passenger ob board
                                resdata.cardNumber = "CN15734354";    // the VIP/membership card passenger got
                                res.json(resdata);
                                res.end();
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
    path: '/eTicket'
};