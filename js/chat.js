let socket = io();

socket.on('connect', () => {
  console.log('I am connected');
});

socket.on('disconnect', () => {
  console.log('I am disconnected');
});
