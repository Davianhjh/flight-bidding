var router = require('express').Router();
var parts = require("../parts");
var ejs = require('ejs');
var template = require('./fightslist.html');

router.get("/", function(req, res, next){
    var head = parts.render('head', {
        title: "航班列表",
        mobile: false,
        additionalStylesheet:["/static/style/bootstrap.min.css",
            // "/static/style/font-awesome.css",
            // "/static/style/animate.css",
            "/static/style/style.css",
            // "https://unpkg.com/element-ui/lib/theme-default/index.css",
            // "https://unpkg.com/element-ui@1.4.2/lib/theme-default/index.css"
            //   " https://unpkg.com/element-ui@1.4.2/lib/theme-default/index.css"
            "/static/style/element.css"
        ],
        additionalScriptsSrc : ["/static/script/fightslist.js",
            // "https://unpkg.com/element-ui/lib/index.js"
            // "https://cdn.jsdelivr.net/lodash/4.17.4/lodash.js"
            // "https://unpkg.com/element-ui@1.4.2/lib/index.js"
            "/static/script/element.js"
            // "/static/script/table.js",
            // "/static/script/table-column.js"
        ]
    });

    var html = ejs.render(template, {
        head: head
    });
    res.write(html);
    res.end();
});

module.exports = {
    path: "/fightslist",
    router: router
}