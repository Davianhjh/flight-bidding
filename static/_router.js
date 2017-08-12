var styleProvider = require("./style/styleProvider");
var jsProvider = require("./js/jsProvider");
var express = require('express');
var bindStatic = function(app){
    styleProvider.bind(app);
    jsProvider.bind(app);
    app.use("/static/fonts", express.static("static/fonts"));
}
module.exports = {
    bind: bindStatic
}