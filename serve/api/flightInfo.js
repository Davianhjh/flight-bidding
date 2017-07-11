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
    var flight = req.query.flight;
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

                        if (typeof(flight) === "undefined") {
                            flightInfoModel.find({id: passengerID, date: dateStr}, function (error, docs) {
                                if (error) {
                                    console.log(error);
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    if (docs.length === 0) {
                                        console.log(404 + ": Passenger not existed on today's flight");
                                        resdata.result = 1;
                                        resdata.flights = {};
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
                                        })
                                        /*
                                         var flights = [];
                                         for (var i=0; i < docs.length; i++) {
                                         (function (i) {
                                         var auctionState = -1;
                                         auctionParamModel.find({auctionID: docs[i].auctionID}, function (err, doc) {
                                         if (err) {
                                         console.log(error);
                                         console.log(500 + ": Server error");
                                         res.writeHead(200, {'Content-Type': 'application/json'});
                                         res.write(JSON.stringify(resdata));
                                         res.end();
                                         }
                                         else {
                                         if (doc.length !== 0) {
                                         auctionState = doc[0].auctionState;
                                         }
                                         var flightData = {
                                         flightno: docs[i].flight,
                                         ticketno: docs[i].ticketnum,
                                         date: docs[i].date,
                                         userstatus: docs[i].userstatus,
                                         auctionID: docs[i].auctionID,
                                         auctionState: auctionState,
                                         departure: docs[i].origin,
                                         departurecode: docs[i].O_code,
                                         arrival: docs[i].destination,
                                         arrivalcode: docs[i].D_code
                                         };
                                         flights.push(flightData);
                                         if(i === docs.length-1) {
                                         resdata.result = 1;
                                         resdata.flights = flights;
                                         res.writeHead(200, {'Content-Type': 'application/json'});
                                         res.write(JSON.stringify(resdata));
                                         res.end();
                                         }
                                         }
                                         });
                                         })(i);
                                         }
                                         */
                                    }
                                }
                            });
                        }
                        else {
                            flightInfoModel.find({
                                id: passengerID,
                                flight: flight,
                                date: dateStr
                            }, function (error, docs) {
                                if (error) {
                                    console.log(error);
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    //console.log(docs[0]);
                                    if (docs.length === 0) {
                                        console.log(404 + ": Passenger not existed on flight " + flight);
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        var flights = [];
                                        var auctionState = -1;
                                        var auctionType = -1;
                                        auctionParamModel.find({auctionID: docs[0].auctionID}, function (err, doc) {
                                            if (err) {
                                                console.log(error);
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                if (doc.length !== 0) {
                                                    auctionState = doc[0].auctionState;
                                                    auctionType = doc[0].auctionType;
                                                }
                                                var flightData = {
                                                    flightno: docs[0].flight,
                                                    ticketno: docs[0].ticketnum,
                                                    date: docs[0].date,
                                                    userstatus: docs[0].userstatus,
                                                    auctionID: docs[0].auctionID,
                                                    auctionState: auctionState,
                                                    auctionType: auctionType,
                                                    departure: docs[0].origin,
                                                    departurecode: docs[0].O_code,
                                                    arrival: docs[0].destination,
                                                    arrivalcode: docs[0].D_code
                                                };
                                                flights.push(flightData);
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
                    }
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/flightInfo'
};