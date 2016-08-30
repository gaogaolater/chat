
var BaseObj = function(){
  this.x=0;
  this.y=0;
  this.w=0;
  this.h=0;
  this.speed=2;
}

var Plane = function(){
  BaseObj.call(this);
  this.name='';
  this.angle=0;
  
}





$(function(){
  return;
  var socket = io();

  $("#startChat").click(function(){
    var name = $("#nickname").val();
    var sex = $("input[name='sex']:checked").val();
    socket.emit('intro', {name:name,sex:sex});
    $('#loadingToast').show();
    $("#loadingtip").text("匹配中...");
  });

  $('#send').click(function(){
      var msg = $('#msg').val();
      if(msg.length>0){
        socket.emit('chat', encodeURIComponent(msg));
        $('#msg').val('');
        $('#msg').focus();
      }
  });
  
  function appendMsg(obj){
      console.log(obj);
      var html = obj.you ? "<div class='msg_right'>":"<div class='msg_left'>";
      if(obj.sex==1){
        html+="<img src='/public/images/boy.png'/>";
      }
      else{
        html+="<img src='/public/images/girl.png'/>";
      }
      html+="<span>";
      html+=decodeURIComponent(obj.msg).replace("<","&#60;").replace(">","&#62;");
      html+="</span></div>";
      $(".chatarea_top").append(html);
      var chatArea = $(".chatarea_top")[0];
      chatArea.scrollTop = chatArea.scrollHeight;
  }
  
  socket.on('chat', function(obj){
      appendMsg(obj);
  });

  socket.on('drop', function(obj){
      $(".prepare").show();
      $(".chatpage").hide();
      $('#loadingToast').show();
      $("#loadingtip").text("对方已掉线，重连中...");
  });

  socket.on('waiting', function(msg){
    if(msg==1){
      console.log('waiting');
    }
    else{
      $("#loadingtip").text("匹配成功");
      //清空聊天
      $(".chatarea_top").html("");
      setTimeout(function(){
        $(".prepare").hide();
        $(".chatpage").show();
        $('#loadingToast').hide();
      },1000);
    }
  });
});
