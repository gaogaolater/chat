var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var template = require('art-template');
template.config('base', '');
template.config('extname', '.html');

app.use('/public',express.static(__dirname+'/public'));
app.set('views', "./view");
app.set('view engine', 'html');
app.engine('.html', template.__express);

//聊天相关
var chat = require('./router/chat');
app.use('/chat',chat.router);
chat.ioinit(io);

//游戏相关
var game = require('./router/game');
app.use('/game',game);

var gameio = require('./router/gameio');
io.on('connection',function(socket){
    gameio(io,socket);
});
app.use('/game',game);

http.listen(3000,function(){
    console.log('server on 3000');
});