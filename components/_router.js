var fs = require('fs');
require.extensions['.html'] = function(module, filename){
    module.exports = fs.readFileSync(filename, 'utf-8');
}
// Components registered here
var pages = {
    test: require("./test"),
    home: require("./home/_index"),
    main: require("./main/main"),
    script: require("./js"),
    fightslist: require("./fightsList/_fightslist"),
    result: require("./result/_result")
}

var path = require('path');
var _ = require('lodash');
var bindPages = function(app){
    _.each(pages, function(page){
        if(page.adminAuth){
            // TODO: Auth Admin
        }else if(page.userAuth){
            // TODO: Auth User
        }
        app.use(page.path, page.router);
    });
}

module.exports = {
    bind: bindPages
};