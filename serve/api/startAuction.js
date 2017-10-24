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
var expData = require("./expChart");

var biddingResultSchema = new mongoose.Schema({
    auctionID : { type:String },
    id: { type:String },
    flight: { type:String },
    biddingPrice: { type:Number },
    biddingTime: { type:Number },
    heat: { type: Number },
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
    date: { type:String }
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
    attendantUUID: { type:String },
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

var bodyParser = require('body-parser');

var router = require('express').Router();
router.use(bodyParser.json({limit: '1mb'}));
router.use(bodyParser.urlencoded({extended: true}));

router.post('/', function (req, res, next) {
    var token = req.headers['agi-token'];
    var flight = req.body.flight;
    var auctionid = req.body.auctionid;
    var seatnum = req.body.seatnum;
    var type = req.body.type;
    var stage = req.body.stage;
    var dateStr = req.body.date;

    var resdata = {
        result: 1,
        auction: -1,
        timelap: -1
    };
    if(typeof(seatnum) === "undefined" || parseInt(seatnum) <= 0){
        console.log("seat number params error");
        res.json(resdata);
        res.end();
        return;
    }
    if(typeof(auctionid) === "undefined"){
        auctionid = dateStr + flight + "TYPE" + type + "S" + stage.toString();
    }
    seatnum = parseInt(seatnum);

    auctionFlightManageModel.findOneAndUpdate({auctionID:auctionid}, {$set: {seatnum:seatnum, auctionState:1}}, {new:false}, function (err, lists) {
        if(err){
           console.log(err);
           console.log(500 + ": Server error");
           res.json(resdata);
           res.end();
       }
       else if (typeof(auctionid) === "undefined" || lists === null) {
            console.log(403 + ": auctionID invalid params error");
            res.json(resdata);
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
               "attendantUUID": "BACKEND",
               "baseprice": baseprice,
               "timelap": timelap,
               "seatnum": seatnum,
               "startTime": startTime,
               "auctionType": auctionType,
               "auctionState": 1,
               "count": 0
           });

           if(auctionType !== 5 && auctionType !== 6) {
               auctionParamModel.findOne({auctionID: auctionid}, function (error, docs) {
                   if (error) {
                       console.log(error);
                       console.log(500 + ": Server error");
                       res.json(resdata);
                       res.end();
                   }
                   else {
                       if (docs === null) {
                           auctionData.save(function (err) {
                               if (err) {
                                   console.log(err);
                                   console.log(500 + ": Server error");
                                   res.json(resdata);
                                   res.end();
                               }
                               else {
                                   console.log('save success');
                                   resdata.auction = 1;
                                   resdata.timelap = timelap;
                                   res.json(resdata);

                                   var updateState = function () {
                                       return auctionParamModel.findOneAndUpdate({auctionID: auctionid}, {auctionState: 2}, {new: false}, function (err, list) {
                                           if (err)
                                               console.log(err);
                                           else {
                                               var seat = list.seatnum;
                                               var auctionType = list.auctionType;
                                               var flight = list.flight;
                                               var basePrice = lists.baseprice;
                                               auctionFlightManageModel.update({auctionID: auctionid}, {auctionState: 2}, function (error) {
                                                   if (error)
                                                       console.log(error);
                                                   else {
                                                       console.log('update auctionState to 2');
                                                       flightManageModel.update({flight: flight, date:dateStr}, {state: 0}, function (error) {
                                                           if (error)
                                                               console.log(error);
                                                           else {
                                                               console.log("update flight " + flight + "'s state to 0");

                                                               var Xinge_Option = {
                                                                   device_token: "",
                                                                   message_type: 1,
                                                                   message: {
                                                                       content: '',
                                                                       title: ''
                                                                   },
                                                                   action: {
                                                                       action_type: 1,
                                                                       activity: "com.agiview.flightupdating.client.ResultActivity"
                                                                   },
                                                                   path: "/v2/push/single_device"
                                                                   // TO be added
                                                               };
                                                               var candidate = [];
                                                               var candidateID = [];
                                                               var secondPrice = 0;
                                                               var option, query;
                                                               if (auctionType === 4) {
                                                                   query = {
                                                                       auctionID: auctionid,
                                                                       biddingPrice: {$lte: basePrice}
                                                                   };
                                                                   option = {biddingPrice: -1}
                                                               }
                                                               else {
                                                                   query = {
                                                                       auctionID: auctionid,
                                                                       biddingPrice: {$gte: basePrice}
                                                                   };
                                                                   option = {biddingPrice: 1};
                                                               }
                                                               biddingResultModel.find(query)
                                                                   .sort(option)
                                                                   .exec(function (err, docs) {
                                                                       if (err) {
                                                                           console.log(err);
                                                                           console.log(500 + ": Server error");
                                                                       }
                                                                       else {
                                                                           if (docs.length === 0) {
                                                                               console.log(404 + ": no passenger won in the bidding");
                                                                               biddingResultModel.find({auctionID: auctionid})
                                                                                   .sort(option)
                                                                                   .exec(function (err, arr) {
                                                                                       if (err) {
                                                                                           console.log(err);
                                                                                           console.log(500 + ": Server error");
                                                                                       }
                                                                                       else if (arr.length === 0) {
                                                                                           console.log(404 + ": no passenger take part in the bidding");
                                                                                       }
                                                                                       else {
                                                                                           do {
                                                                                               var cell = arr[arr.length - 1].id;
                                                                                               if (!candidateID.includes(cell)) {
                                                                                                   candidateID.push(arr[arr.length - 1].id);
                                                                                               }
                                                                                               arr.pop();
                                                                                           } while (arr.length !== 0);
                                                                                           /*
                                                                                           candidateID.forEach(function (item) {
                                                                                               userTokenModel.findOne({id: item}, function (err, lists) {
                                                                                                   if (err) {
                                                                                                       console.log("Error: " + err);
                                                                                                   }
                                                                                                   else {
                                                                                                       Xinge_Option.device_token = lists.deviceToken;
                                                                                                       Xinge_Option.message.title = "Flight updating service message";
                                                                                                       Xinge_Option.message.content = "尊敬的乘客" + lists.name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                                       xinge.send(Xinge_Option, function (err, result) {
                                                                                                           if (err) {
                                                                                                               console.log('ERROR: ' + err);
                                                                                                           }
                                                                                                           console.log(result);
                                                                                                           candidateID = [];
                                                                                                           candidate = []
                                                                                                       });
                                                                                                   }
                                                                                               });
                                                                                           });
                                                                                           */
                                                                                       }
                                                                                   });
                                                                           }
                                                                           else {
                                                                               var tag = 0;
                                                                               do {
                                                                                   var cell = docs[docs.length - 1].id;
                                                                                   if (!candidateID.includes(cell)) {
                                                                                       candidateID.push(docs[docs.length - 1].id);
                                                                                       candidate.push(docs[docs.length - 1]);
                                                                                       if (tag < seat)
                                                                                           tag++;
                                                                                       else if (tag === seat)
                                                                                           secondPrice = docs[docs.length - 1].biddingPrice;
                                                                                   }
                                                                                   docs.pop();
                                                                               } while (docs.length !== 0);
                                                                               if (secondPrice === 0) {
                                                                                   secondPrice = basePrice;
                                                                               }

                                                                               candidate.forEach(function (item, index) {
                                                                                   if (index < seat) {
                                                                                       flightInfoModel.find({
                                                                                           id: item.id,
                                                                                           flight: flight,
                                                                                           date: date
                                                                                       }, function (err, arr) {
                                                                                           if (err) {
                                                                                               console.log(err);
                                                                                               console.log(500 + ": Server error");
                                                                                           }
                                                                                           else {
                                                                                               var paymentPrice;
                                                                                               if (auctionType === 2)
                                                                                                   paymentPrice = secondPrice;
                                                                                               else paymentPrice = item.biddingPrice;
                                                                                               /*
                                                                                               userTokenModel.findOne({id: item.id}, function (err, lists) {
                                                                                                   if (err) {
                                                                                                       console.log("Error: " + err);
                                                                                                   }
                                                                                                   else {
                                                                                                       Xinge_Option.device_token = lists.deviceToken;
                                                                                                       Xinge_Option.message.title = "Flight updating service message";
                                                                                                       Xinge_Option.message.content = "尊敬的乘客" + lists.name + "您好，您所竞拍的" + flight + "号航班，以" + paymentPrice + "的价格，成功竞得商务舱位，请您通过app进行支付。";
                                                                                                       xinge.send(Xinge_Option, function (err, result) {
                                                                                                           if (err) {
                                                                                                               console.log('ERROR: ' + err);
                                                                                                           }
                                                                                                           console.log(result);
                                                                                                       });
                                                                                                   }
                                                                                               });
                                                                                               */
                                                                                               auctionResultModel.create({
                                                                                                   auctionID: auctionid,
                                                                                                   flight: flight,
                                                                                                   id: item.id,
                                                                                                   name: arr[0].name,
                                                                                                   tel: arr[0].tel,
                                                                                                   seat: arr[0].seat,
                                                                                                   price: paymentPrice,
                                                                                                   paid: item.paymentState
                                                                                               }, function (err) {
                                                                                                   if (err) {
                                                                                                       console.log(err);
                                                                                                       console.log(500 + ": Server error");
                                                                                                   }
                                                                                                   else {
                                                                                                       console.log("auctionResult saved");
                                                                                                       candidateID = [];
                                                                                                       candidate = [];
                                                                                                       if (auctionType === 3) {
                                                                                                           delete expData.previous_data[auctionid];
                                                                                                       }
                                                                                                   }
                                                                                               });
                                                                                           }
                                                                                       });
                                                                                   }
                                                                                   else {
                                                                                       /*
                                                                                       userTokenModel.findOne({id: item.id}, function (err, lists) {
                                                                                           if (err) {
                                                                                               console.log("Error: " + err);
                                                                                           }
                                                                                           else {
                                                                                               Xinge_Option.device_token = lists.deviceToken;
                                                                                               Xinge_Option.message.title = "Flight updating service message";
                                                                                               Xinge_Option.message.content = "尊敬的乘客" + lists.name + "您好，您所竞拍的" + flight + "号航班，很遗憾未能竞得商务舱位，详情请登录app查看。";
                                                                                               xinge.send(Xinge_Option, function (err, result) {
                                                                                                   if (err) {
                                                                                                       console.log('ERROR: ' + err);
                                                                                                   }
                                                                                                   console.log(result);
                                                                                                   candidateID = [];
                                                                                                   candidate = []
                                                                                               });
                                                                                           }
                                                                                       });
                                                                                       */
                                                                                   }
                                                                               });
                                                                           }
                                                                       }
                                                                   });
                                                           }
                                                       });
                                                   }
                                               });
                                           }
                                       });
                                   };
                                   setTimeout(updateState, timelap * 1000);
                                   res.end();
                               }
                           });
                       }
                       else {
                           console.log(403 + ': repeated auction id save failure');
                           res.json(resdata);
                           res.end();
                       }
                   }
               });
           }
           else {
               console.log("Error auction start API");
               res.json(resdata);
               res.end();
           }
       }
    });
});

module.exports = {
    router: router,
    path: '/startAuction'
};
