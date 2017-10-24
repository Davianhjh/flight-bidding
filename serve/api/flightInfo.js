/**
 * Created by hujinhua on 2017/6/9.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
db.on('error', function(error) {
    console.log(error);
});
const async = require('async');

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    flight: { type:String },
    origin: { type:String },
    O_code: { type:String },
    destination: { type:String },
    D_code: { type:String },
    date: { type:String },
    ticketnum: { type: String }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var auctionFlightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    origin: { type:String },
    O_code: { type:String },
    destination: { type:String },
    D_code: { type:String },
    departure: { type:String },
    landing: { type:String },
    auctionID: { type:String },
    auctionType: { type:Number },
    stageType: { type:Number},
    baseprice: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number },
    timeLap: { type: Number }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

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

function zeroFill (i) {
    return (i < 10 ? '0' : '') + i
}

var objectArraySort = function (keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName];
        var valueM = objectM[keyName];
        if (valueN < valueM) return 1;
        else if (valueN > valueM) return -1;
        else return 0
    }
};

router.get('/', function (req, res, next) {
    var passengerID = "";
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var token = req.headers['agi-token'];
    var resdata = {
        result: 1,
        flights: []
    };

    userTokenModel.findOne({Token:token}, function (err, docs) {
        if(err){
            console.log(err);
            console.log(500 + ": Server error");
            resdata.result = -1;
            res.json(resdata);
            res.end();
        }
        else {
            if(docs === null){
                console.log(400+": Token is wrong");
                resdata.result = -1;
                res.json(resdata);
                res.end();
            }
            else {
                jwt.verify(token, 'secret', function (error1, decoded) {
                    if(error1) {
                        console.log(error1);
                        console.log(403+ ": Token is not valid");
                        resdata.result = -1;
                        res.json(resdata);
                        res.end();
                    }
                    else {
                        passengerID = decoded.id;

                        var nowDate = new Date();
                        var dateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());

                        if (typeof(auctionid) === "undefined" && typeof(flight) === "undefined") {
                            flightInfoModel.find({id: passengerID, date: dateStr})
                                .exec(function (error, doc) {
                                    if (error) {
                                        console.log(error);
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        if (doc.length === 0) {
                                            //console.log(404 + ": Passenger have no flights today");
                                            res.json(resdata);
                                            res.end();
                                        }
                                        else {
                                            var flights = {};
                                            var flightArray = [];
                                            var auctionIDArray = [];
                                            var ticketNoArray = {};
                                            for (var i = 0; i < doc.length; i++) {
                                                flightArray.push(doc[i].flight);
                                                ticketNoArray[doc[i].flight] = doc[i].ticketnum;
                                            }
                                            auctionFlightManageModel.find({date: dateStr})
                                                .where("flight").in(flightArray)
                                                .where("auctionType").in([1, 2, 3, 5])
                                                .exec(function (err, lists) {
                                                    if (err) {
                                                        console.log(error);
                                                        console.log(500 + ": Server error");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else if (lists.length !== 0) {
                                                        lists.forEach(function (item) {
                                                            var flightData = {
                                                                flightno: item.flight,
                                                                ticketno: ticketNoArray[item.flight],
                                                                date: dateStr,
                                                                userstatus : -1,
                                                                auctionID: item.auctionID,
                                                                auctionState: item.auctionState,
                                                                auctionType: item.auctionType,
                                                                departure: item.origin,
                                                                departurecode: item.O_code,
                                                                arrival: item.destination,
                                                                arrivalcode: item.D_code
                                                            };
                                                            flights[item.auctionID] = flightData;
                                                            auctionIDArray.push(item.auctionID);
                                                        });
                                                        userStateModel.find({userID:passengerID})
                                                            .where('auctionID').in(auctionIDArray)
                                                            .exec(function (err, arr) {
                                                            if(err){
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                            else if(arr.length !== 0){
                                                                var checked = [];
                                                                arr.sort(objectArraySort('timeStamp'));
                                                                for(var i=0; i<arr.length && checked.length !== auctionIDArray.length; i++){
                                                                    var tmp = arr[i].auctionID;
                                                                    if(!checked.includes(tmp)){
                                                                        flights[tmp].userstatus = arr[i].userstatus;
                                                                        resdata.flights.push(flights[tmp]);
                                                                    }
                                                                }
                                                                res.json(resdata);
                                                                flights = {};
                                                                flightArray = [];
                                                                ticketNoArray = {};
                                                                auctionIDArray = [];
                                                                res.end();
                                                            }
                                                            else {
                                                                auctionIDArray.forEach(function (item) {
                                                                    resdata.flights.push(flights[item]);
                                                                });
                                                                res.json(resdata);
                                                                flights = {};
                                                                flightArray = [];
                                                                ticketNoArray = {};
                                                                auctionIDArray = [];
                                                                res.end();
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        res.json(resdata);
                                                        flightArray = [];
                                                        ticketNoArray = {};
                                                        res.end();
                                                    }
                                                });
                                        }
                                    }
                                });
                        }
                        else if(typeof(auctionid) !== "undefined" && typeof(flight) !== "undefined"){
                            flightInfoModel.findOne({
                                id: passengerID,
                                date: dateStr,
                                flight: flight
                            }).exec(function (error, docs) {
                                if (error) {
                                    console.log(error);
                                    console.log(500 + ": Server error");
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    if (docs === null) {
                                        console.log(404 + ": Passenger not existed on flight " + flight);
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        var flights = [];
                                        auctionFlightManageModel.findOne({auctionID:auctionid}, function (err, doc) {
                                            if (err) {
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else {
                                                if(doc === null) {
                                                    console.log(403 + ": passenger auctionID invalid params error");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    userStateModel.find({userID:passengerID, auctionID:auctionid})
                                                        .sort({timeStamp: -1})
                                                        .exec(function (err, arr) {
                                                            if (err) {
                                                                console.log(error);
                                                                console.log(500 + ": Server error");
                                                            }
                                                            var flightData = {
                                                                flightno: docs.flight,
                                                                ticketno: docs.ticketnum,
                                                                date: docs.date,
                                                                //userstatus: -1,
                                                                auctionID: doc.auctionID,
                                                                auctionState: doc.auctionState,
                                                                auctionType: doc.auctionType,
                                                                departure: docs.origin,
                                                                departurecode: docs.O_code,
                                                                arrival: docs.destination,
                                                                arrivalcode: docs.D_code
                                                            };
                                                            if (arr.length === 0) {
                                                                flightData.userstatus = -1;
                                                            }
                                                            else {
                                                                flightData.userstatus = arr[0].userstatus;
                                                            }
                                                            flights.push(flightData);
                                                            resdata.flights = flights;
                                                            res.json(resdata);
                                                            res.end();
                                                        });
                                                }
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else {
                            console.log("flight or auctionid params error");
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
    path: '/flightInfo'
};