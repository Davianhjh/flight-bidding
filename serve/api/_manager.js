// Rest API's registered Bellow.
var apis = {
    test: require('./test'),
    loginpassenger: require('./loginPassenger'),
    loginattendant: require('./loginAttendant'),
    flightInfo: require('./flightInfo'),
    attendantInfo: require('./attendantInfo'),
    bidding: require('./bidding'),
    startAuction: require('./startAuction'),
    timeRemaining: require('./timeRemaining'),
    biddingPrice: require('./biddingPrice'),
    heatLevel: require('./heatLevel'),
    biddingResult: require('./biddingResult'),
    setPaid: require('./setPaid'),
    transaction: require('./transaction'),
    expChart: require('./expChart')
};
// Rest API's registered Above.

var _ = require('lodash');
var auth = require('../lib/auth/authService');
var authMiddleWare = auth.middleWare;
var registerAll = function(app){
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
    register: registerAll
};