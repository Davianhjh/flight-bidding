var _ = require('lodash');
var less = require('less');
var fs = require('fs');
var path = require('path');
var router = require('express').Router();

var styles = require("./styles");
var config = require("../../config/debug");
var realTime = config.realTimeCompile.less;
var cssmap = {
    common: fs.readFileSync(process.cwd()+"/static/style/css/common.css", 'utf-8'),
    bootstrap: fs.readFileSync(process.cwd()+"/static/style/css/bootstrap.min.css", 'utf-8'),
    awesome: fs.readFileSync(process.cwd()+"/static/style/font-awesome/css/font-awesome.css", 'utf-8'),
    animate: fs.readFileSync(process.cwd()+"/static/style/css/animate.css", 'utf-8'),
    agistyle: fs.readFileSync(process.cwd()+"/static/style/css/style.css", 'utf-8'),
    agiresult: fs.readFileSync(process.cwd()+"/static/style/css/result.css", 'utf-8'),
    agielement: fs.readFileSync(process.cwd()+"/static/style/css/element.css", 'utf-8')
}

require.extensions['.less'] = function(module, filename){
    module.exports = fs.readFileSync(filename, 'utf-8');
}
require.extensions['.css'] = function(module, filename){
    module.exports = fs.readFileSync(filename, 'utf-8');
}

// Generate StyleMap
var styleMap = {};
_.each(styles, function(style){
    styleMap[style[0]] = {
        lessPath: style[1],
        cssPath: style[2],
        lessFile: require("./less/"+style[1]),
        cssFile: require("./css/"+style[2])
    }
});

router.get("/:css", function(req, res, next){
    var css = req.params.css;
    var cssResult = _.find(styleMap, function(style){
        return style.cssPath==css;
    });

    switch (css) {
        case "element.css":
            res.header("Content-Type", "text/css");
            res.write(cssmap.agielement);
            res.end();
            break;        
        case "common.css":
            res.header("Content-Type", "text/css");
            res.write(cssmap.common);
            res.end();
            break;
        case "bootstrap.min.css":
            res.header("Content-Type", "text/css");
            res.write(cssmap.bootstrap);
            res.end();
            break;
        case  "font-awesome.css":
            res.header("Content-Type", "text/css");
            res.write(cssmap.awesome);
            res.end();
            break;
        case  "animate.css":
            res.header("Content-Type", "text/css");
            res.write(cssmap.animate);
            res.end();
            break;
        case  "style.css":
            res.header("Content-Type", "text/css");
            res.write(cssmap.agistyle);
            res.end();
            break;
        case  "result.css":
            res.header("Content-Type", "text/css");
            res.write(cssmap.agiresult);
            res.end();
            break;
        default:
            res.sendStatus(404);
            res.end();
    }
});

var bindStyle = function(app){
    app.use("/static/style", router);
}

module.exports = {
    bind: bindStyle
}