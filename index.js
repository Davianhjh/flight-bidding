var app = require('./app');
app.set('port', process.env.PORT || 8001);
var server = app.listen(app.get('port'), '0.0.0.0', function(){
    console.log('Flight Seat Auction server starts listening on :' + server.address().port);
});