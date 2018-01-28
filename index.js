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

  // Set up listener for loading timelapse
  socket.on('load_timelapse', (data) => {
      console.log("loading time lapse");
    
      var MongoClient = mongo.MongoClient;
      // var url = process.env.MONGODB_URI;
      var url = "mongodb://localhost:27017/";
  
      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mural"); // Select db
        //var dbo = db.db("heroku_9x9gsclt"); // Select db
        dbo.collection("mural").find({}).toArray(function(err, result) {
          if (err) throw err;
          socket.emit('timelapse', result);
          // console.log(result);
          db.close();
        });
    
      });
  });  

}
// Setting up listener connection
io.on('connection', onConnection);
http.listen(port, () => console.log('listening on port ' + port));

// Load drawings from Database
io.on('connect', loadDrawings);

/**
 * Loads all entries in db to initialize the canvas with the drawings
 * @param socket: The socket to make calls to in the client
 */
function loadDrawings(socket){

  var MongoClient = mongo.MongoClient;
  var url = process.env.MONGODB_URI;
  //var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    //var dbo = db.db("mural"); // Select db
    var dbo = db.db("heroku_9x9gsclt"); // Select db
    dbo.collection("mural").find({}).toArray(function(err, result) {
      if (err) throw err;
      result.forEach(line => {
        socket.emit('drawing',line);
      });
      // console.log(result);
      db.close();
    });

  });

}



// Load drawings from Database
io.on('load_timelapse', loadDrawingsTimeLapse);

/**
 * Loads all entries in db to initialize the canvas with the drawings
 * @param socket: The socket to make calls to in the client
 */
function loadDrawingsTimeLapse(socket){
  console.log("loading time lapse");

  var MongoClient = mongo.MongoClient;
  // var url = process.env.MONGODB_URI;
  var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("mural"); // Select db
    //var dbo = db.db("heroku_9x9gsclt"); // Select db
    dbo.collection("mural").find({}).toArray(function(err, result) {
      if (err) throw err;
      socket.emit('timelapse', result);
      // console.log(result);
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
    //var url = "mongodb://localhost:27017/";

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    //var dbo = db.db("mural"); // Select db
    var dbo = db.db("heroku_9x9gsclt"); // Select db
    dbo.collection("mural").insertOne(data, function(err, res) {
      if (err) throw err;
      db.close();
    });
  });

}


let hasExploded = false;
//clear canvas at a specified time
function clearCanvas() {

  var current = new Date();
  var time = current.getHours() + ":" + current.getMinutes() + ":" + current.getSeconds();
  console.log(time);
  if (time >= "7:11:0" && time <= "7:11:10") {
      console.log("explosion!");
      io.emit("explosion",{});

      if(!hasExploded){
        // Delete all records from db if it has not happened
        var MongoClient = mongo.MongoClient;
         var url = process.env.MONGODB_URI;
        //var url = "mongodb://localhost:27017/";
        
        MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          //var dbo = db.db("mural"); // Select db
          var dbo = db.db("heroku_9x9gsclt"); // Select db
          dbo.collection("mural").drop(function(err, res) {
            if (err) throw err;
            if (res) console.log("Canvas db cleared");
            db.close();
          });
        });
      }
      hasExploded = true;
      return true;
  }
  return false;
}

// setInterval( function(){clearCanvas(hasExploded); }, );

function createInterval(f,dynamicParameter,interval) {
  setInterval(function(){
    f(dynamicParameter);
  }, interval);
}
createInterval(clearCanvas,hasExploded,1000);