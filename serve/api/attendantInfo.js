/**
 * Created by hujinhua on 17-6-29.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var attendantInfoSchema = new mongoose.Schema({
    id: { type:String },
    flight: { type:String },
    origin: { type:String },
    O_code: { type:String },
    destination: { type:String },
    D_code: { type:String },
    date: { type:String },
    auctionID: { type: String }
},{collection:"flightInfo"});
var attentdantInfoModel = db.model("attendantInfo", attendantInfoSchema,"attendantInfo");

var auctionFlightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    auctionType: { type:Number },
    baseprice: { type:Number },
    auctionID: { type:String },
    auctionState: { type:Number },
    seatnum: { type:Number }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

var serverTokenSchema = new mongoose.Schema({
    name: { type:String },
    tel: { type:String },
    imgurl: { type:String },
    Token: { type:String }
},{collection:"serverToken"});
var serverTokenModel = db.model("serverToken", serverTokenSchema,"serverToken");
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

var timelap = 180;

function zeroFill (i) {
    return (i < 10 ? '0' : '') + i
}

router.post('/', function (req, res, next) {
    var attendantID = "";
    var token = req.headers['agi-token'];
    var type = req.body.type;
    var resdata = {
        result: 1,
        person: {},
        flights: []
    };

    serverTokenModel.find({Token: token}, function (err, docs) {
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
                var name = docs[0].name;
                var tel = docs[0].tel;
                var imgurl = docs[0].imgurl;

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
                        attendantID = decoded.id;
                        var TypeArray = [];
                        var nowDate = new Date();
                        var dateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());
                        var dateFormat = nowDate.getFullYear() + "-" + zeroFill(nowDate.getMonth() + 1) + "-" + zeroFill(nowDate.getDate());

                        if(type === "2")
                            TypeArray.push(4);
                        else if(type === "1"){
                            TypeArray.push(1);
                            TypeArray.push(2);
                            TypeArray.push(3);
                        }
                        else {
                            console.log(403 + ": type param error ");
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.write(JSON.stringify(resdata));
                            res.end();
                            return;
                        }

                        attentdantInfoModel.find({id: attendantID, date: dateStr})
                            .exec(function (err, docs) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if (docs.length === 0) {
                                    console.log(404 + ": Attendant not existed on today's flight");
                                    resdata.person = {
                                        name: name,
                                        tel: tel,
                                        imgurl: imgurl
                                    };
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
                                        .where("auctionType").in(TypeArray)
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
                                                    resdata.person = {
                                                        name: name,
                                                        tel: tel,
                                                        imgurl: imgurl
                                                    };
                                                    console.log("Attendant have no type " + type + " auction flights today");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    for(var i=0; i < lists.length; i++){
                                                        var auctionState = 1;
                                                        for(var j=0; j < docs.length; j++){
                                                            if(lists[i].flight === docs[j].flight){
                                                                if (lists[i].auctionState === 1)
                                                                    auctionState = 2;
                                                                else if (lists[i].auctionState === 2)
                                                                    auctionState = 0;

                                                                var flightData = {
                                                                    flightno: docs[j].flight,
                                                                    departure: docs[j].origin,
                                                                    departurecode: docs[j].O_code,
                                                                    arrival: docs[j].destination,
                                                                    arrivalcode: docs[j].D_code,
                                                                    date: dateFormat,
                                                                    auctionID: lists[i].auctionID,
                                                                    auctionState: auctionState.toString(),
                                                                    auctionType: lists[i].auctionType.toString(),
                                                                    seatnum: lists[i].seatnum.toString(),
                                                                    time: timelap
                                                                };
                                                                break;
                                                            }
                                                        }
                                                        flights.push(flightData);
                                                    }
                                                    resdata.person = {
                                                        name: name,
                                                        tel: tel,
                                                        imgurl: imgurl
                                                    };
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


router.get('/', function (req, res, next) {
    var attendantID = "";
    var token = req.headers['agi-token'];
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var resdata = {
        result: 1,
        person: {},
        flights: []
    };

    serverTokenModel.find({Token: token}, function (err, docs) {
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
                var name = docs[0].name;
                var tel = docs[0].tel;
                var imgurl = docs[0].imgurl;
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
                        attendantID = decoded.id;

                        var nowDate = new Date();
                        var dateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());
                        var dateFormat = nowDate.getFullYear() + "-" + zeroFill(nowDate.getMonth() + 1) + "-" + zeroFill(nowDate.getDate());

                        attentdantInfoModel.find({
                            id: attendantID,
                            date: dateStr,
                            flight: flight
                        }, function (err, docs) {
                            if (err) {
                                console.log(err);
                                console.log(500 + ": Server error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                            }
                            else {
                                if (docs.length === 0) {
                                    console.log(404 + ": Attendant not existed on today's flight");
                                    resdata.result = 1;
                                    resdata.person = {
                                        name: name,
                                        tel: tel,
                                        imgurl: imgurl
                                    };
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    var flights = [];
                                    auctionFlightManageModel.find({auctionID:auctionid, date:dateStr})
                                        .exec(function (err, lists) {
                                            if(err){
                                                console.log(err);
                                                console.log(500 + ": Server error");
                                                res.writeHead(200, {'Content-Type': 'application/json'});
                                                res.write(JSON.stringify(resdata));
                                                res.end();
                                            }
                                            else {
                                                if(lists.length === 0){
                                                    resdata.person = {
                                                        name: name,
                                                        tel: tel,
                                                        imgurl: imgurl
                                                    };
                                                    console.log(403 + ": attendant auctionID invalid params error");
                                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                                    res.write(JSON.stringify(resdata));
                                                    res.end();
                                                }
                                                else {
                                                    var auctionState = 1;
                                                    if (lists[0].auctionState === 1)
                                                        auctionState = 2;
                                                    else if (lists[0].auctionState === 2)
                                                        auctionState = 0;
                                                    var flightData = {
                                                        flightno: docs[0].flight,
                                                        departure: docs[0].origin,
                                                        departurecode: docs[0].O_code,
                                                        arrival: docs[0].destination,
                                                        arrivalcode: docs[0].D_code,
                                                        date: dateFormat,
                                                        auctionID: lists[0].auctionID,
                                                        auctionState: auctionState.toString(),
                                                        auctionType: lists[0].auctionType.toString(),
                                                        seatnum: lists[0].seatnum.toString(),
                                                        time: timelap
                                                    };
                                                    flights.push(flightData);
                                                    resdata.person = {
                                                        name: name,
                                                        tel: tel,
                                                        imgurl: imgurl
                                                    };
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
    path: '/attendantInfo'
};