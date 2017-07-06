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
    Token: {type: String}
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");

var router = require('express').Router();
var jwt = require('jsonwebtoken');


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

module.exports = {
    router: router,
    path: '/loginPassenger'
};