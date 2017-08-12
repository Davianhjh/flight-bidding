// var apiRouter = require("./apis/_router");
var apiRouter = require("./serve/api/_manager");
var pageRouter = require("./components/_router");
var staticRouter = require("./static/_router");
var imageRouter = require("./data/imageProvider");
var bind = function(app){
    apiRouter.bind(app);
    pageRouter.bind(app);
    staticRouter.bind(app);
    imageRouter.bind(app);
}
module.exports = {
    bind: bind
}