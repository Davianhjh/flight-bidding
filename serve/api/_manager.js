// Rest API's registered Bellow.
var apis = {
    test: require('./test'),
    loginpassenger: require('./loginPassenger'),
    loginattendant: require('./loginAttendant'),
    flightInfo: require('./flightInfo'),
    overSelling: require('./overSelling'),
    attendantInfo: require('./attendantInfo'),
    bidding: require('./bidding'),
    startAuction: require('./startAuction'),
    advancedAuction: require('./advancedAuction'),
    timeRemaining: require('./timeRemaining'),
    biddingPrice: require('./biddingPrice'),
    heatLevel: require('./heatLevel'),
    biddingResult: require('./biddingResult'),
    advancedAuctionResult: require('./advancedAuctionResult'),
    setPaid: require('./setPaid'),
    transaction: require('./transaction'),
    expChart: require('./expChart'),
    loginAdmin: require('./loginAdmin'),
    setAuctionFlights: require('./setAuctionFlights'),
    consoleResult: require('./consoleResult'),
    startLottery: require('../LotteryAPI/startLottery'),
    lotteryInfo: require('../LotteryAPI/lotteryInfo'),
    lotteryPrice: require('../LotteryAPI/lotteryPrice'),
    lotteryTransaction: require('../LotteryAPI/lotteryTransaction'),
    jackpot: require('../LotteryAPI/jackpot'),
    stageList: require('./stageList'),
    eTicket: require('./eTicket')
};
// Rest API's registered Above.

var _ = require('lodash');
var auth = require('../lib/auth/authService');
var authMiddleWare = auth.middleWare;
var bindApis = function(app){
    _.each(apis, function(api){
        if(!apis.skipAuth){
            // TODO: Auth Module
            // app.use(api.path, authMiddleWare);
        }
        if(apis.adminAuth){
            
        }
        app.use(api.path, api.router);
    });
};

module.exports = {
    bind: bindApis
};