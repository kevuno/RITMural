'use strict';

(function() {
  // Setting up succcet
  var socket = io();

  // Setting up canvas
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var color_picker = document.getElementById('color_picker');
  var eraser = document.getElementById('erase');
  var context = canvas.getContext('2d');

  // Default ink color
  var current = {
    color: 'black'
  };
  var drawing = false;



  // Socket Listener for the drawing channel
  socket.on('timelapse', onTimelapseEvent);
  window.addEventListener('resize', onResize, false);
  onResize();


  /**
   * Main method called from socket listener to draw a line segment
   * @param data: The data of the line to draw
   */
  function onTimelapseEvent(data){
    console.log("Resizing");
    console.log(data);
    var w = canvas.width;
    var h = canvas.height;
    // console.log("Line at (" + data.x0 + "," + data.y0 + ") and (" + data.x1 + "," + data.y1 + ")");
    // data.forEach(element => {
    //   drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.width);
    //   wait(100); 
    // });
    var i = 0;

    (function loopIt(i) {
      setTimeout(function(){
          // your code handling here
          console.log(data[i]);
          drawLine(data[i].x0 * w, data[i].y0 * h, data[i].x1 * w, data[i].y1 * h, data[i].color, data[i].width);
          if(i < data.length - 1)  loopIt(i+1)
        }, 1);
    })(i)
    
  }

  /**
   * Draws a line in the canvas
   * @param x0: Initial x coordinate
   * @param y0: Initial y coordinate
   * @param x1: Final x coordinate
   * @param y1: Final y coordinate 
   * @param color: Color of the line to be draw
   * @param emit: Whether or not to emit a message to the socket (to only emmit local lines)
   */
  function drawLine(x0, y0, x1, y1, color, width, emit){
    console.log("Line at (" + x0 + "," + y0 + ") and (" + x1 + "," + y1 + ")");
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = width;
    context.stroke();
    context.closePath();

    if (!emit) { return; }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color,
      width: width
    });
  }
  


  /**
   * Make the canvas fill its parent
   */
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function getLineWidth() {
      return document.getElementById("widthslider").value;
  }
  console.log(socket);  
  socket.emit('load_timelapse');


})();
