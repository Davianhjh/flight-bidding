var router = require('express').Router();
var template = require("./main.html");
var parts = require("../parts");
var ejs = require('ejs');

router.get('/', function(req, res, next){
    var head = parts.render('head', {
        title: "AGiView Auction",
        mobile: true,
        additionalScriptsSrc: ["/script/page/mobileHome.js"]
    });
    var html = ejs.render(template, {
        head: head,
        mobile: true
    });
    res.write(html);
    res.end();

})

module.exports = {
    path: "/home",
    router: router
}