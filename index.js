// Initialize all the libs
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const mongo = require('mongodb');

// Use public folder for the html
app.use(express.static(__dirname + '/public'));


/**
 * Initial server connection. This function gets executed
 * when the server gets activated for the first time
 * @param socket: The socket to comunicate with
 */
function onConnection(socket){
  // Set up listener on channel drawing
  socket.on('drawing', (data) =>{
    // Emit to all on channel drawing, to update on new drawing
    socket.broadcast.emit('drawing', data);

      saveLineToDB(data, socket);

  });
}

// Setting up listener connection
io.on('connection', onConnection);
http.listen(port, () => console.log('listening on port ' + port));

// Load drawings from Database
io.on('connect', loadDrawings);



//==============

//the window reload function. you could of course do anything here
function forceMidnightPageReload() {
  var MongoClient = mongo.MongoClient;
  var url = process.env.MONGODB_URI;

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("heroku_9x9gsclt"); // Select db
    dbo.collection("mural").remove();
      db.close();

  });

}

//helper function to build up the desire time trigger
function forceMidnightPageReloadGetTargetTime(hour,minute) {
  var t = new Date();
  t.setHours(hour);
  t.setMinutes(minute);
  t.setSeconds(0);
  t.setMilliseconds(0);
  return t;
}

//get your offset to wait value
var timetarget = forceMidnightPageReloadGetTargetTime(1,45).getTime();
var timenow =  new Date().getTime();
var offsetmilliseconds = timetarget - timenow;

//if it isn't midnight yet, set a timeout.
if (offsetmilliseconds &gt;= 0){
setTimeout(function(){forceMidnightPageReload();}, offsetmilliseconds);
}

//==============


/**
 * Loads all entries in db to initialize the canvas with the drawings
 * @param socket: The socket to make calls to in the client
 */
function loadDrawings(socket){

  var MongoClient = mongo.MongoClient;
  var url = process.env.MONGODB_URI;

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("heroku_9x9gsclt"); // Select db
    dbo.collection("mural").find({}).toArray(function(err, result) {
      if (err) throw err;
      result.forEach(line => {
        socket.emit('drawing',line);
      });
      console.log(result);
      db.close();
    });

  });

}

/**
 * Saves a drawing to the database
 * @param data: The data of the line to be saved
 * @param socket: The socket of the connection to communicate with the front end
 */
function saveLineToDB(data, socket){
  // Save new line to database

  var MongoClient = mongo.MongoClient;

    var url = process.env.MONGODB_URI;


  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("heroku_9x9gsclt"); // Select db
    dbo.collection("mural").insertOne(data, function(err, res) {
      if (err) throw err;
      db.close();
    });
  });

}
