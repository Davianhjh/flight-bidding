var router = require('express').Router();
var parts = require("../parts");
var ejs = require('ejs');
var template = require('./result.html');

router.get("/", function(req, res, next){
    var head = parts.render('head', {
        title: "航班详情",
        mobile: false,
        additionalStylesheet:["/static/style/bootstrap.min.css",
            "/static/style/font-awesome.css",
            "/static/style/animate.css",
            "/static/style/style.css",
            "/static/style/result.css",
            "https://unpkg.com/element-ui/lib/theme-default/index.css"],
        additionalScriptsSrc : ["/static/script/result.js",
            "https://unpkg.com/element-ui/lib/index.js"]
    });

    var html = ejs.render(template, {
        head: head
    });
    res.write(html);
    res.end();
});

module.exports = {
    path: "/result",
    router: router
}