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

var auctionFlightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    auctionType: { type:Number },
    baseprice: { type:Number },
    auctionID: { type:Number},
    auctionState: { type: Number}
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

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
                        var nowDate = new Date();
                        var dateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());

                        flightInfoModel.find({id: passengerID, date: dateStr})
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
                                    console.log(404 + ": Passenger not exist on today's flight");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    var flights = [];
                                    var flightArray = [];
                                    for(var k = 0; k < docs.length; k++){
                                        flightArray.push(docs[k].flight)
                                    }
                                    auctionFlightManageModel.find({date:dateStr})
                                        .where("flight").in(flightArray)
                                        .where("auctionType").in([4])
                                        .exec(function (err, lists) {
                                            if(err){
                                                console.log(error);
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                if(lists.length === 0){
                                                    resdata.flights = flights;
                                                    console.log("passenger have no overselling flights today");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    for(var i=0; i < lists.length; i++){
                                                        for(var j=0; j < docs.length; j++){
                                                            if(lists[i].flight === docs[j].flight){
                                                                var flightData = {
                                                                    flightno: docs[j].flight,
                                                                    ticketno: docs[j].ticketnum,
                                                                    date: docs[j].date,
                                                                    userstatus: docs[j].userstatus,
                                                                    auctionID: lists[i].auctionID,
                                                                    auctionState: lists[i].auctionState,
                                                                    auctionType: lists[i].auctionType,
                                                                    departure: docs[j].origin,
                                                                    departurecode: docs[j].O_code,
                                                                    arrival: docs[j].destination,
                                                                    arrivalcode: docs[j].D_code
                                                                };
                                                                break;
                                                            }
                                                        }
                                                        flights.push(flightData);
                                                    }
                                                    resdata.flights = flights;
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
    path: '/overSelling'
};