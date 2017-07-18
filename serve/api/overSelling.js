/**
 * Created by hujinhua on 17-7-17.
 */
/**
 * Created by hujinhua on 2017/6/9.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    flight: { type:String },
    origin: { type:String },
    O_code: { type:String },
    destination: { type:String },
    D_code: { type:String },
    date: { type:String },
    userstatus: { type: Number },
    ticketnum: { type: String },
    auctionID: { type: String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionState: { type:Number },
    auctionType: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var userTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");
var jwt = require('jsonwebtoken');
var async = require('async');

var router = require('express').Router();

function zeroFill (i) {
    return (i < 10 ? '0' : '') + i
}

router.get('/', function (req, res, next) {
    var passengerID = "";
    var token = req.headers['agi-token'];
    var resdata = {
        result: 1,
        flights: []
    };

    userTokenModel.find({Token:token}, function (err, docs) {
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
                console.log(400+": Token is wrong");
                resdata.result = -1;
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.write(JSON.stringify(resdata));
                res.end();
            }
            else {
                jwt.verify(token, 'secret', function (error1, decoded) {
                    if(error1) {
                        console.log(error1);
                        console.log(403+ ": Token is not valid");
                        resdata.result = -1;
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify(resdata));
                        res.end();
                    }
                    else {
                        passengerID = decoded.id;
                        var flightArray = ["HU7803"];
                        var nowDate = new Date();
                        var dateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());

                        flightInfoModel.find({id: passengerID, date: dateStr})
                            .where("flight").in(flightArray)
                            .exec(function (error, docs) {
                            if (error) {
                                console.log(error);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if (docs.length === 0) {
                                    console.log(404 + ": Passenger not having an overselling flight");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    var flights = [];
                                    var auctionflights = [];
                                    for (var i = 0; i < docs.length; i++)
                                        auctionflights.push(docs[i].auctionID);
                                    auctionParamModel.find({auctionID: {$in: auctionflights}}, function (err, lists) {
                                        if (err) {
                                            console.log(error);
                                            console.log(500 + ": Server error");
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
                                        }
                                        else {
                                            for (var i = 0; i < docs.length; i++) {
                                                var auctionState = -1;
                                                var auctionType = -1;
                                                for (var j = 0; j < lists.length; j++) {
                                                    if (docs[i].auctionID === lists[j].auctionID) {
                                                        auctionState = lists[j].auctionState;
                                                        auctionType = lists[j].auctionType;
                                                        break;
                                                    }
                                                }
                                                var flightData = {
                                                    flightno: docs[i].flight,
                                                    ticketno: docs[i].ticketnum,
                                                    date: docs[i].date,
                                                    userstatus: docs[i].userstatus,
                                                    auctionID: docs[i].auctionID,
                                                    auctionState: auctionState,
                                                    auctionType: auctionType,
                                                    departure: docs[i].origin,
                                                    departurecode: docs[i].O_code,
                                                    arrival: docs[i].destination,
                                                    arrivalcode: docs[i].D_code
                                                };
                                                flights.push(flightData);
                                            }
                                            resdata.result = 1;
                                            resdata.flights = flights;
                                            res.writeHead(200, {'Content-Type': 'application/json'});
                                            res.write(JSON.stringify(resdata));
                                            res.end();
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
    path: '/overSelling'
};