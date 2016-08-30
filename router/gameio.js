module.exports = function(io,socket){
    console.log('a user connect');
    socket.on("move",function(msg){
        io.emit("move",msg);
    });
    socket.on("disconnect",function(msg){

    });
};