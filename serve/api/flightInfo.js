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
    auctionID: { type:String },
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
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
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

                        if (typeof(auctionid) === "undefined" && typeof(flight) === "undefined") {
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
                                        console.log(404 + ": Passenger not existed on today's flight");
                                        resdata.result = 1;
                                        resdata.flights = [];
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
                                            .where("auctionType").in([1,2,3,5])
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
                                                        for(var m=0; m<docs.length; m++){
                                                            var data = {
                                                                flightno: docs[m].flight,
                                                                ticketno: docs[m].ticketnum,
                                                                date: docs[m].date,
                                                                userstatus: docs[m].userstatus,
                                                                auctionID: "",
                                                                auctionState: -1,
                                                                auctionType: 0,
                                                                departure: docs[m].origin,
                                                                departurecode: docs[m].O_code,
                                                                arrival: docs[m].destination,
                                                                arrivalcode: docs[m].D_code
                                                            }
                                                        }
                                                        flights.push(data);
                                                        resdata.flights = flights;
                                                        console.log("passenger have no auction flights today");
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
                        else if(typeof(auctionid) !== "undefined" && typeof(flight) !== "undefined"){
                            flightInfoModel.find({
                                id: passengerID,
                                flight: flight,
                                date: dateStr
                            }).exec(function (error, docs) {
                                if (error) {
                                    console.log(error);
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    if (docs.length === 0) {
                                        console.log(404 + ": Passenger not existed on flight " + flight);
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        var flights = [];
                                        auctionFlightManageModel.find({auctionID:auctionid, date:dateStr}, function (err, doc) {
                                            if (err) {
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                if(doc.length === 0) {
                                                    console.log(403 + ": passenger auctionID invalid params error");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    var flightData = {
                                                        flightno: docs[0].flight,
                                                        ticketno: docs[0].ticketnum,
                                                        date: docs[0].date,
                                                        userstatus: docs[0].userstatus,
                                                        auctionID: doc[0].auctionID,
                                                        auctionState: doc[0].auctionState,
                                                        auctionType: doc[0].auctionType,
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
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else {
                            console.log("flight or auctionid params error");
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.write(JSON.stringify(resdata));
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
    path: '/flightInfo'
};