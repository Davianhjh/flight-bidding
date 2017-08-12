/**
 * Created by hujinhua on 17-8-1.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
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
    state: { type: Number }
},{collection:"flightManage"});
var flightManageModel = db.model("flightMange", flightManageSchema,"flightManage");

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

router.get('/', function (req, res, next) {
    var adminID = "";
    var token = req.headers['agi-token'];
    var flight = req.query.flight;
    var day = req.query.day;
    var resdata = {
        result: 1,
        flights: []
    };

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
                        var nowDate = new Date();
                        var nowDateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate());
                        var nowTime = zeroFill(nowDate.getHours()) + ":" + zeroFill(nowDate.getMinutes());
                        var endDateStr = "";
                        var query = {};
                        if(typeof (day) === 'undefined')
                            endDateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate() + 3);
                        else endDateStr = nowDate.getFullYear() + zeroFill(nowDate.getMonth() + 1) + zeroFill(nowDate.getDate() + day);

                        if(typeof (flight) !== 'undefined'){
                            query = {flight:flight};
                        }

                        flightManageModel.find(query,{_id:0})
                            .where("departure").gt(nowTime)
                            .where("date").gte(nowDateStr)
                            .where("date").lte(endDateStr)
                            .exec(function (err, docs) {
                                if(err){
                                    console.log(err);
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    for(var i=0;i<docs.length;i++){
                                        resdata.flights.push(docs[i]);
                                    }
                                    //console.log(resdata);
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
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
    path: '/adminInfo'
};