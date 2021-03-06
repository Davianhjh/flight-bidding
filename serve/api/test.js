const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
var LOTTERY_POOL = {};
var BASEPRICE_SWITCH = false;
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var Xinge = require('../api/Xinge');
var Xinge_Config = {
    access_id: 2100263276,
    secretKey: "ecc4c3ab199f1e5cca148e087d2ba0fd"
};

var xinge = new Xinge(Xinge_Config);

var lotteryResultSchema = new mongoose.Schema({
    auctionID: { type:String },
    id: { type:String },
    flight: { type:String },
    seat: { type:String },
    biddingPrice: { type:Number },
    lotterynum: { type:Number },
    timeStamp: { type:Number },
    paymentState: { type:Boolean },
    luckyRegion: { type:Array },
    hit: { type:Boolean }
}, {collection:"lotteryResult"});
var lotteryResultModel = db.model("lotteryResult", lotteryResultSchema,"lotteryResult");

var router = require('express').Router();

function getParticipateRegion(arr) {
    var str = [];
    for(var i=0;i<arr.length;i++){
        for(var j=0;j<arr[i].length;j++) {
            str.push(arr[i][j]);
        }
    }
    return str;
}

function getLuckyPerson(region, luckynum) {
    for(var i=0;i<region.length;i++){
        if(region[i] === luckynum)
            return true;
    }
    return false;
}

function zeroFill (i) {
    if(i<10)
        return '000' + i;
    else if(i<100)
        return '00' + i;
    else if(i<1000)
        return '0' + i;
    else return i;
}

function getUserID(i){
    var userID='Agiview' + zeroFill(i);
    return userID;
}

router.get('/', function (req, res, next) {
    var candidateID = [];
    var LUCKYID = "";
    var auctionid = "20170818CZ6605LOT6";
    var LUCKYNUM = 83;
    var arr = [];
    var j = 10;
    var k = 0;
    for(var i=0;i<10;i++){
        if(i%2 === 1) {
            k=2;
            j=Math.pow(i,2);
        }
        else {
            k=1;
            j=i;
        }
        var tmp = {
            item1:k,
            item2:j
        };
        arr.push(tmp);
    }
    //console.log(arr);
    var objectArraySort = function (keyName) {
        return function (objectN, objectM) {
            var valueN = objectN[keyName];
            var valueM = objectM[keyName];
            if (valueN < valueM) return -1;
            else if (valueN > valueM) return 1;
            else return 0
        }
    };
    var seat = 3;
    var sortedRES = [];
    var sortedID = [];
    k = 0;
    arr.sort(objectArraySort('item2'));
    do {
        var cell = arr[arr.length - 1].item1;
        if(!sortedID.includes(cell)){
            k++;
            sortedRES.push(arr[arr.length-1]);
            sortedID.push(cell);
        }
        arr.pop();
    } while (k<seat && arr.length!==0);

    console.log(sortedRES);

    /*
    lotteryResultModel.find({auctionID: auctionid}, function (err, docs) {
        if (err) {
            console.log(err);
        }
        else {
            for (var i = 0; i < docs.length; i++) {
                var region = getParticipateRegion(docs[i].luckyRegion);
                var passengerID = docs[i].id;
                console.log(passengerID + ": " + region);
                candidateID.push(passengerID);
                if (getLuckyPerson(region, LUCKYNUM)) {
                    LUCKYID = passengerID;
                    console.log("find the lucky one: " + LUCKYID);
                }
            }
            res.end("finish testing");
        }
    });
    */
});

module.exports = {
    router: router,
    path: '/test'
};