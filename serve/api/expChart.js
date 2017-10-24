/**
 * Created by hujinhua on 17-6-16.
 */
const mongoose = require('mongoose');
const db = require('../lib/Mymongoose');
mongoose.Promise = Promise;
db.on('error', function(error) {
    console.log(error);
});

var chartDataSchema = new mongoose.Schema({
    auctionID: { type:String },
    probability: { type: Array },
    price: { type: Array }
},{collection:"chartData"});
var chartDataModel = db.model("chartData", chartDataSchema,"chartData");
var PREVIOUS_DATA = {};

var ROUND = 20;
var USERS = [];
var SEATS = [];
var FEE = [];
for(var i=0;i<ROUND;i++) {
    USERS[i] = parseInt(Math.random() * (64 - 16 + 1) + 16);
    SEATS[i] = parseInt(Math.random() * (8 - 4 + 1) + 4);
    FEE[i] = parseInt(Math.random() * (1024 - 512 + 1) + 512);
}
var BID = new Array(ROUND);
for(var j=0;j<ROUND;j++){
    BID[j] = new Array(USERS[j]);
    for(var k=0;k<USERS[j];k++){
        BID[j][k] = parseInt(Math.random() * (FEE[j] - 256 + 1) + 256);
    }
}
var RRESENTFEE = 512;
var PRESENTSEAT = 5;
var prob = [0,1,2,3,4,5,6,7,8,9,10];
var price = [];

var router = require('express').Router();

router.get('/', function(req, res, next){
    var flight = req.query.flight;
    var auctionid = req.query.auctionid;
    var result = prediction(RRESENTFEE,PRESENTSEAT);

    var data = new chartDataModel({
        auctionID: auctionid,
        probability: prob,
        price: price
    });

    var query = { auctionID:auctionid };
    chartDataModel.findOne(query, function (error, docs) {
        if(error)
            console.log(error);
        else {
            if(docs === null) {
                data.save(function (err) {
                    if (err)
                        console.log(err);
                    else {
                        console.log('save success');
                        PREVIOUS_DATA[auctionid] = data.price[8];
                        res.json(result);
                        res.end();
                    }
                });
            }
            else {
                //console.log('repeated auction id save failure');
                PREVIOUS_DATA[auctionid] = docs.price[8];
                res.json(result);
                res.end();
            }
        }
    });
});

function prediction(presentFee, presentSeat) {
    var result = {};
    var seed = USERS.length;
    var pp = new Array(seed);
    var sum = 0;
    var lowerbound, upperbound, minimum, mid, high, zero;
    var xValue = 0;
/*
    console.log('n:'+USERS);
    console.log('c:'+SEATS);
    console.log('p:'+FEE);
    console.log('bid:');
    for(var m=0;m<ROUND;m++){
        console.log('BID[m]:'+BID[m]);
    }
*/
    for(var i=0; i<seed; i++){
        BID[i].sort();
        lowerbound = BID[i][USERS[i]-SEATS[i]];      // 之前每次竞拍中获取到升舱机会的最低价格
        pp[i] = (lowerbound/FEE[i])*presentFee; //把之前每次竞拍的原始升舱价格换位本次竞拍中的原始升舱价格价格之后，得到的可能竞拍到座位所需要花到的最低的价格
        sum += pp[i];     //这些所有可能的最低价格的总和
    }
    mid = sum/seed;           //取平均值
    sum = 0;
    //console.log('mid: '+mid);

    for(var j=0; j<seed; j++){
        BID[j].sort();
        upperbound = BID[j][USERS[j]-1];        // 之前每次竞拍中升舱最高价格
        pp[j] = (upperbound/FEE[j])*presentFee; // 预测的可能的竞拍中的最高价格
        sum += pp[j];
    }
    high = sum/seed;          //取平均值
    sum =0;
    //console.log('high: '+high);

    for(var k=0; k<seed; k++){
        BID[k].sort();
        minimum = BID[k][0];        //参与之前每次竞拍中，参与者所出的最低的价格的
        pp[k] = (minimum/FEE[k])*presentFee;
        sum += pp[k];
    }
    zero = sum/seed;          //取平均值
    //console.log('zero: '+zero);

    for(var n=0; n<=10; n++){
        if(n<=5){
            xValue = 2*(mid-zero)*(n/10) + zero;
            //console.log('i='+n+', xValue='+xValue);
            result[n] = xValue;
            price[n] = xValue;
        }
        else{
            xValue = 2*(high-mid)*(n/10) - high + 2*mid;
            //console.log('i='+n+', xValue='+xValue);
            result[n] = xValue;
            price[n] = xValue;
        }
    }
    return result;
}

module.exports = {
    router: router,
    path: '/expChart',
    previous_data: PREVIOUS_DATA
};