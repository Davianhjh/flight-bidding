var parts = {
    head: require("./head.html")
}

var ejs = require('ejs');

var renderPart = function(partName, variables){
    var html = ejs.render(parts[partName], variables);
    return html;
}

module.exports = {
    render: renderPart
}