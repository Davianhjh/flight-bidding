var styles = require("./styles");
var _ = require('lodash');
var less = require('less');
var fs = require('fs');
var path = require('path');

require.extensions['.less'] = function(module, filename){
    module.exports = fs.readFileSync(filename, 'utf-8');
}

var styleQuantity = styles.length;

var compiledQuantity = 0;

var error = false;

_.each(styles, function(style){
    var lessF = require("./less/"+style[1]);
    less.render(lessF, {
        filename: path.resolve(process.cwd()+"/static/style/less/"+style[1])
    }, function(e, output){
        if(e){
            console.log("ERROR rendering less document '"+style[0]+"'.");
            console.log("    - Is it valid? ");
            console.log("    - "+e.message);
            error = true;
        }else{
            console.log(process.cwd());
            var cssPath = process.cwd()+"/static/style/css/"+style[2];
            fs.writeFileSync(cssPath, output.css, {flag: 'w'}, 'utf-8');
            compiledQuantity++;
            if(styleQuantity==compiledQuantity){
                console.log("All LESS documents have been rendered into CSS.");
            }
        }
    });
});

module.exports = null;