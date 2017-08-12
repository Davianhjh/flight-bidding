var express = require('express');

var bind = function(app){
    app.use("/data/products/image", express.static("data/image"));
}

module.exports = {
    bind: bind
}