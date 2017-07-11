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

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionState: { type:Number },
    seatnum: { type:Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

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

router.get('/', function (req, res, next) {
    var attendantID = "";
    var token = req.headers['agi-token'];
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

                        attentdantInfoModel.find({id: attendantID, date: dateStr}, function (err, docs) {
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
                                                var auctionState = 1;
                                                var seatnum = -1;
                                                for (var j = 0; j < lists.length; j++) {
                                                    if (docs[i].auctionID === lists[j].auctionID) {
                                                        if (lists[j].auctionState === 1)
                                                            auctionState = 2;
                                                        else if (lists[j].auctionState === 2)
                                                            auctionState = 0;
                                                        seatnum = lists[j].seatnum;
                                                        break;
                                                    }
                                                }
                                                var flightData = {
                                                    flightno: docs[i].flight,
                                                    departure: docs[i].origin,
                                                    departurecode: docs[i].O_code,
                                                    arrival: docs[i].destination,
                                                    arrivalcode: docs[i].D_code,
                                                    date: docs[i].date,
                                                    auctionID: docs[i].auctionID,
                                                    auctionState: auctionState.toString(),
                                                    seatnum: seatnum.toString(),
                                                    time: timelap
                                                };
                                                flights.push(flightData);
                                            }
                                            resdata.result = 1;
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


router.post('/', function (req, res, next) {
    var attendantID = "";
    var token = req.headers['agi-token'];
    var flight = req.body.flight;
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
                                    var auctionState = -1;
                                    var seatnum = -1;
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
                                                if (doc[0].auctionState === 1)
                                                    auctionState = 2;
                                                else if (doc[0].auctionState === 2)
                                                    auctionState = 0;
                                                seatnum = doc[0].seatnum;
                                            }
                                            var flightData = {
                                                flightno: docs[0].flight,
                                                departure: docs[0].origin,
                                                departurecode: docs[0].O_code,
                                                arrival: docs[0].destination,
                                                arrivalcode: docs[0].D_code,
                                                date: docs[0].date,
                                                auctionID: docs[0].auctionID,
                                                auctionState: auctionState.toString(),
                                                seatnum: seatnum.toString(),
                                                time: timelap
                                            };
                                            flights.push(flightData);
                                            resdata.result = 1;
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