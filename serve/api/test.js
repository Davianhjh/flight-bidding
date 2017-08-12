var router = require('express').Router();
router.get('/', function(req, res, next){
    res.write('Hello World!猜猜我是谁');
    res.end();
});

module.exports = {
    router: router,
    path: '/test'
}