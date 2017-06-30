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

var serverTokenSchema = new mongoose.Schema({
    name: { type:String },
    tel: { type:String },
    imgurl: { type:String },
    Token: { type:String }
},{collection:"serverToken"});
var serverTokenModel = db.model("serverToken", serverTokenSchema,"serverToken");
var jwt = require('jsonwebtoken');

var router = require('express').Router();

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
                jwt.verify(token, 'secret', function (err, decoded) {
                    if (err) {
                        console.log(err);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify(resdata));
                        res.end();
                    }
                    attendantID = decoded.id;

                    var nowDate = new Date();
                    var dateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());

                    attentdantInfoModel.find({id:attendantID, date:dateStr}, function (err, docs) {
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
                                for (var i = 0; i < docs.length; i++) {
                                    var flightData = {
                                        flightno: docs[i].flight,
                                        departure: docs[i].origin,
                                        departurecode: docs[i].O_code,
                                        arrival: docs[i].destination,
                                        arrivalcode: docs[i].D_code,
                                        date: docs[i].date,
                                        auctionID: docs[i].auctionID
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
                        }
                    });
                });
            }
        }
    });
});

module.exports = {
    router: router,
    path: '/attendantInfo'
};