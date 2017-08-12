var router = require('express').Router();
var parts = require("../parts");
var ejs = require('ejs');
var template = require('./index.html');

router.get("/", function(req, res, next){
    var head = parts.render('head', {
        title: "AGiView Home",
        mobile: false,
        additionalStylesheet:["/static/style/bootstrap.min.css",
                                "/static/style/font-awesome.css",
                                "/static/style/animate.css",
                                "/static/style/style.css"],
        additionalScriptsSrc : ["/static/script/index.js"]
    });
    console.log("debug here!!!:" + req);
    var html = ejs.render(template, {
        head: head
    });
    res.write(html);
    res.end();
});

module.exports = {
    path: "/",
    router: router
}