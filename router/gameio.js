/*
    1、用户进来首先创建创建房间，发送给好友
    2、好友点击进入后开始游戏
    3、客户端只是传输各自位置
    4、服务端实时接收位置并发送界面各自位置
    5、服务端需要实时检测是否碰撞 以及碰撞角度 碰撞时的速度 球的速度 球当前由谁控制，是否进门等
*/
var uuid = require("node-uuid");
/*
room item对象
{
    roomid:1,
    player1:{
        socket:{}
    },
    player2:{},
    ball:{},
    //超时后检查是否开始，如果还没开始则销毁room
    checkRuningTimer : setTimeout()
}
*/

//正在玩的room
var rooms = {};
//room的个数
var roomCount = 0;

var Ball = function(){
    this.id = "ball";
    this.x=0;
    this.y=0;
    this.w=0;
    this.h=0;
    this.own=null;
    this.move=function(){
        
    };
    this.crash=function(){

    }
};

var Player = function(roomid,socket,other){
    this.id = socket.id;
    this.other = other;//对手 对象
    this.socket = socket;
    this.roomid = roomid;
    this.x=0;
    this.y=0;
    this.w=0;
    this.h=0;   
    this.speed=0;
    this.move=function(){
        
    };
};

//room应该和game合并  啊啊！！！
var Game = function(){
    this.runingTimer = null;
    this.roomid = 1;
    this.player1 = null;
    this.player2 = null;
    this.ball = null;
    //超时后检查是否开始，如果还没开始则销毁room
    this.waitingTimer = null;
    this.join = (socket)=>{
        
    },
    this.start = ()=>{},
    this.pause = ()=>{},
    this.over = ()=>{}
}



module.exports = function(io,socket){
    console.log('a user connect');

    socket.on("createRoom",function(){
        var roomid = uuid.v1();
        socket.roomid = roomid;
        var roomObj = 
        {
            roomid:roomid,
            player1:new Player(roomid,socket,null),
            player2:null,
            ball:null
        };
        roomObj.checkRuningTimer = setTimeout(function(){
            if(roomObj.player2 == null){
                //超时还没用户进来 就退出房间
                delete rooms.roomid;
                socket.emit("timeout",{});
            }
        },1000*10);
        rooms.roomid = roomObj;
        //返回roomid
        socket.emit("createRoom",uuid.v1());
    });

    //加入游戏
    socket.on("join",function(msg){
        var roomid = msg.roomid;
        var room = rooms.roomid;
        if(room){
            var player1 = room.player1;
            var player2 = new Player(roomid,socket,player1);
            player1.other = player2;
            room.player2 = player2;
        }
    });

    //加入游戏
    socket.on("move",function(msg){
        var room = rooms.socket.roomid;
        room.move();
    });

    //断开连接
    socket.on("disconnect",function(msg){
        //销毁room
        if(socket.roomid){
            var room = rooms.roomid;
            if(room){
                 delete rooms.roomid;
                 //通知另一方
                 if(socket.other){
                     socket.other.emit("otherdrops",{});
                 }
            }
        }
    });


};