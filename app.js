var express = require('express');
var apis = require('./serve/api/_manager');

var app = express();

apis.register(app);

module.exports = app;