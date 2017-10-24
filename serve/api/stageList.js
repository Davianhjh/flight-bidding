/**
 * Created by hujinhua on 17-9-25.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
var async = require('async');
console.time('series');
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
    state: { type: Number }
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
    stageType: { type:Number },
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

function zeroFill (i) {
    return (i < 10 ? '0' : '') + i
}

var objectArraySort = function (keyName) {
    return function (objectN, objectM) {
        var valueN = objectN[keyName];
        var valueM = objectM[keyName];
        if (valueN < valueM) return -1;
        else if (valueN > valueM) return 1;
        else return 0
    }
};

router.get('/', function (req, res, next) {
    var adminID = "";
    var token = req.headers['agi-token'];
    var stageType = req.query.stage;
    var flight = req.query.flight;           // not necessary
    var day = req.query.day;                 // not necessary (the flights in several days)
    var resdata = {
        result: 1,
        flights: []
    };

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
                        var nowDate = new Date();
                        var nowDateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());
                        var nowTime = zeroFill(nowDate.getHours()) + ":" + zeroFill(nowDate.getMinutes());
                        var endDateStr = "";
                        var query = {state: 0};
                        if (typeof (day) === 'undefined')
                            endDateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate() + 3);
                        else endDateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate() + day);

                        if (typeof (flight) !== 'undefined') {
                            query = {state: 0,flight: flight};
                        }
                        if (typeof (stageType) === 'undefined'){
                            res.json(resdata);
                            res.end();
                        }
                        var condition;
                        switch (stageType){
                            case "1":
                                condition = {date: nowDateStr, stageType: 1};break;
                            case "2":
                                condition = {date: nowDateStr, stageType: 2};break;
                            case "3":
                                res.json(resdata);
                                res.end();
                                return;
                            default:
                                console.log("stageType param error");
                                res.json(resdata);
                                res.end();
                                return;
                        }
                        var flightArray1 = [];
                        var flightArray2 = [];
                        var flightUsed = [];
                        auctionFlightManageModel.find(condition, function (err, lists) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.json(resdata);
                                res.end();
                            }
                            else if (lists.length !== 0) {
                                lists.forEach(function (item) {
                                    var data = {
                                        flight: item.flight,
                                        origin: item.origin,
                                        O_code: item.O_code,
                                        destination: item.destination,
                                        D_code: item.D_code,
                                        date: item.date,
                                        departure: item.departure,
                                        landing: item.landing,
                                        type: item.auctionType.toString(),
                                        auctionState: item.auctionState.toString()
                                    };
                                    flightArray1.push(data);
                                    flightUsed.push(item.flight);
                                });
                                flightArray1.sort(objectArraySort('departure'));
                            }
                            flightManageModel.find(query)
                                .where("date").gte(nowDateStr)
                                .where("date").lte(endDateStr)
                                .where("departure").gte(nowTime)
                                .exec(function (err, docs) {
                                    if(err){
                                        console.log(err);
                                        console.log(500 + ": Server error");
                                        res.json(resdata);
                                        res.end();
                                    }
                                    else {
                                        docs.forEach(function (item) {
                                            if(!flightUsed.includes(item.flight)) {
                                                var data = {
                                                    flight: item.flight,
                                                    origin: item.origin,
                                                    O_code: item.O_code,
                                                    destination: item.destination,
                                                    D_code: item.D_code,
                                                    date: item.date,
                                                    departure: item.departure,
                                                    landing: item.landing,
                                                    type: "-1",
                                                    auctionState: "-1"
                                                };
                                                flightArray2.push(data);
                                            }
                                        });
                                        flightArray2.sort(objectArraySort('departure'));
                                        resdata.flights = flightArray1.concat(flightArray2);
                                        res.json(resdata);
                                        res.end();
                                    }
                                });
                        });
                    }
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/stageList'
};
