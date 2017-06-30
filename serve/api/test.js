var router = require('express').Router();
router.get('/', function(req, res, next){
    res.write('Hello World!');
    res.end();
});

module.exports = {
    router: router,
    path: '/test'
}