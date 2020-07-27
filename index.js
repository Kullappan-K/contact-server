const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const {addUser, removeUser, getUser, getRoom, getAllUser}  = require('./users');

const port = process.env.port || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

function removeStaticUser(contactList, active){
    return contactList.filter((value) => {
        return active.indexOf(value.trim().toLowerCase()) === -1;
    });
}

var userList = [];

io.on('connection', (socket) => {
    socket.on('join', ({name, room},callback) => {

        const {error, user} = addUser({id : socket.id, name, room});

        if(error){
            return callback(error);
        }
        socket.emit('message', {user: 'admin', text: `${user.name}, welcome ${user.room}`});
        socket.broadcast.to(user.room).emit('message', {user:'admin', text: `${user.name}, is joined`});
        io.to(user.room).emit('roomData', {room:user.room, users: getRoom(user.room)}) 
        socket.join(user.room);
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', {user: user.name, text:message});
        io.to(user.room).emit('roomData', {user: user.name, users: getRoom(user.room)});
        callback(); 
    });


    socket.on('disconnect', ()=> {
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message', {user:'admin', text:`${user.name} has left`});
        }
        var dupUser = getAllUser();
        userList = [];
        dupUser.map( data => {
            userList.push(data.name);
         });
    });
    socket.on('getAllUser', ({name}, callback) => {
        var contactList = ['Alex', 'Harris', 'Josh', 'Michael', 'John', 'Chris'];
        userList.push(name.trim().toLowerCase());
        var user = [];
        var clientList = [];
        if(user.length == 0){
            //console.log(userList);
            clientList = userList;
        }else{
            user = getAllUser();
            user.map( data => {
               clientList.push(data.name);
            });
        }
        contactList = removeStaticUser(contactList, clientList);
        callback(contactList);
    });
    socket.on('chatActiveUser', ({name}, callback) => {
        var contactList = ['Alex', 'Harris', 'Josh', 'Michael', 'John', 'Chris'];
        //userList.push(name.trim().toLowerCase());
        var user = [];
        var clientList = [];
        clientList.push(name.trim().toLowerCase());
        contactList = removeStaticUser(contactList, clientList);
        callback(contactList);
    });
});

app.use(router);
app.use(cors());

server.listen(port, () => console.log(`server is running ${port}`));