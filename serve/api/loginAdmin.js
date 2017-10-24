/**
 * Created by hujinhua on 17-8-1.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var adminTokenSchema = new mongoose.Schema({
    id: {type: String},
    password: {type: String},
    name: {type:String},
    tel: {type: String},
    Token: {type: String}
},{collection:"userToken"});
var adminTokenModel = db.model("adminToken", adminTokenSchema,"adminToken");

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
    adminTokenModel.findOne(query, function (err, docs) {
        if(err){
            console.log(err);
            console.log(500 + ": Server error");
            resdata.result = -1;
            res.json(resdata);
            res.end();
        }
        else if(docs === null){
            resdata = {
                result: -1
            };
            res.json(resdata);
            res.end();
            console.log(404+": User not found");
        }
        else if(docs.password === pwd){
            var name = docs.name;
            var phone = docs.tel;
            var token = jwt.sign({
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
                id: id,
                password: pwd,
                timestamp: Date.parse(new Date())
            }, 'secret');
            adminTokenModel.update(query,{Token:token},function (err) {
                if(err)
                    console.log(err);
                else {
                    resdata = {
                        result: 1,
                        token: token,
                        name: name,
                        phone: phone
                    };
                    res.json(resdata);
                    res.end();
                }
            })
        }
        else {
            resdata = {
                result: -1
            };
            res.json(resdata);
            res.end();
            console.log(403+": User/Password not match");
        }
    });
});

module.exports = {
    router: router,
    path: '/loginAdmin'
};