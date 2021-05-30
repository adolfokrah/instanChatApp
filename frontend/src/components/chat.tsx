import {Card,CardContent,Grid,Box, Avatar,Typography, Button, Icon} from '@material-ui/core';

import UserListItem from './userListItem';
import './Chat.css';
import MessageBox from './messageBox';
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, useRef } from 'react';
import socketIOClient from "socket.io-client";

const socketIoHost:string = process.env.REACT_APP_SOCKET_IO_END_POINT as string;

var socket = socketIOClient(socketIoHost);

interface Message{
    message:string,
    dateTime:string,
    sender: string,
    to: string
}
interface User{
    email: string;
    picture: string;
    status: string;
    socketId: string;
    newMessages: number;
    blocked: false;
    blacklistedUsers: any;
}
const Chat=()=>{
    const { user,logout } = useAuth0();
    const [users,setUsers] = useState<User[]>([]);
    const [conversation,setConversation] = useState("");
    const [contactIndex, setContactIndex] = useState<number>(-1);
    const [message, setMessage] = useState<string>("");
    const [messages,setMessages] = useState<Message[]>([]);  
    const [newMessages, setNewMessages] = useState<Message[]>([]);
    
    useEffect(()=>{
     let userData = {
         email: user?.email,
         picture: user?.picture,
         status: "online"
     }
     socket.emit("user_online",userData);
     socket.on('users',(data:any)=>{
        let index = data.findIndex((n_user:any) => n_user.email === user?.email);
        
        data.forEach((n_user:any) => {
             let foundUser=data[index].blacklistedUsers.indexOf(n_user.email);
            if(foundUser > -1){
                n_user.blocked = true;
            }else{
                n_user.blocked = false;
            }
        });
        data.splice(index,1);
        setUsers(data);
     })

     socket.on('message_received',messageData=>{
        setNewMessages(messageData); 
     })

    },[])

    useEffect(()=>{

        
        if(newMessages.length === 0){
           setMessages(newMessages);
        }else if(conversation.indexOf(newMessages[newMessages.length-1].sender) > -1){
           setMessages(newMessages);
        }else{
            //alert user of new message
            let sender = newMessages[newMessages.length-1].sender;
            let index = users.findIndex((n_user:any) => n_user.email === sender);
            let new_users_array = [...users];
            new_users_array[index].newMessages +=1;
            setUsers(new_users_array);
        }
    },[newMessages])



    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef!.current!.scrollTop = messagesEndRef!.current!.scrollHeight;
    }

    useEffect(scrollToBottom, [messages]);

    const logUserOut=()=>{
        socket.emit('logout',user);
        logout({ returnTo: window.location.origin });
    }

    const setConversationMtd=(index: number)=>{
        setContactIndex(index);
        let conversationId = users[index].email+":"+user?.email;
        setConversation(conversationId);
        socket.emit('get_conversations',conversationId);

           //reset new messages
           let new_users_array = [...users];
           new_users_array[index].newMessages = 0;
          setUsers(new_users_array);
    }

    const sendMessage=(e:any)=>{

        e.preventDefault();
        if(message.trim().length < 1){
            return;
        }
        if(users[contactIndex].blocked){
            alert('You blocked this contact');
            return;
        }
        let messageData = {
            message: message,
            sender: user?.email,
            to: users[contactIndex].socketId,
            conversation: conversation
        };
        setMessage("");
        socket.emit('send_message',messageData);
    }

    const blockUnblockContact =(email:string)=>{
       socket.emit('block_user',{user: user?.email,contact:email})
    }

    return (
        <Card elevation={0} className="chat-box">
            <CardContent className="chat-box-content">
                <Grid container direction="row" className="grid-container">
                    <Grid item xs={3} className="left-pane"> 
                      <Box className="current-user">
                          <Avatar src={user?.picture}/>
                          <Typography className="user-name">{user?.email}</Typography>
                      </Box>

                      <Box className="users-title">
                            <Typography>Users</Typography>
                      </Box>
                      <Box className="users-list">
                         {users.map((contact,index)=>(
                             <div key={index}>
                              {contact.status === 'online' && contact.blacklistedUsers.indexOf(user?.email) < 0 ? 
                              <UserListItem blockUnblockContact={()=>{blockUnblockContact(contact.email)}} blocked={contact.blocked} onClick={()=>{setConversationMtd(index)}} key={index} email={contact.email} photo={contact.picture} status={contact.status} newMessages={contact.newMessages}/>
                              : null}
                             </div>
                         ))}
                      </Box>
                    </Grid>
                    <Grid item xs={9} className="right-pane">
                        <Box className="right-pane-top-bar">
                            {conversation === "" ? <Box></Box>  : <Box className="top-bar-title">
                                <Avatar className="avatar" src={users[contactIndex].picture} alt="adolfokrah@gmail.com"/>
                                <Typography>{users[contactIndex].email}</Typography>
                            </Box>}
                            <Button onClick={logUserOut} variant="contained" style={{backgroundColor:"#4ed6f0", color:"white"}} disableElevation>LOGOUT</Button>
                        </Box>
                        <div className="chat-body" ref={messagesEndRef}>
                            {conversation === "" ? <Typography>Please select a contact to chat with</Typography> :
                             <>
                                {messages.map((message,index)=>(
                                 <MessageBox key={index} message={message.message} dateTime={message.dateTime} fromSender={message.sender === user?.email ? true : false}/>
                                ))}
                             </>
                            }
                        </div>
                        <form className="message-box" onSubmit={sendMessage}>
                            <input onChange={(e)=>setMessage(e.target.value)} value={message} disabled={conversation === '' ? true : false} className="text-input" type="text" placeholder="Type your message"/>
                            <Button
                                    disableElevation
                                    className="sendBtn"
                                    variant="contained"
                                    color="primary"
                                    endIcon={<Icon>send</Icon>}
                                    disabled={conversation === '' ? true : false}
                                    onClick={sendMessage}
                            >
                             SEND
                            </Button>
                        </form>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

export default Chat;