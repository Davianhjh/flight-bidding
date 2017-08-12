/**
 * Created by hujinhua on 17-6-26.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var userTokenSchema = new mongoose.Schema({
    id: {type: String},
    password: {type: String},
    name: {type:String},
    tel: {type: String},
    Token: {type: String},
    deviceToken: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");

var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));


router.get('/', function (req, res, next) {
    var id = req.query.username;
    var pwd = req.query.password;
    var query = {id:id};
    var resdata = {};
    userTokenModel.find(query, function (err, docs) {
        if(docs.length === 0){
            resdata = {
                result: -1
            };
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resdata));
            res.end();
            console.log(404+": User not found");
        }
        else if(docs[0].password === pwd){
            var name = docs[0].name;
            var phone = docs[0].tel;
            var token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
                id: id,
                password: pwd,
                timestamp: Date.parse(new Date())
            }, 'secret');
            userTokenModel.update(query,{Token:token},function (err) {
                if(err)
                    console.log(err);
                else {
                    resdata = {
                        result: 1,
                        token: token,
                        name: name,
                        phone: phone
                    };
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(resdata));
                    res.end();
                }
            })
        }
        else {
            resdata = {
                result: -1
            };
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.write(JSON.stringify(resdata));
            res.end();
            console.log(403+": User/Password not match");
        }
    });
});

router.post('/', function (req, res, next) {
    var passengerID = "";
    var token = req.headers['agi-token'];
    var deviceToken = req.body.devicetoken;
    var resdata = {
        result: 1,
        devicetoken: -1
    };

    userTokenModel.find({Token: token}, function (err, docs) {
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
                        passengerID = decoded.id;

                        if(docs[0].deviceToken === ''){
                            userTokenModel.update({Token:token}, {deviceToken:deviceToken}, function (err) {
                                if(err){
                                    console.log(err);
                                    console.log(500 + ": Server error");
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                                else {
                                    console.log("deviceToken saved");
                                    resdata.devicetoken = 1;
                                    res.writeHead(200, {'Content-Type': 'application/json'});
                                    res.write(JSON.stringify(resdata));
                                    res.end();
                                }
                            });
                        }
                        else {
                            console.log(passengerID + "'s deviceToken already exist");
                            resdata.devicetoken = 0;
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
    path: '/loginPassenger'
};