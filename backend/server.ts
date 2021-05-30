const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const redis = require('redis');
const moment = require('moment');
const path = require('path');

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const redis_url = "redis://:pb32605202600a4264026b0651fe662ea3d69029fba07b06f42a38b916cfc0744@ec2-54-172-142-101.compute-1.amazonaws.com:24159";

let client = redis.createClient(redis_url);
client.on('connect',()=>{
  console.log("connected to redis");
})
const PORT = process.env.PORT || 3000;
app.use(express.static(path.resolve(__dirname, '../build')));
app.get('*', (req:any, res:any) => {
  res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
});
io.on('connection', (socket:any) => {
  socket.on('user_online',(data:any)=>{
    //client.del('users');
    client.get("users",(err:any, reply:any)=>{
        if(!reply){
          let users:{email: string, picture: string, status: string, socketId: string, newMessages: number, blacklistedUsers:any}[] = [
            {
              email: data.email,
              picture: data.picture,
              status: "online",
              socketId: socket.id,
              newMessages: 0,
              blacklistedUsers:[]
            }
          ];
          client.set("users",JSON.stringify(users));
        }else{
          let users = JSON.parse(reply);
          let index = users.findIndex((n_user:any) => n_user.email === data.email);
          if(index < 0){
            //register new user
            data.socketId = socket.id;
            data.blacklistedUsers =[];
            users.forEach((user:any) => {
              user.newMessages = 0;
              if(!user.blacklistedUsers){
                user.blacklistedUsers = [];
              }
            });
            users.push(data);
            client.set("users",JSON.stringify(users));
          }else{
            users[index].socketId = socket.id;
            users[index].status = 'online';
            users.forEach((user:any) => {
              user.newMessages = 0;
              if(!user.blacklistedUsers){
                user.blacklistedUsers = [];
              }
            });
            client.set("users",JSON.stringify(users));
          }
          io.sockets.emit('users',users);
        }
    });
  })


  socket.on('get_conversations',(conversationId:string)=>{
    client.get(conversationId,(err:any,reply:any)=>{
      if(!reply){
        let reverseConversation = conversationId.split(':');
        let reverseConversationIdId = reverseConversation[1]+":"+reverseConversation[0];
        client.get(reverseConversationIdId,(err:any,reply:any)=>{
          if(reply){
            let conversation = JSON.parse(reply);
            socket.emit('message_received',conversation);
          }else{
            socket.emit('message_received',[])
          }
        })
      }else{
        let conversation = JSON.parse(reply);
        socket.emit('message_received',conversation);
      }
    })
  })

  socket.on('send_message',(messageData:any)=>{
    messageData.dateTime = moment().format('MMMM D YYYY, h:mm A');
    
    let conversationId = messageData.conversation;
    client.get(conversationId,(err:any,reply:any)=>{
      if(!reply){
        let reverseConversation = conversationId.split(':');
        let reverseConversationIdId = reverseConversation[1]+":"+reverseConversation[0];
        
        client.get(reverseConversationIdId,(err:any,reply:any)=>{
          if(!reply){
            //create new conversation
            let conversation = [];
            conversation.push(messageData);
            client.set(reverseConversationIdId,JSON.stringify(conversation));
            socket.emit('message_received',conversation);
            socket.to(messageData.to).emit('message_received',conversation);
          }else{
            //add message to conversation
            let conversation = JSON.parse(reply);
            conversation.push(messageData);
            socket.emit('message_received',conversation);
            socket.to(messageData.to).emit('message_received',conversation);
            client.set(reverseConversationIdId,JSON.stringify(conversation));
          }
        })
      }else{
        //add message to conversaton
        let conversation = JSON.parse(reply);
        conversation.push(messageData);
        socket.emit('message_received',conversation);
        socket.to(messageData.to).emit('message_received',conversation);
        client.set(conversationId,JSON.stringify(conversation));
      }
    })
  })

  socket.on('block_user',(data:any)=>{
    client.get("users",(err:any, reply:any)=>{
      if(reply){
        let users = JSON.parse(reply);
        let user = users.findIndex((n_user:any) => n_user.email === data.user);
        if(users[user].blacklistedUsers.indexOf(data.contact) < 0){
          users[user].blacklistedUsers.push(data.contact);
        }else{
          let index = users[user].blacklistedUsers.indexOf(data.contact);
          users[user].blacklistedUsers.splice(index,1);
        }
        client.set("users",JSON.stringify(users));
        io.sockets.emit('users',users);
      }
    })
  })

  socket.on('disconnect',()=>{
    logout();
  })

  socket.on('logout',()=>{
    logout();
  })

  function logout(){
    client.get("users",(err:any, reply:any)=>{
      let users = JSON.parse(reply);
      let index = users.findIndex((n_user:any) => n_user.socketId === socket.id);
      if(index > -1){
        users[index].status = "offline";
        client.set("users",JSON.stringify(users));
        io.sockets.emit('users',users);
      }
    })
  }


});

server.listen(PORT, () => {
  console.log('listening on *:'+PORT);
});