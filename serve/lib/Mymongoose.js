/**
 * Created by hujinhua on 17-6-15.
 */
const mongoose = require('mongoose');
mongoose.Promise = Promise;
var db = mongoose.createConnection('mongodb://localhost:27017/flight-bidding');
db.on('error', function(error) {
    console.log(error);
});
module.exports = db;
