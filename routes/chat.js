const modules = require ('/Users/nikita/Desktop/my_project/custom_modules/modexp.js');
const {generateMessage} = require ('/Users/nikita/Desktop/my_project/utils/message.js');
const {isRealString} = require ('/Users/nikita/Desktop/my_project/utils/isRealString.js');
const {Users} = require ('/Users/nikita/Desktop/my_project/utils/users.js');

const router = express.Router();
// const socketIO = require('socket.io');
let io = require('socket.io')(server, { pingTimeout: 60000 });
let login;
router.get('/', function(req, res) {
  // login = req.session.userLogin;
  res.render('/Users/nikita/Desktop/my_project/views/pages/chat.ejs');
});

let users = new Users();

io.set('transports', ['websocket']);
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join', (params, callback) => {
    if(!isRealString(params.name) || !isRealString(params.room)) {
      return callback('Name and room are require');
    }


    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);
    io.to(params.room).emit('updateUsersList', users.getUserList(params.room));

    socket.emit('newMessage', generateMessage('Admin', `Welcome to the ${params.room}`));

    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} connected to the chat`));
  });


  socket.on('createMessage', (message, callback) => {
let user = users.getUser(socket.id);

if(user && isRealString(message.text)) {
      io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
}
    callback('on the server side');
  });


socket.on('disconnect', () => {
let user = users.removeUser(socket.id);
if (user) {
  io.to(user.room).emit('updateUsersList', users.getUserList(user.room));
  io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left ${user.room}`));
}
});

});

module.exports = router;
