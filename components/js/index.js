var fs = require('fs');
var router = require('express').Router();
var requireScript = function(file){
    file = file.endsWith(".js")? file: file+".js";
    return fs.readFileSync(process.cwd()+"/components/js/"+file, 'utf-8');
}
var scripts = {
    mobileHome: requireScript("../main/mobileHome")
};

router.get("/:script", function(req, res, next){
    var scriptQuery = req.params.script;
    scriptQuery = scriptQuery.endsWith(".js")? scriptQuery.substring(0, scriptQuery.length-3): scriptQuery;
    if(!!scripts[scriptQuery]){
            res.header("Content-Type", "application/javascript");
            res.write(scripts[scriptQuery]);
    }else{
        res.sendStatus(404);
    }
    res.end();
});

module.exports = {
    path: "/script/page",
    router: router
};