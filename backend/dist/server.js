"use strict";
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var redis = require('redis');
var moment = require('moment');
var path = require('path');
var io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
var client = redis.createClient("redis://:pb32605202600a4264026b0651fe662ea3d69029fba07b06f42a38b916cfc0744@ec2-54-172-142-101.compute-1.amazonaws.com:24159");
client.on('connect', function () {
    console.log("connected to redis");
});
var PORT = 3000;
app.use(express.static(path.resolve(__dirname, '../build')));
app.get('*', function (req, res) {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
});
io.on('connection', function (socket) {
    socket.on('user_online', function (data) {
        //client.del('users');
        client.get("users", function (err, reply) {
            if (!reply) {
                var users = [
                    {
                        email: data.email,
                        picture: data.picture,
                        status: "online",
                        socketId: socket.id,
                        newMessages: 0,
                        blacklistedUsers: []
                    }
                ];
                client.set("users", JSON.stringify(users));
            }
            else {
                var users = JSON.parse(reply);
                var index = users.findIndex(function (n_user) { return n_user.email === data.email; });
                if (index < 0) {
                    //register new user
                    data.socketId = socket.id;
                    users.forEach(function (user) {
                        user.newMessages = 0;
                        if (!user.blacklistedUsers) {
                            user.blacklistedUsers = [];
                        }
                    });
                    users.push(data);
                    client.set("users", JSON.stringify(users));
                }
                else {
                    users[index].socketId = socket.id;
                    users[index].status = 'online';
                    users.forEach(function (user) {
                        user.newMessages = 0;
                        if (!user.blacklistedUsers) {
                            user.blacklistedUsers = [];
                        }
                    });
                    client.set("users", JSON.stringify(users));
                }
                io.sockets.emit('users', users);
            }
        });
    });
    socket.on('get_conversations', function (conversationId) {
        client.get(conversationId, function (err, reply) {
            if (!reply) {
                var reverseConversation = conversationId.split(':');
                var reverseConversationIdId = reverseConversation[1] + ":" + reverseConversation[0];
                client.get(reverseConversationIdId, function (err, reply) {
                    if (reply) {
                        var conversation = JSON.parse(reply);
                        socket.emit('message_received', conversation);
                    }
                    else {
                        socket.emit('message_received', []);
                    }
                });
            }
            else {
                var conversation = JSON.parse(reply);
                socket.emit('message_received', conversation);
            }
        });
    });
    socket.on('send_message', function (messageData) {
        messageData.dateTime = moment().format('MMMM D YYYY, h:mm A');
        var conversationId = messageData.conversation;
        client.get(conversationId, function (err, reply) {
            if (!reply) {
                var reverseConversation = conversationId.split(':');
                var reverseConversationIdId_1 = reverseConversation[1] + ":" + reverseConversation[0];
                client.get(reverseConversationIdId_1, function (err, reply) {
                    if (!reply) {
                        //create new conversation
                        var conversation = [];
                        conversation.push(messageData);
                        client.set(reverseConversationIdId_1, JSON.stringify(conversation));
                        socket.emit('message_received', conversation);
                        socket.to(messageData.to).emit('message_received', conversation);
                    }
                    else {
                        //add message to conversation
                        var conversation = JSON.parse(reply);
                        conversation.push(messageData);
                        socket.emit('message_received', conversation);
                        socket.to(messageData.to).emit('message_received', conversation);
                        client.set(reverseConversationIdId_1, JSON.stringify(conversation));
                    }
                });
            }
            else {
                //add message to conversaton
                var conversation = JSON.parse(reply);
                conversation.push(messageData);
                socket.emit('message_received', conversation);
                socket.to(messageData.to).emit('message_received', conversation);
                client.set(conversationId, JSON.stringify(conversation));
            }
        });
    });
    socket.on('block_user', function (data) {
        client.get("users", function (err, reply) {
            if (reply) {
                var users = JSON.parse(reply);
                var user = users.findIndex(function (n_user) { return n_user.email === data.user; });
                if (users[user].blacklistedUsers.indexOf(data.contact) < 0) {
                    users[user].blacklistedUsers.push(data.contact);
                }
                else {
                    var index = users[user].blacklistedUsers.indexOf(data.contact);
                    users[user].blacklistedUsers.splice(index, 1);
                }
                client.set("users", JSON.stringify(users));
                io.sockets.emit('users', users);
            }
        });
    });
    socket.on('disconnect', function () {
        logout();
    });
    socket.on('logout', function () {
        logout();
    });
    function logout() {
        client.get("users", function (err, reply) {
            var users = JSON.parse(reply);
            var index = users.findIndex(function (n_user) { return n_user.socketId === socket.id; });
            if (index > -1) {
                users[index].status = "offline";
                client.set("users", JSON.stringify(users));
                io.sockets.emit('users', users);
            }
        });
    }
});
server.listen(PORT, function () {
    console.log('listening on *:' + PORT);
});
//# sourceMappingURL=server.js.map