var express = require('express');
var app = express();

// Render Less
require("./static/style/cssGenerator");

// Router
var router = require('./router');
router.bind(app);

module.exports = app;