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
    paymentState: { type:Boolean }
},{collection:"biddingResult"});
var biddingResultModel = db.model("biddingResult", biddingResultSchema,"biddingResult");

var auctionResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    flight: { type:String },
    name: { type:String },
    id: { type:String },
    tel: { type:String },
    seat: { type:String },
    price: { type:String },
    paid: { type:Boolean }
},{collection:"auctionResult"});
var auctionResultModel = db.model("auctionResult", auctionResultSchema,"auctionResult");

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
    date: { type:String },
    timeLap: { type:Number },
    baseprice: { type:Number }
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

router.post('/', function (req, res, next) {
    var attendantID = "";
    var token = req.headers['agi-token'];
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var seatnum = req.body.seatnum;
    var type = req.body.type;
    var dateStr = req.body.date;

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

    if(typeof(auctionid) === "undefined"){
        auctionid = dateStr + flight + "TYPE" + type;
    }

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
           var timelap = lists.timeLap;
           var startTime = Date.parse(new Date());
           var auctionData = new auctionParamModel({
               "auctionID": auctionid,
               "flight": flight,
               "attentantUUID": "BACKEND",
               "baseprice": baseprice,
               "timelap": timelap,
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
                               resdata.timelap = timelap;
                               res.writeHead(200, {'Content-Type': 'application/json'});
                               res.write(JSON.stringify(resdata));

                               flightInfoModel.update({flight:flight, date:date}, {userstatus:-1},{multi:true}, function (err) {
                                  if(err){
                                      console.log(err);
                                      console.log(500 + ": Server error");
                                  }
                                  else {
                                      console.log("userstatus updated");
                                      var updateState = function () {
                                          return auctionParamModel.findOneAndUpdate({auctionID: auctionid}, {auctionState: 2}, {new:false}, function (err,list) {
                                              if (err)
                                                  console.log(err);
                                              else {
                                                  var seat = list.seatnum;
                                                  var auctionType = list.auctionType;
                                                  var flight = list.flight;
                                                  var basePrice = lists.baseprice;
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
                                                                      biddingResultModel.find({auctionID: auctionid})
                                                                          .where("biddingPrice").gte(basePrice)
                                                                          .sort({biddingPrice: -1})
                                                                          .exec(function (err, docs) {
                                                                              if (err) {
                                                                                  console.log(err);
                                                                                  console.log(500 + ": Server error");
                                                                              }
                                                                              else {
                                                                                  if (docs.length === 0) {
                                                                                      console.log(404 + ": no passenger won the bidding");
                                                                                  }
                                                                                  else {
                                                                                      for (var i = 0; i < docs.length; i++) {
                                                                                          if (i < seat)
                                                                                              winner.push(docs[i].id);
                                                                                          candidateID.push(docs[i].id);
                                                                                      }
                                                                                      flightInfoModel.find({id: {$in: winner}}, function (err, lists) {
                                                                                          if (err) {
                                                                                              console.log(err);
                                                                                              console.log(500 + ": Server error");
                                                                                          }
                                                                                          else {
                                                                                              var paymentPrice = 0;
                                                                                              for (var i = 0; i < docs.length && i < seat; i++) {
                                                                                                  for (var j = 0; j < lists.length; j++) {
                                                                                                      if (docs[i].id === lists[j].id) {
                                                                                                          paymentPrice = docs[i].biddingPrice;
                                                                                                          if (auctionType === 2) {
                                                                                                              if (seatnum < docs.length)
                                                                                                                  paymentPrice = docs[seatnum].biddingPrice;
                                                                                                              else {
                                                                                                                  paymentPrice = basePrice;
                                                                                                              }
                                                                                                          }
                                                                                                          candidate = {
                                                                                                              auctionID: auctionid,
                                                                                                              flight: flight,
                                                                                                              id: lists[j].id,
                                                                                                              name: lists[j].name,
                                                                                                              tel: lists[j].tel,
                                                                                                              seat: docs[i].seat,
                                                                                                              price: paymentPrice,
                                                                                                              paid: docs[i].paymentState
                                                                                                          };
                                                                                                          passenger.push(candidate);
                                                                                                          break;
                                                                                                      }
                                                                                                  }
                                                                                              }
                                                                                              passenger.forEach(function (doc, index) {
                                                                                                  userTokenModel.find({id: doc.id}, function (err, lists) {
                                                                                                      if (err) {
                                                                                                          console.log("Error: " + err);
                                                                                                      }
                                                                                                      else {
                                                                                                          Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                          Xinge_Option.message.title = "Flight updating service message";
                                                                                                          Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，以" + doc.price + "的价格，成功竞得商务舱位，请您通过app进行支付。";
                                                                                                          xinge.send(Xinge_Option, function (err, result) {
                                                                                                              if (err) {
                                                                                                                  console.log('ERROR: ' + err);
                                                                                                              }
                                                                                                              console.log(result);
                                                                                                          });
                                                                                                      }
                                                                                                  });
                                                                                              });
                                                                                              var failure = candidateID.slice(seat);
                                                                                              failure.forEach(function (doc, index) {
                                                                                                  userTokenModel.find({id: doc}, function (err, lists) {
                                                                                                      if (err) {
                                                                                                          console.log("Error: " + err);
                                                                                                      }
                                                                                                      else {
                                                                                                          Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                          Xinge_Option.message.title = "Flight updating service message";
                                                                                                          Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                                          xinge.send(Xinge_Option, function (err, result) {
                                                                                                              if (err) {
                                                                                                                  console.log('ERROR: ' + err);
                                                                                                              }
                                                                                                              console.log(result);
                                                                                                          });
                                                                                                      }
                                                                                                  });
                                                                                              });
                                                                                              console.log("finish sending today's all candidates");

                                                                                              auctionResultModel.collection.insert(passenger, function (err, array) {
                                                                                                  if (err) {
                                                                                                      console.log(err);
                                                                                                      console.log(500 + ": Server error");
                                                                                                  }
                                                                                                  else {
                                                                                                      console.log("auctionResult saved");
                                                                                                  }
                                                                                              });
                                                                                          }
                                                                                      });
                                                                                  }
                                                                              }
                                                                          });
                                                                  }
                                                                  else {
                                                                      biddingResultModel.find({auctionID: auctionid})
                                                                          .where("biddingPrice").lte(basePrice)
                                                                          .sort({biddingPrice: 1})
                                                                          .exec(function (err, docs) {
                                                                              if (err) {
                                                                                  console.log(err);
                                                                                  console.log(500 + ": Server error");
                                                                              }
                                                                              else {
                                                                                  if (docs.length === 0) {
                                                                                      console.log(404 + ": no passenger won the bidding");
                                                                                  }
                                                                                  else {
                                                                                      for (var i = 0; i < docs.length; i++) {
                                                                                          if (i < seat)
                                                                                              winner.push(docs[i].id);
                                                                                          candidateID.push(docs[i].id);
                                                                                      }
                                                                                      flightInfoModel.find({id: {$in: winner}}, function (err, lists) {
                                                                                          if (err) {
                                                                                              console.log(err);
                                                                                              console.log(500 + ": Server error");
                                                                                          }
                                                                                          else {
                                                                                              var paymentPrice = 0;
                                                                                              for (var i = 0; i < docs.length && i < seat; i++) {
                                                                                                  for (var j = 0; j < lists.length; j++) {
                                                                                                      if (docs[i].id === lists[j].id) {
                                                                                                          paymentPrice = docs[i].biddingPrice;
                                                                                                          if (auctionType === 2) {
                                                                                                              if (seatnum >= docs.length || (seatnum < docs.length && docs[seatnum] < basePrice))
                                                                                                                  paymentPrice = basePrice;
                                                                                                              else {
                                                                                                                  paymentPrice = docs[seatnum].biddingPrice;
                                                                                                              }
                                                                                                          }
                                                                                                          candidate = {
                                                                                                              auctionID: auctionid,
                                                                                                              flight: flight,
                                                                                                              id: lists[j].id,
                                                                                                              name: lists[j].name,
                                                                                                              tel: lists[j].tel,
                                                                                                              seat: docs[i].seat,
                                                                                                              price: paymentPrice,
                                                                                                              paid: docs[i].paymentState
                                                                                                          };
                                                                                                          passenger.push(candidate);
                                                                                                          break;
                                                                                                      }
                                                                                                  }
                                                                                              }
                                                                                              passenger.forEach(function (doc, index) {
                                                                                                  userTokenModel.find({id: doc.id}, function (err, lists) {
                                                                                                      if (err) {
                                                                                                          console.log("Error: " + err);
                                                                                                      }
                                                                                                      else {
                                                                                                          Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                          Xinge_Option.message.title = "Flight updating service message";
                                                                                                          Xinge_Option.message.content = "尊敬的乘客" + doc.name + "您好，您所竞拍的" + doc.flight + "号航班，以" + doc.price + "的价格，成功竞得超售补偿，请您登录APP查看。";
                                                                                                          xinge.send(Xinge_Option, function (err, result) {
                                                                                                              if (err) {
                                                                                                                  console.log('ERROR: ' + err);
                                                                                                              }
                                                                                                              console.log(result);
                                                                                                          });
                                                                                                      }
                                                                                                  });
                                                                                              });
                                                                                              var failure = candidateID.slice(seat);
                                                                                              failure.forEach(function (doc, index) {
                                                                                                  userTokenModel.find({id: doc}, function (err, lists) {
                                                                                                      if (err) {
                                                                                                          console.log("Error: " + err);
                                                                                                      }
                                                                                                      else {
                                                                                                          Xinge_Option.device_token = lists[0].deviceToken;
                                                                                                          Xinge_Option.message.title = "Flight updating service message";
                                                                                                          Xinge_Option.message.content = "尊敬的乘客" + lists[0].name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得超售补偿，详情请登录app查看。";
                                                                                                          xinge.send(Xinge_Option, function (err, result) {
                                                                                                              if (err) {
                                                                                                                  console.log('ERROR: ' + err);
                                                                                                              }
                                                                                                              console.log(result);
                                                                                                          });
                                                                                                      }
                                                                                                  });
                                                                                              });
                                                                                              console.log("finish sending today's all candidates");

                                                                                              auctionResultModel.collection.insert(passenger, function (err, array) {
                                                                                                  if (err) {
                                                                                                      console.log(err);
                                                                                                      console.log(500 + ": Server error");
                                                                                                  }
                                                                                                  else {
                                                                                                      console.log("auctionResult saved");
                                                                                                  }
                                                                                              });
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
                                      setTimeout(updateState, timelap * 1000);
                                  }
                                  res.end();
                               });
                           }
                       });
                   }
                   else {
                       console.log(403 + ': repeated auction id save failure');
                       res.write(JSON.stringify(resdata));
                       res.end();
                   }
               }
           });
       }
    });
});

module.exports = {
    router: router,
    path: '/startAuction'
};
