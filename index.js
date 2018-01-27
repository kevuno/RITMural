// Initialize all the libs
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

// Use public folder for the html
app.use(express.static(__dirname + '/public'));

// Setting up socket connection method
function onConnection(socket){
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
}

// Setting up listener connection
io.on('connection', onConnection);
http.listen(port, () => console.log('listening on port ' + port));
