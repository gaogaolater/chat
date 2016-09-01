module.exports = function(io,socket){
    var uuid = require("node-uuid");
    var room = {};
    var roomCount = 0;

    console.log('a user connect');

    socket.on("createRoom",function(msg){
        io.emit("move",msg);
    });

    socket.on("createRoom",function(msg){
        io.emit("move",msg);
    });

    socket.on("move",function(msg){
        io.emit("move",msg);
    });
    socket.on("disconnect",function(msg){

    });
};