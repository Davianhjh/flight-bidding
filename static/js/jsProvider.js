// This module provides static common JavaScript only

var fs = require('fs');
var router = require('express').Router();
var scripts = {
    jquery: fs.readFileSync(process.cwd()+"/static/js/jquery-3.2.1.min.js", 'utf-8'),
    vue: fs.readFileSync(process.cwd()+"/static/js/vue.debug.js", 'utf-8'),
    mobile: fs.readFileSync(process.cwd()+"/static/js/mobile.js", 'utf-8'),

    // Mainly scripts
    bootstrapMain: fs.readFileSync(process.cwd()+"/static/js/bootstrap.min.js", 'utf-8'),
    metisMenu: fs.readFileSync(process.cwd()+"/static/js/plugins/metisMenu/jquery.metisMenu.js", 'utf-8'),
    slimscroll: fs.readFileSync(process.cwd()+"/static/js/plugins/slimscroll/jquery.slimscroll.min.js", 'utf-8'),
    // flot
    jqflot: fs.readFileSync(process.cwd()+"/static/js/plugins/flot/jquery.flot.js", 'utf-8'),
    jqtooltip: fs.readFileSync(process.cwd()+"/static/js/plugins/flot/jquery.flot.tooltip.min.js", 'utf-8'),
    jqspline: fs.readFileSync(process.cwd()+"/static/js/plugins/flot/jquery.flot.spline.js", 'utf-8'),
    jqresize: fs.readFileSync(process.cwd()+"/static/js/plugins/flot/jquery.flot.resize.js", 'utf-8'),
    jqpie: fs.readFileSync(process.cwd()+"/static/js/plugins/flot/jquery.flot.pie.js", 'utf-8'),
    // Peity
    peity: fs.readFileSync(process.cwd()+"/static/js/plugins/peity/jquery.peity.min.js", 'utf-8'),
    pertydemo: fs.readFileSync(process.cwd()+"/static/js/demo/peity-demo.js", 'utf-8'),
    // Custom and plugin javascript
    inspinia: fs.readFileSync(process.cwd()+"/static/js/inspinia.js", 'utf-8'),
    pace: fs.readFileSync(process.cwd()+"/static/js/plugins/pace/pace.min.js", 'utf-8'),
    // jQuery UI
    jQueryUI: fs.readFileSync(process.cwd()+"/static/js/plugins/jquery-ui/jquery-ui.min.js", 'utf-8'),
    // GITTER
    gritter: fs.readFileSync(process.cwd()+"/static/js/plugins/gritter/jquery.gritter.min.js", 'utf-8'),
    // Sparkline
    sparkline: fs.readFileSync(process.cwd()+"/static/js/plugins/sparkline/jquery.sparkline.min.js", 'utf-8'),
    // Sparkline demo data
    sparllineDemo: fs.readFileSync(process.cwd()+"/static/js/demo/sparkline-demo.js", 'utf-8'),
    // ChartJS
    chartJs: fs.readFileSync(process.cwd()+"/static/js/plugins/chartJs/Chart.min.js", 'utf-8'),
    // Toastr
    toastr: fs.readFileSync(process.cwd()+"/static/js/plugins/toastr/toastr.min.js", 'utf-8'),

    // 功能页面js
    login: fs.readFileSync(process.cwd()+"/components/home/index.js", 'utf-8'),
    fightslist: fs.readFileSync(process.cwd()+"/components/fightsList/fightslist.js", 'utf-8'),
    result: fs.readFileSync(process.cwd()+"/components/result/result.js", 'utf-8'),

    // element引用
    agielement: fs.readFileSync(process.cwd()+"/static/js/element.js", 'utf-8'),
    agielementfonts: fs.readFileSync(process.cwd()+"/static/js/element.js", 'utf-8')
    // element模块引用
    // agielementTable: fs.readFileSync(process.cwd()+"/node_modules/element-ui/lib/table.js", 'utf-8'),
    // agielementTablecolumn: fs.readFileSync(process.cwd()+"/node_modules/element-ui/lib/table-column.js", 'utf-8')
}
router.get("/:path", function(req, res, next){
    switch(req.params.path){
        case "jquery.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.jquery);
            break;
        case "vue.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.vue);
            break;
        case "mobile.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.mobile);
            break;
        // 功能页面
        case "index.js": // 登录
            res.header("Content-Type", "application/javascript");
            res.write(scripts.login);
            break;
        case "fightslist.js": // 航班列表
            res.header("Content-Type", "application/javascript");
            res.write(scripts.fightslist);
            break;
        case "result.js": // 航班详情
            res.header("Content-Type", "application/javascript");
            res.write(scripts.result);
            break;
        // element 引用
        case "element.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.agielement); 
            break;
        // element模块引用
        // case "table.js":
        //     res.header("Content-Type", "application/javascript");
        //     res.write(scripts.agielementTable); 
        //     break;
        // case "table-column.js":
        //     res.header("Content-Type", "application/javascript");
        //     res.write(scripts.agielementTablecolumn); 
        //     break;                    
        // Mainly scripts
        case "bootstrap.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.bootstrapMain);
            break;
        case "jquery.metisMenu.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.metisMenu);
            break;
        case "jquery.slimscroll.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.slimscroll);
            break;
        // Flot
        case "jquery.flot.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.jqflot);
            break;
        case "jquery.flot.tooltip.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.jqtooltip);
            break;
        case "jquery.flot.spline.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.jqspline);
            break;
        case "jquery.flot.resize.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.jqresize);
            break;
        case "jquery.flot.pie.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.jqpie);
            break;
        // Peity
        case "jquery.peity.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.peity);
            break;
        case "peity-demo.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.pertydemo);
            break;
        // Custom and plugin javascript
        case "inspinia.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.inspinia);
            break;
        case "pace.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.pace);
            break;
        // jQuery UI
        case "jquery-ui.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.jQueryUI);
            break;
        // GITTER
        case "jquery.gritter.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.gritter);
            break;
        // Sparkline
        case "jquery.sparkline.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.sparkline);
            break;
        // Sparkline demo data
        case "sparkline-demo.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.sparllineDemo);
            break;
        // ChartJS
        case "Chart.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.chartJs);
            break;
        // Toastr
        case "toastr.min.js":
            res.header("Content-Type", "application/javascript");
            res.write(scripts.toastr);
            break;
        default:
            res.sendStatus(404);
    }
    res.end();
})
 var bind = function(app){
    app.use("/static/script", router);
 }
module.exports = {
    bind: bind
}