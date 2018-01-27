'use strict';

(function() {
  // Setting up succcet
  var socket = io();

  // Setting up canvas
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var context = canvas.getContext('2d');

  // Default ink color
  var current = {
    color: 'black'
  };
  var drawing = false;

  // Setting up listeners
  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);

  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }
  // Socket Listener 
  socket.on('drawing', onDrawingEvent);

  window.addEventListener('resize', onResize, false);
  onResize();

  /**
   * Draws a line in the canvas
   * @param x0: Initial x coordinate
   * @param y0: Initial y coordinate
   * @param x1: Final x coordinate
   * @param y1: Final y coordinate 
   * @param color: Color of the line to be draw
   * @param emit: Whether or not to emit a message to the socket (to only emmit local lines)
   */
  function drawLine(x0, y0, x1, y1, color, emit){
    console.log("Line at (" + x0 + "," + y0 + ") and (" + x1 + "," + y1 + ")");
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = getLineWidth();
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
      color: color
    });
  }
  
  /**
   * On Mouse down event
   * @param e: The even object containing the new coordinates
   */
  function onMouseDown(e){
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
  }

  /**
   * On Mouse up event
   * @param e: The even object containing the new coordinates
   */
  function onMouseUp(e){
    if (!drawing) { return; }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
  }

  /**
   * On Mouse move event
   * @param e: The even object containing the new coordinates
   */
  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  /**
   * On color change event. Gets the color from the css class
   * @param e: The even object containing the target to look for the color
   */
  function onColorUpdate(e){
    current.color = e.target.className.split(' ')[1];
  }

  
  /**
   * Event that limit the number of events per second. Useful for onMouse move
   * @param callback: Method to execute after the throttle was executed
   * @param delay: Delay between each call
   */
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  /**
   * Main method called from socket listener to draw a line segment
   * @param data: The data of the line to draw
   */
  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    // console.log("Line at (" + data.x0 + "," + data.y0 + ") and (" + data.x1 + "," + data.y1 + ")");
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  /**
   * Make the canvas fill its parent
   */
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function testSquare(){
    var lines =  [
      {
          "x0": 500,
          "y0": 500,
          "x1": 600,
          "y1": 500
      },{
          "x0": 600,
          "y0": 500,
          "x1": 600,
          "y1": 600
      },{
          "x0": 600,
          "y0": 600,
          "x1": 500,
          "y1": 600
      },{
          "x0": 500,
          "y0": 600,
          "x1": 500,
          "y1": 500
      }
    ];

    lines.forEach(function(line){
      drawLine(line.x0, line.y0, line.x1, line.y1, current.color, true);
    });
    
  }
  // testSquare();
  function getLineWidth() {
      var slider = document.getElementById("widthslider");
      var output = document.getElementById("width-output");
      output.innerHTML = slider.value;

      slider.oninput = function () {
          output.innerHTML = this.value;
      }

  }


})();
