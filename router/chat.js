var express = require('express');
var router = express.Router();
var fs = require('fs');
var multer = require('multer');
var upload = multer({ dest: 'public/upload/' });

var chatContext = {
    router: router,
    ioinit: null
};

module.exports = chatContext;

//聊天页面
router.get('/', function (req, res) {
    res.render("chat");
});

//上传文件
router.post("/upload",upload.single('spxfile'), function(req,res,next){
    var temp_path = req.file.path;
    var now = new Date().getTime();
    var target_path = "./public/upload/"+now+".spx";
    var socketid = req.param("socketid");
    fs.rename(temp_path,target_path,function(err){
        if(err) throw err;
        fs.unlink(temp_path,function(){
            res.send({ ok: 1, path: target_path });
            //socket通知
            var obj = socketMap[socketid];
            if(obj){
                var other = obj.other;
                obj.socket.emit('chat', { ok: 1, type: 2, you: true, sex: obj.sex, path: now});
                other.socket.emit('chat', { ok: 1, type: 2, you: false, sex: obj.sex, path: now});
            }
            next();
        });
    });
});

//等待区
var waitingRom = {
    boy: [],
    girl: []
};

var socketMap = {};

chatContext.ioinit = function (io) {
    /*总集合模型：
    {
        socket:{},
        other:{},
        name:'',
        sex:0
    }
    */
    io.on('connection', function (socket) {
        socketMap[socket.id] = {
            socket: socket
        };
        console.log('a user connected');
        socket.emit('connected', { ok: 1, id:socket.id });

        //断开连接
        socket.on('disconnect', function () {
            console.log('a user disconnect');
            var disconnGuy = socketMap[socket.id];
            var other = disconnGuy.other;
            if (other) {
                //已配对，通知对方并将对方放入等待区
                other.socket.emit("drop", 1);
                //切除关联
                other.other = null;
                if (other.sex == 1) {
                    waitingRom.boy.push(other);
                }
                else {
                    waitingRom.girl.push(other);
                }
            }
            else {
                //如果还没配对，在等待区将其删除
                var deleted = false;
                if (waitingRom.boy.length > 0) {
                    for (var i = 0; i < waitingRom.boy.length; i++) {
                        if (waitingRom.boy[i].socket.id == socket.id) {
                            waitingRom.boy.splice(i, 1);
                            deleted = true;
                            break;
                        }
                    }
                }
                if (waitingRom.girl.length > 0 && deleted == false) {
                    for (var i = 0; i < waitingRom.girl.length; i++) {
                        if (waitingRom.girl[i].socket.id == socket.id) {
                            waitingRom.girl.splice(i, 1);
                            break;
                        }
                    }
                }
            }

            delete socketMap[socket.id];
            console.log('disconnect ' + socket.id);
        });

        //聊天
        socket.on('chat', function (msg) {
            var obj = socketMap[socket.id];
            var other = obj.other;
            if (other) {
                obj.socket.emit('chat', { ok: 1, type: 1, you: true, sex: obj.sex, msg: msg });
                other.socket.emit('chat', { ok: 1, type: 1, you: false, sex: obj.sex, msg: msg });
            }
            else {
                //对方掉线
                obj.socket.emit("drop", 1);
                //切除关联
                obj.other = null;
                if (obj.sex == 1) {
                    waitingRom.boy.push(obj);
                }
                else {
                    waitingRom.girl.push(obj);
                }
            }
        });

        //个人介绍{name:'',sex:0}
        socket.on('intro', function (info) {
            var obj = socketMap[socket.id];
            obj.name = info.name;
            obj.sex = info.sex;
            if (obj.sex == 1) {
                waitingRom.boy.push(obj);
            }
            else {
                waitingRom.girl.push(obj);
            }
            io.emit('intro', 'ok');
            console.log('intro ok' + JSON.stringify(info));
        });
    });
}

setInterval(function () {
        //console.log('boy:'+waitingRom.boy.length + ' girl:'+waitingRom.girl.length);
        if (waitingRom.boy.length > 0 && waitingRom.girl.length > 0) {
            var min = waitingRom.boy.length;
            if (waitingRom.girl.length < waitingRom.boy.length) {
                min = waitingRom.girl.length;
            }
            for (var i = waitingRom.girl.length - 1; i >= 0; i--) {
                var girl = waitingRom.girl[i];
                var boy = waitingRom.boy[i];
                girl.other = boy;
                boy.other = girl;
                //提醒已经配对
                boy.socket.emit("waiting", 0);
                girl.socket.emit("waiting", 0);
                boy.socket.emit('chat', { ok: 1, type: 1, you: false, sex: 0, msg: '你好啊' });
                girl.socket.emit('chat', { ok: 1, type: 1, you: false, sex: 1, msg: '你好啊' });
                waitingRom.girl.splice(i, 1);
                waitingRom.boy.splice(i, 1);
            }
        }
        if (waitingRom.boy.length > 0) {
            for (var i = 0; i < waitingRom.boy.length; i++) {
                waitingRom.boy[i].socket.emit('waiting', 1);
            }
        }
        if (waitingRom.girl.length > 0) {
            for (var i = 0; i < waitingRom.girl.length; i++) {
                waitingRom.girl[i].socket.emit('waiting', 1);
            }
        }
    }, 1000);