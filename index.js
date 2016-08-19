var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use('/public',express.static(__dirname+'/public'));
app.get('/',function(req,res){
    res.sendFile(__dirname+"/index.html");
});

//等待区
var waitingRom={
    boy:[],
    girl:[]
};

/*总集合模型：
{
    socket:{},
    other:{},
    name:'',
    sex:0
}
*/
var socketMap={};

io.on('connection',function(socket){
    socketMap[socket.id] = {
        socket:socket
    };
    console.log('a user connected');

    //断开连接
    socket.on('disconnect', function(){
        var disconnGuy = socketMap[socket.id];
        var other = disconnGuy.other;
        if(other){
            //已配对，通知对方并将对方放入等待区
            other.socket.emit("drop",1);
            other.other = null;
            if(other.sex==1){
                waitingRom.boy.push(other);
            }
            else{
                waitingRom.girl.push(other);
            }
        }
        else{
            //如果还没配对，在等待区将其删除
            var deleted = false;
            if(waitingRom.boy.length>0){
                for(var i=0;i<waitingRom.boy.length;i++){
                    if(waitingRom.boy[i].socket.id == socket.id){
                        waitingRom.boy.splice(i,1);
                        deleted=true;
                        break;
                    }
                }
            }
            if(waitingRom.girl.length>0 && deleted==false){
                for(var i=0;i<waitingRom.girl.length;i++){
                    if(waitingRom.girl[i].socket.id == socket.id){
                        waitingRom.girl.splice(i,1);
                        break;
                    }
                }
            }
        }
        
        delete socketMap[socket.id];
        console.log('disconnect '+socket.id);
    });

    //聊天
    socket.on('chat', function(msg){
        var obj = socketMap[socket.id];
        var other = obj.other;
        if(other){
            obj.socket.emit('chat',{ok:1,type:1,you:true,sex:obj.sex,msg:msg});
            other.socket.emit('chat',{ok:1,type:1,you:false,sex:obj.sex,msg:msg});
        }
        else{
            obj.socket.emit('chat',{ok:0,type:1,error:'no body'});
        }
    });

    //个人介绍{name:'',sex:0}
    socket.on('intro', function(info){
        var obj = socketMap[socket.id];
        obj.name = info.name;
        obj.sex = info.sex;
        if(obj.sex==1){
            waitingRom.boy.push(obj);
        }
        else{
            waitingRom.girl.push(obj);
        }
        io.emit('intro', 'ok');
        console.log('intro ok' + JSON.stringify(info));
    });
});

setInterval(function(){
    console.log('boy:'+waitingRom.boy.length + ' girl:'+waitingRom.girl.length);
    if(waitingRom.boy.length>0 && waitingRom.girl.length>0){
        var min = waitingRom.boy.length;
        if(waitingRom.girl.length < waitingRom.boy.length){
            min = waitingRom.girl.length;
        }
        for(var i=waitingRom.girl.length-1;i>=0;i--){
            var girl = waitingRom.girl[i];
            var boy = waitingRom.boy[i];
            girl.other = boy;
            boy.other = girl;
            //提醒已经配对
            boy.socket.emit("waiting",0);
            girl.socket.emit("waiting",0);
            boy.socket.emit('chat',{ok:1,type:1,you:false,sex:0,msg:'你好啊'});
            girl.socket.emit('chat',{ok:1,type:1,you:false,sex:1,msg:'你好啊'});
            waitingRom.girl.splice(i,1);
            waitingRom.boy.splice(i,1);
        }
    }
    if(waitingRom.boy.length>0){
        for(var i=0;i<waitingRom.boy.length;i++){
            waitingRom.boy[i].socket.emit('waiting',1);
        }
    }
    if(waitingRom.girl.length>0){
        for(var i=0;i<waitingRom.girl.length;i++){
             waitingRom.girl[i].socket.emit('waiting',1);
        }
    }      
},1000);

http.listen(3000,function(){
    console.log('server on 3000');
});