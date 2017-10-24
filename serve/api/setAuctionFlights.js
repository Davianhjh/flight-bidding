/**
 * Created by hujinhua on 17-8-1.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
var request  = require("request");
var async = require('async');
console.time('series');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var flightManageSchema = new mongoose.Schema({
    flight: { type:String },
    origin: { type:String },
    O_code: { type:String },
    destination: { type:String },
    D_code: { type:String },
    date: { type:String },
    departure: { type:String },
    landing: { type:String },
    state: { type:Number }
},{collection:"flightManage"});
var flightManageModel = db.model("flightMange", flightManageSchema,"flightManage");

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

var adminTokenSchema = new mongoose.Schema({
    Token: {type: String}
},{collection:"userToken"});
var adminTokenModel = db.model("adminToken", adminTokenSchema,"adminToken");

var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

var TIMELAP = 60*30;
var ADVANCED_TIMELAP = 60;
var LOT_TIMELAP = 60*2;

function getAuctionID(params, type, stage) {
    var flight = params.flight;
    var date = params.date;
    var auctionID = "";
    if(type !== 6) {
        auctionID = date + flight + "TYPE" + type.toString() + "S" + stage.toString();
        return auctionID;
    }
    else if(type === 6) {
        auctionID = date + flight + "LOT" + type.toString() + "S" + stage.toString();
        return auctionID;
    }
}

function dateFormat(dateStr, timeStr) {
    var date = dateStr.slice(0,4) + '-' + dateStr.slice(4,6) + '-' + dateStr.slice(6) + ' ' + timeStr;
    return date;
}

router.post('/', function (req, res, next) {
    var adminID = "";
    var token = req.headers['agi-token'];
    var flights = req.body.flights;
    var type = parseInt(req.body.type);
    var stage = parseInt(req.body.stage);
    var basePrice = req.body.price;
    var seat = -1;
    var resdata = {
        result: 1,
        status: -1,
        repeat: 0
    };
    if(type!==1 && type!==2 && type!==3 && type!==4 && type!==5 && type!==6){
        console.log("Error: auctionType param error");
        res.json(resdata);
        res.end();
        return;
    }
    if((typeof(basePrice) === "undefined" && type!==6) || (typeof(basePrice) !== "undefined" && basePrice < 0)){
        console.log("Error: auction's base price param error");
        res.json(resdata);
        res.end();
        return;
    }
    if(typeof(req.body.stage) === 'undefined' || ((stage!==1)&&(stage!==2)&&(stage!==3))){
        console.log("Error: auction's stage param error");
        res.json(resdata);
        res.end();
        return;
    }
    if(typeof(req.body.seat) !== 'undefined'){
        seat = parseInt(req.body.seat);
    }

    adminTokenModel.findOne({Token: token}, function (err, docs) {
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
                jwt.verify(token, 'secret', function (error1, decoded) {
                    if (error1) {
                        console.log(error1);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.json(resdata);
                        res.end();
                    }
                    else {
                        adminID = decoded.id;
                        if(type === 1 || type === 2 || type === 3 || type === 4) {
                            flightManageModel.findOne({flight:flights[0].flight, date:flights[0].date}, function (err, docs) {
                                if (err) {
                                    console.log(err);
                                    console.log(500 + ": Server error");
                                    res.json(resdata);
                                    res.end();
                                }
                                else {
                                    if (docs === null) {
                                        console.log("404: " + "flight " + flights[0].flight + " not found on " + flights[0].date);
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else if (docs.state === 1) {
                                        console.log("Error: flight " + flights[0].flight + " have been set");
                                        resdata.repeat = 1;
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        flightManageModel.findOneAndUpdate({
                                            flight: flights[0].flight,
                                            date: flights[0].date
                                        }, {$set: {state: 1}}, function (err, doc) {
                                            if (err) {
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else {
                                                console.log("update " + flights[0].flight + "'s flightManage state to 1");
                                                var auctionid = getAuctionID(flights[0], type, stage);
                                                if (typeof(basePrice) === "undefined") {
                                                    basePrice = 0;
                                                }
                                                var auctionflight = new auctionFlightManageModel({
                                                    flight: flights[0].flight,
                                                    date: flights[0].date,
                                                    origin: doc.origin,
                                                    O_code: doc.O_code,
                                                    destination: doc.destination,
                                                    D_code: doc.D_code,
                                                    departure: doc.departure,
                                                    landing: doc.landing,
                                                    auctionID: auctionid,
                                                    auctionType: type,
                                                    stageType: stage,
                                                    baseprice: basePrice,
                                                    auctionState: 0,
                                                    seatnum: seat,
                                                    timeLap: TIMELAP
                                                });
                                                auctionflight.save(function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                        console.log(500 + ": Server error");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else {
                                                        console.log("flight " + flights[0].flight + "'s auction setting saved");
                                                        resdata.status = 1;
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                        else if(type === 5){
                            if(flights.length !== 1){
                                console.log("Error: Advanced auction configure params error");
                            }
                            else {
                                flightManageModel.findOne({flight:flights[0].flight, date:flights[0].date}, function (err, docs) {
                                   if(err){
                                       console.log(err);
                                       console.log(500 + ": Server error");
                                       res.json(resdata);
                                       res.end();
                                   }
                                   else {
                                       if(docs === null){
                                           console.log("404: " + "flight " + flights[0].flight + " not found on " + flights[0].date);
                                           res.json(resdata);
                                           res.end();
                                       }
                                       else {
                                           if(docs.state === 1){
                                               console.log("Error: flight " + flights[0].flight + " have been set");
                                               resdata.repeat = 1;
                                               res.json(resdata);
                                               res.end();
                                           }
                                           else {
                                               flightManageModel.findOneAndUpdate({flight:flights[0].flight, date:flights[0].date}, {$set: {state:1}}, function (err, doc) {
                                                   if(err){
                                                       console.log(err);
                                                       console.log(500 + ": Server error");
                                                       res.writeHead(200, {'Content-Type': 'application/json'});
                                                       res.write(JSON.stringify(resdata));
                                                       res.end();
                                                   }
                                                   else {
                                                       console.log("update " + flights[0].flight + "'s flightManage state to 1");
                                                       var auctionid = getAuctionID(flights[0], type, stage);
                                                       var auctionflight = new auctionFlightManageModel({
                                                           flight: flights[0].flight,
                                                           date: flights[0].date,
                                                           origin: doc.origin,
                                                           O_code: doc.O_code,
                                                           destination: doc.destination,
                                                           D_code: doc.D_code,
                                                           departure: doc.departure,
                                                           landing: doc.landing,
                                                           auctionID: auctionid,
                                                           auctionType: type,
                                                           stageType: stage,
                                                           baseprice: basePrice,
                                                           auctionState: 0,
                                                           seatnum: seat,
                                                           timeLap: ADVANCED_TIMELAP
                                                       });
                                                       auctionflight.save(function (err) {
                                                           if(err){
                                                               console.log(err);
                                                               console.log(500 + ": Server error");
                                                               res.json(resdata);
                                                               res.end();
                                                           }
                                                           else {
                                                               var endDate = dateFormat(doc.date, doc.departure);
                                                               var dateLap = Date.parse(new Date(endDate)) - Date.parse(new Date());
                                                               var day = 0;
                                                               if (dateLap % (TIMELAP * 1000) === 0)
                                                                   day = dateLap / (TIMELAP * 1000) - 1;
                                                               else day = Math.floor(dateLap / (TIMELAP * 1000));
                                                               console.log("the advanced auction is divided into " + day + " days.");
                                                               if (day === 0) {
                                                                   console.log("Error: Advanced auction cannot start within one period's lap");
                                                                   res.json(resdata);
                                                                   res.end();
                                                               }
                                                               else {
                                                                   var option = {
                                                                       method: 'POST',
                                                                       uri: 'http://localhost:8001/advancedAuction',
                                                                       headers: {
                                                                           'Content-Type': 'application/json',
                                                                           'Agi-Token': token
                                                                       },
                                                                       json: {
                                                                           'flight': flights[0].flight,
                                                                           'auctionid': auctionid,
                                                                           'day': day,
                                                                           'seat': seat
                                                                       }
                                                                   };
                                                                   request.post(option, function (err, httpResponse, body) {
                                                                       if (err || httpResponse.statusCode !== 200) {
                                                                           console.log(err);
                                                                           console.log("Error: http request method get error at statuscode " + httpResponse.statusCode);
                                                                           res.json(resdata);
                                                                           res.end();
                                                                       }
                                                                       else if (httpResponse.statusCode === 200) {
                                                                           console.log("Advanced auction start success");
                                                                           resdata.status = 1;
                                                                           res.json(resdata);
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
                                   }
                                });
                            }
                        }
                        else if(type === 6){
                            if(flights.length !== 1){
                                console.log("Error: lottery auction configure params error");
                            }
                            else {
                                flightManageModel.findOne({
                                    flight: flights[0].flight,
                                    date: flights[0].date
                                }, function (err, docs) {
                                    if (err) {
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        if (docs === null) {
                                            console.log("404: " + "flight " + flights[0].flight + " not found on " + flights[0].date);
                                            res.json(resdata);
                                            res.end();
                                        }
                                        else {
                                            if (docs.state === 1) {
                                                console.log("Error: flight " + flights[0].flight + " have been set");
                                                resdata.repeat = 1;
                                                res.json(resdata);
                                                res.end();
                                            }
                                            else {
                                                flightManageModel.findOneAndUpdate({
                                                    flight: flights[0].flight,
                                                    date: flights[0].date
                                                }, {$set: {state: 1}}, function (err, doc) {
                                                    if (err) {
                                                        console.log(err);
                                                        console.log(500 + ": Server error");
                                                        res.json(resdata);
                                                        res.end();
                                                    }
                                                    else {
                                                        console.log("update " + flights[0].flight + "'s flightManage state to 1");
                                                        var auctionid = getAuctionID(flights[0], type, stage);
                                                        if(typeof(basePrice) === "undefined"){
                                                            basePrice = 0;
                                                        }
                                                        var auctionflight = new auctionFlightManageModel({
                                                            flight: flights[0].flight,
                                                            date: flights[0].date,
                                                            origin: doc.origin,
                                                            O_code: doc.O_code,
                                                            destination: doc.destination,
                                                            D_code: doc.D_code,
                                                            departure: doc.departure,
                                                            landing: doc.landing,
                                                            auctionID: auctionid,
                                                            auctionType: type,
                                                            stageType: stage,
                                                            baseprice: basePrice,
                                                            auctionState: 0,
                                                            seatnum: seat,
                                                            timeLap: LOT_TIMELAP
                                                        });
                                                        auctionflight.save(function (err) {
                                                            if (err) {
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                            else {
                                                                console.log("flight " + flights[0].flight + "'s lottery setting saved");
                                                                resdata.status = 1;
                                                                res.json(resdata);
                                                                res.end();
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        }
                                    }
                                });
                            }
                        }
                        else {
                            console.log("Error: type error");
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
    path: '/setAuctionFlights'
};
