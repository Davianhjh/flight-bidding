var router = require('express').Router();


router.get('/', function(req, res, next){
    var checky = "\n"+
"  $$$$$$\\  $$\\                           $$\\ \n"+
" $$  __$$\\ $$ |                          $$ |       \n"+
" $$ /  \\__|$$$$$$$\\   $$$$$$\\   $$$$$$$\\ $$ |  $$\\ $$\\   $$\\  \n"+
" $$ |      $$  __$$\\ $$  __$$\\ $$  _____|$$ | $$  |$$ |  $$ | \n"+
" $$ |      $$ |  $$ |$$$$$$$$ |$$ /      $$$$$$  / $$ |  $$ | \n"+
" $$ |  $$\\ $$ |  $$ |$$   ____|$$ |      $$  _$$<  $$ |  $$ | \n"+
" \\$$$$$$  |$$ |  $$ |\\$$$$$$$\\ \\$$$$$$$\\ $$ | \\$$\\ \$$$$$$$ | \n"+
"  \\______/ \\__|  \\__| \\_______| \\_______|\\__|  \\__| \\____$$ | \n"+
"                                                  $$\\   $$ | \n"+
"                                                  \\$$$$$$  | \n"+
"                                                   \\______/ \n"
    res.write(checky);
    res.end();
});

module.exports = {
    path: "/test",
    router: router
}