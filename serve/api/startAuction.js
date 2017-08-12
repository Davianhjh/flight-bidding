/**
 * Created by hujinhua on 2017/6/13.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var Xinge = require('./Xinge');
var Xinge_Config = {
    access_id: 2100263276,
    secretKey: "ecc4c3ab199f1e5cca148e087d2ba0fd"
};

var xinge = new Xinge(Xinge_Config);

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    flight: { type:String },
    id: { type:String },
    biddingPrice: { type:Number },
    seat: { type:String },
    paymentState: { type:Boolean },
    paymentPrice:{ type:Number }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var flightInfoSchema = new mongoose.Schema({
    id: { type:String },
    name: { type:String },
    tel: { type:String },
    flight: { type:String },
    date: { type:String },
    userstatus: { type: Number }
},{collection:"flightInfo"});
var flightInfoModel = db.model("flightInfo", flightInfoSchema,"flightInfo");

var flightManageSchema = new mongoose.Schema({
    flight: { type:String },
    date: { type:String },
    state: { type:Number }
},{collection:"flightManage"});
var flightManageModel = db.model("flightMange", flightManageSchema,"flightManage");

var auctionParamSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight : { type:String },
    attentantUUID: { type:String },
    baseprice: { type:Number },
    timelap: { type:Number },
    seatnum: { type:Number },
    startTime: { type:Number },
    auctionType: { type: Number },
    auctionState: { type: Number },
    count: { type: Number }
},{collection:"auctionParam"});
var auctionParamModel = db.model("auctionParam", auctionParamSchema,"auctionParam");

var auctionFlightManageSchema = new mongoose.Schema({
    auctionID: { type:String },
    auctionType: { type:Number },
    auctionState: { type:Number },
    seatnum: { type:Number },
    date: { type:String }
},{collection:"auctionFlightManage"});
var auctionFlightManageModel = db.model("auctionFlightManage", auctionFlightManageSchema,"auctionFlightManage");

var userTokenSchema = new mongoose.Schema({
    Token: { type:String },
    name: { type:String },
    tel: { type:String },
    deviceToken: { type:String }
},{collection:"userToken"});
var userTokenModel = db.model("userToken", userTokenSchema,"userToken");

var serverTokenSchema = new mongoose.Schema({
    Token: { type:String }
},{collection:"serverToken"});
var serverTokenModel = db.model("serverToken", serverTokenSchema,"serverToken");
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

var TIMELAP = 180;              //timeLap here's to change

router.post('/', function (req, res, next) {
    var attendantID = "";
    var token = req.headers['agi-token'];
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var seatnum = req.body.seatnum;

    var resdata = {
        result: 1,
        auction: -1,
        timelap: -1
    };

    if(typeof(seatnum) === "undefined" || seatnum <= 0){
        console.log("seat number params error");
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.write(JSON.stringify(resdata));
        res.end();
        return;
    }

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
                jwt.verify(token, 'secret', function (err, decoded) {
                    if (err) {
                        console.log(err);
                        console.log(403 + ": Token is not valid");
                        resdata.result = -1;
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify(resdata));
                        res.end();
                    }
                    else {
                        attendantID = decoded.id;
                        auctionFlightManageModel.findOneAndUpdate({auctionID:auctionid}, {$set: {seatnum:seatnum, auctionState:1}}, {new:false}, function (err, lists) {
                            if(err){
                               console.log(err);
                               console.log(500 + ": Server error");
                               res.writeHead(200, {'Content-Type': 'application/json'});
                               res.write(JSON.stringify(resdata));
                               res.end();
                           }
                           else if (typeof(auctionid) === "undefined" || lists === null) {
                                console.log(403 + ": auctionID invalid params error");
                                res.writeHead(200, {'Content-Type': 'application/json'});
                                res.write(JSON.stringify(resdata));
                                res.end();
                                return;
                           }
                           else {
                               var auctionType = lists.auctionType;
                               var baseprice = lists.baseprice;
                               var date = lists.date;
                               //var timelap = lists[0].timelap;
                               var startTime = Date.parse(new Date());
                               var auctionData = new auctionParamModel({
                                   "auctionID": auctionid,
                                   "flight": flight,
                                   "attentantUUID": attendantID,
                                   "baseprice": baseprice,
                                   "timelap": TIMELAP,
                                   "seatnum": seatnum,
                                   "startTime": startTime,
                                   "auctionType": auctionType,
                                   "auctionState": 1,
                                   "count": 0
                               });

                               auctionParamModel.find({auctionID: auctionid}, function (error, docs) {
                                   if (error) {
                                       console.log(error);
                                       console.log(500 + ": Server error");
                                       res.writeHead(200, {'Content-Type': 'application/json'});
                                       res.write(JSON.stringify(resdata));
                                       res.end();
                                   }
                                   else {
                                       if (docs.length === 0) {
                                           auctionData.save(function (err) {
                                               if (err) {
                                                   console.log(err);
                                                   console.log(500 + ": Server error");
                                                   res.writeHead(200, {'Content-Type': 'application/json'});
                                                   res.write(JSON.stringify(resdata));
                                                   res.end();
                                               }
                                               else {
                                                   console.log('save success');
                                                   resdata.auction = 1;
                                                   resdata.timelap = TIMELAP;
                                                   res.writeHead(200, {'Content-Type': 'application/json'});
                                                   res.write(JSON.stringify(resdata));

                                                   flightInfoModel.update({flight:flight, date:date}, {userstatus:-1},{multi:true}, function (err) {
                                                      if(err){
                                                          console.log(err);
                                                          console.log(500 + ": Server error");
                                                          res.writeHead(200, {'Content-Type': 'application/json'});
                                                          res.write(JSON.stringify(resdata));
                                                          res.end();
                                                      }
                                                      else {
                                                          var updateState = function () {
                                                              return auctionParamModel.findOneAndUpdate({auctionID: auctionid}, {auctionState: 2}, {new:false}, function (err,list) {
                                                                  if (err)
                                                                      console.log(err);
                                                                  else {
                                                                      var seat = list.seatnum;
                                                                      var auctionType = list.auctionType;
                                                                      var flight = list.flight;
                                                                      auctionFlightManageModel.update({auctionID: auctionid}, {auctionState:2}, function (error) {
                                                                          if(error)
                                                                              console.log(error);
                                                                          else {
                                                                              console.log('update auctionState to 2');
                                                                              flightManageModel.update({state:0}, function (error) {
                                                                                  if(error)
                                                                                      console.log(error);
                                                                                  else {
                                                                                      console.log("update flight " + flight + "'s state to 2");
                                                                                      var Xinge_Option = {
                                                                                          device_token: "",
                                                                                          message_type: 1,
                                                                                          message: {
                                                                                              content:'',
                                                                                              title:''
                                                                                          },
                                                                                          action: {
                                                                                              action_type: 1,
                                                                                              activity: "com.agiview.flightupdating.client.ResultActivity"
                                                                                          },
                                                                                          path: "/v2/push/single_device"
                                                                                          // TO be added
                                                                                      };
                                                                                      var candidate = {};
                                                                                      var passenger = [];
                                                                                      var candidateID = [];
                                                                                      var winner = [];

                                                                                      if(auctionType !== 4) {
                                                                                          biddingResultModel.find({auctionID: auctionid}).sort({biddingPrice: -1}).exec(function (err, docs) {
                                                                                              if (err) {
                                                                                                  console.log(err);
                                                                                                  console.log(500 + ": Server error");
                                                                                                  res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                  res.write(JSON.stringify(resdata));
                                                                                              }
                                                                                              else {
                                                                                                  if (docs.length === 0) {
                                                                                                      console.log(404 + ": auctionID not found in auctionResult");
                                                                                                      res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                      res.write(JSON.stringify(resdata));
                                                                                                  }
                                                                                                  else {
                                                                                                      for (var i = 0; i < docs.length; i++) {
                                                                                                          if(i < seat)
                                                                                                              winner.push(docs[i].id);
                                                                                                          candidateID.push(docs[i].id);
                                                                                                      }
                                                                                                      flightInfoModel.find({id: {$in: winner}}, function (err, lists) {
                                                                                                          if (err) {
                                                                                                              console.log(err);
                                                                                                              console.log(500 + ": Server error");
                                                                                                              res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                              res.write(JSON.stringify(resdata));
                                                                                                          }
                                                                                                          else {
                                                                                                              for (var i = 0; i < docs.length && i < seat; i++) {
                                                                                                                  for (var j = 0; j < lists.length; j++) {
                                                                                                                      if (docs[i].id === lists[j].id) {
                                                                                                                          candidate = {
                                                                                                                              id: lists[j].id,
                                                                                                                              name: lists[j].name,
                                                                                                                              tel: lists[j].tel,
                                                                                                                              seat: docs[i].seat,
                                                                                                                              price: docs[i].biddingPrice.toString(),
                                                                                                                              paid: docs[i].paymentState
                                                                                                                          };
                                                                                                                          passenger.push(candidate);
                                                                                                                          break;
                                                                                                                      }
                                                                                                                  }
                                                                                                              }
                                                                                                              passenger.forEach(function (doc, index) {
                                                                                                                  userTokenModel.find({id:doc.id}, function (err, lists) {
                                                                                                                      if(err){
                                                                                                                          console.log("Error: " + err);
                                                                                                                      }
                                                                                                                      else {
                                                                                                                          Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                                          Xinge_Option.message.title = "Flight updating service message";
                                                                                                                          Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，以" + doc.price + "的价格，成功竞得商务舱位，请您通过app进行支付。";
                                                                                                                          xinge.send(Xinge_Option, function (err, result) {
                                                                                                                              if(err){
                                                                                                                                  console.log('ERROR: '+err);
                                                                                                                              }
                                                                                                                              console.log(result);
                                                                                                                          });
                                                                                                                      }
                                                                                                                  });
                                                                                                              });
                                                                                                              var failure = candidateID.slice(seat);
                                                                                                              failure.forEach(function (doc, index) {
                                                                                                                  userTokenModel.find({id:doc}, function (err, lists) {
                                                                                                                      if(err){
                                                                                                                          console.log("Error: " + err);
                                                                                                                      }
                                                                                                                      else {
                                                                                                                          Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                                          Xinge_Option.message.title = "Flight updating service message";
                                                                                                                          Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                                                          xinge.send(Xinge_Option, function (err, result) {
                                                                                                                              if(err){
                                                                                                                                  console.log('ERROR: '+err);
                                                                                                                              }
                                                                                                                              console.log(result);
                                                                                                                          });
                                                                                                                      }
                                                                                                                  });
                                                                                                              });
                                                                                                              console.log("finish sending today's all candidates");
                                                                                                          }
                                                                                                      });
                                                                                                  }
                                                                                              }
                                                                                          });
                                                                                      }
                                                                                      else {
                                                                                          biddingResultModel.find({auctionID: auctionid}).sort({biddingPrice: 1}).exec(function (err, docs) {
                                                                                              if (err) {
                                                                                                  console.log(err);
                                                                                                  console.log(500 + ": Server error");
                                                                                                  res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                  res.write(JSON.stringify(resdata));
                                                                                              }
                                                                                              else {
                                                                                                  if (docs.length === 0) {
                                                                                                      console.log(404 + ": auctionID not found in biddingResult");
                                                                                                      res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                      res.write(JSON.stringify(resdata));
                                                                                                  }
                                                                                                  else {
                                                                                                      for (var i = 0; i < docs.length; i++) {
                                                                                                          if(i < seat)
                                                                                                              winner.push(docs[i].id);
                                                                                                          candidateID.push(docs[i].id);
                                                                                                      }
                                                                                                      flightInfoModel.find({id: {$in: candidateID}}, function (err, lists) {
                                                                                                          if (err) {
                                                                                                              console.log(err);
                                                                                                              console.log(500 + ": Server error");
                                                                                                              res.writeHead(200, {'Content-Type': 'application/json'});
                                                                                                              res.write(JSON.stringify(resdata));
                                                                                                          }
                                                                                                          else {
                                                                                                              for (var i = 0; i < docs.length && i < seat; i++) {
                                                                                                                  for (var j = 0; j < lists.length; j++) {
                                                                                                                      if (docs[i].id === lists[j].id) {
                                                                                                                          candidate = {
                                                                                                                              id: lists[j].id,
                                                                                                                              name: lists[j].name,
                                                                                                                              tel: lists[j].tel,
                                                                                                                              seat: docs[i].seat,
                                                                                                                              price: docs[i].biddingPrice.toString(),
                                                                                                                              paid: docs[i].paymentState
                                                                                                                          };
                                                                                                                          passenger.push(candidate);
                                                                                                                          break;
                                                                                                                      }
                                                                                                                  }
                                                                                                              }
                                                                                                              passenger.forEach(function (doc, index) {
                                                                                                                  userTokenModel.find({id:doc.id}, function (err, lists) {
                                                                                                                      if(err){
                                                                                                                          console.log("Error: " + err);
                                                                                                                      }
                                                                                                                      else {
                                                                                                                          Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                                          Xinge_Option.message.title = "Flight updating service message";
                                                                                                                          Xinge_Option.message.content = "尊敬的乘客" + doc.name + "您好，您所竞拍的" + doc.flight + "号航班，以" + doc.price + "的价格，成功竞得超售补偿，请您登录APP查看。";
                                                                                                                          xinge.send(Xinge_Option, function (err, result) {
                                                                                                                              if(err){
                                                                                                                                  console.log('ERROR: '+err);
                                                                                                                              }
                                                                                                                              console.log(result);
                                                                                                                          });
                                                                                                                      }
                                                                                                                  });
                                                                                                              });

                                                                                                              var failure = candidateID.slice(seat);
                                                                                                              failure.forEach(function (doc, index) {
                                                                                                                  userTokenModel.find({id:doc}, function (err, lists) {
                                                                                                                      if(err){
                                                                                                                          console.log("Error: " + err);
                                                                                                                      }
                                                                                                                      else {
                                                                                                                          Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                                          Xinge_Option.message.title = "Flight updating service message";
                                                                                                                          Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得超售补偿，详情请登录app查看。";
                                                                                                                          xinge.send(Xinge_Option, function (err, result) {
                                                                                                                              if(err){
                                                                                                                                  console.log('ERROR: '+err);
                                                                                                                              }
                                                                                                                              console.log(result);
                                                                                                                          });
                                                                                                                      }
                                                                                                                  });
                                                                                                              });
                                                                                                              console.log("finish sending today's all candidates");
                                                                                                          }
                                                                                                      });
                                                                                                  }
                                                                                              }
                                                                                          });
                                                                                      }
                                                                                  }
                                                                              });
                                                                          }
                                                                      });
                                                                  }
                                                              });
                                                          };
                                                          setTimeout(updateState, TIMELAP * 1000);
                                                      }
                                                      res.end();
                                                   });
                                               }
                                           });
                                       }
                                       else {
                                           console.log(403 + ': repeated auction id save failure');
                                           res.writeHead(200, {'Content-Type': 'application/json'});
                                           res.write(JSON.stringify(resdata));
                                           res.end();
                                       }
                                   }
                               });
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
    path: '/startAuction'
};
