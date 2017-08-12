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
    id: { type:String },
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
    auctionID: { type:String },
    auctionType: { type:Number },
    baseprice: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number }
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

function getAuctionID(params, type) {
    var flight = params.flight;
    var date = params.date;
    var auctionID = date + flight + "TYPE" + type.toString();
    return auctionID;
}

function dateFormat(dateStr, timeStr) {
    var date = dateStr.slice(0,4) + '-' + dateStr.slice(4,6) + '-' + dateStr.slice(6) + ' ' + timeStr;
    return date;
}
var TIMELAP = 120;

router.post('/', function (req, res, next) {
    var adminID = "";
    var token = req.headers['agi-token'];
    var type = parseInt(req.body.type);
    var basePrice = req.body.price;
    var flights = req.body.flights;
    var seat = -1;
    var resdata = {
        result: 1,
        status: -1,
        repeat: 0
    };
    if(type!==1 && type!==2 && type!==3 && type!==4 && type!==5){
        console.log("Error: auctionType param error");
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resdata));
        res.end();
        return;
    }
    if(basePrice <= 0){
        console.log("Error: auction's base price param error");
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resdata));
        res.end();
        return;
    }
    if(typeof(req.body.seat) !== 'undefined'){
        seat = req.body.seat;
    }

    adminTokenModel.find({Token: token}, function (err, docs) {
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
                        adminID = decoded.id;
                        if(type === 1 || type === 2 || type === 3 || type === 4) {
                            async.series({
                                one: function (callback) {
                                    flights.forEach(function (item) {
                                        flightManageModel.find({flight:item.flight, date:item.date}, function (err, docs) {
                                            if(err){
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                            }
                                            else if(docs[0].state !== 0){
                                                callback(null, 1);
                                            }
                                            else {
                                                callback(null, 0);
                                            }
                                        });
                                    });
                                },
                                two: function(callback) {
                                    flights.forEach(function (item) {
                                        flightManageModel.find({
                                            flight: item.flight,
                                            date: item.date
                                        }, function (err, docs) {
                                            if (err) {
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                            }
                                            else if (docs[0].state !== 0) {
                                                console.log("Error: flight " + item.flight + "'s auction have been set");
                                            }
                                            else {
                                                var auctionid = getAuctionID(item, type);
                                                auctionFlightManageModel.find({auctionID: auctionid}, function (err, lists) {
                                                    if (err) {
                                                        console.log(err);
                                                        console.log(500 + ": Server error");
                                                    }
                                                    else if (lists.length === 0) {
                                                        var auctionflight = new auctionFlightManageModel({
                                                            flight: item.flight,
                                                            date: item.date,
                                                            auctionID: auctionid,
                                                            auctionType: type,
                                                            baseprice: basePrice,
                                                            auctionState: 0,
                                                            seatnum: seat
                                                        });
                                                        auctionflight.save(function (err) {
                                                            if (err) {
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                            }
                                                            else {
                                                                console.log("flight " + item.flight + "'s auction setting saved");
                                                                flightManageModel.update({
                                                                    flight: item.flight,
                                                                    date: item.date
                                                                }, {$set: {state: 1}}, function (err) {
                                                                    if (err) {
                                                                        console.log(err);
                                                                        console.log(500 + ": Server error");
                                                                    }
                                                                    else {
                                                                        console.log("update " + item.flight + "'s flightManage state to 1");
                                                                    }
                                                                })
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        auctionFlightManageModel.update({auctionID: auctionid}, {
                                                            $set: {
                                                                auctionType: type,
                                                                baseprice: basePrice
                                                            }
                                                        }, function (err) {
                                                            if (err) {
                                                                console.log(err);
                                                                console.log(500 + ": Server error");
                                                            }
                                                            else {
                                                                console.log("flight " + item.flight + "'s auction setting updated");
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    });
                                    callback(null, 1);
                                }
                                },function (err, result) {
                                    if(err){
                                        console.log(500 + ": Server error");
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                    else {
                                        resdata.repeat = result.one;
                                        resdata.status = result.two;
                                        res.writeHead(200, {'Content-Type': 'application/json'});
                                        res.write(JSON.stringify(resdata));
                                        res.end();
                                    }
                                }
                            );
                        }
                        else if(type === 5){
                            if(flights.length !== 1){
                                console.log("Error: Advanced auction configure params error");
                            }
                            else {
                                flightManageModel.find({flight:flights[0].flight, date:flights[0].date}, function (err, docs) {
                                   if(err){
                                       console.log(err);
                                       console.log(500 + ": Server error");
                                       res.writeHead(200, {'Content-Type': 'application/json'});
                                       res.write(JSON.stringify(resdata));
                                       res.end();
                                   }
                                   else {
                                       if(docs.length === 0){
                                           console.log("404: " + "flight " + flights[0].flight + " not found on " + flights[0].date);
                                           res.writeHead(200, {'Content-Type': 'application/json'});
                                           res.write(JSON.stringify(resdata));
                                           res.end();
                                       }
                                       else {
                                           if(docs[0].state === 1){
                                               console.log("Error: this advanced auction have been set");
                                               resdata.repeat = 1;
                                               res.writeHead(200, {'Content-Type': 'application/json'});
                                               res.write(JSON.stringify(resdata));
                                               res.end();
                                           }
                                           else {
                                               flightManageModel.update({flight:flights[0].flight, date:flights[0].date}, {$set: {state:1}}, function (err) {
                                                   if(err){
                                                       console.log(err);
                                                       console.log(500 + ": Server error");
                                                       res.writeHead(200, {'Content-Type': 'application/json'});
                                                       res.write(JSON.stringify(resdata));
                                                       res.end();
                                                   }
                                                   else {
                                                       var auctionid = getAuctionID(flights[0], type);
                                                       var auctionflight = new auctionFlightManageModel({
                                                           flight: flights[0].flight,
                                                           date: flights[0].date,
                                                           auctionID: auctionid,
                                                           auctionType: type,
                                                           baseprice: basePrice,
                                                           auctionState: 0,
                                                           seatnum: seat
                                                       });
                                                       auctionflight.save(function (err) {
                                                           if(err){
                                                               console.log(err);
                                                               console.log(500 + ": Server error");
                                                               res.writeHead(200, {'Content-Type': 'application/json'});
                                                               res.write(JSON.stringify(resdata));
                                                               res.end();
                                                           }
                                                           else {
                                                               var endDate = dateFormat(docs[0].date, docs[0].departure);
                                                               var dateLap = Date.parse(new Date(endDate)) - Date.parse(new Date());
                                                               var day = 0;
                                                               if (dateLap % (TIMELAP * 1000) === 0)
                                                                   day = dateLap / (TIMELAP * 1000) - 1;
                                                               else day = Math.floor(dateLap / (TIMELAP * 1000));
                                                               if (day === 0) {
                                                                   console.log("Error: Advanced auction cannot start within one period's lap");
                                                                   res.writeHead(200, {'Content-Type': 'application/json'});
                                                                   res.write(JSON.stringify(resdata));
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
                                                                       console.log(httpResponse.statusCode);
                                                                       if (err || httpResponse.statusCode !== 200) {
                                                                           console.log(err);
                                                                           console.log("Error: http request method get error at statuscode " + httpResponse.statusCode);
                                                                           res.writeHead(200, {'Content-Type': 'application/json'});
                                                                           res.write(JSON.stringify(resdata));
                                                                           res.end();
                                                                       }
                                                                       else if (httpResponse.statusCode === 200) {
                                                                           console.log("Advanced auction start success");
                                                                           console.log(body);
                                                                           resdata.status = 1;
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
                                   }
                                });
                            }
                        }
                        else {
                            console.log("Error: type error");
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
    path: '/setAuctionFlights'
};
