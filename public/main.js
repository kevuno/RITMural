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

  // Setting up listeners
  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 10), false);
  
  /** ==== Setting up listeners for mobile  ==== **/
  canvas.addEventListener("touchstart", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, false);

  canvas.addEventListener("touchend", function (e) {
    var mouseEvent = new MouseEvent("mouseup", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, false);
  
  canvas.addEventListener("touchmove", function (e) {
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, false);

  /** ==== Prevent scrolling for mobile  ==== **/
  document.body.addEventListener("touchstart", function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  }, false);
  document.body.addEventListener("touchend", function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  }, false);
  document.body.addEventListener("touchmove", function (e) {
    if (e.target == canvas) {
      e.preventDefault();
    }
  }, false);

  /** ==== Setting up listeners for colors  ==== **/
  for (var i = 0; i < colors.length; i++){
    colors[i].addEventListener('click', onColorUpdate, false);
  }
  color_picker.addEventListener('change', onColorPicked, false);

  /** ==== Setting up listeners for eraser  ==== **/
  eraser.addEventListener('click', erase ,false )


  // Socket Listener for the drawing channel
  socket.on('drawing', onDrawingEvent);
  window.addEventListener('resize', onResize, false);
  onResize();


  /**
   * Main method called from socket listener to draw a line segment
   * @param data: The data of the line to draw
   */
  function onDrawingEvent(data){
    var w = canvas.width;
    var h = canvas.height;
    // console.log("Line at (" + data.x0 + "," + data.y0 + ") and (" + data.x1 + "," + data.y1 + ")");
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.width);
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
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, getLineWidth(), true);
  }

  /**
   * On Mouse move event
   * @param e: The even object containing the new coordinates
   */
  function onMouseMove(e){
    if (!drawing) { return; }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, getLineWidth(), true);
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
  function onColorPicked(e){
    current.color = e.target.value;
    console.log(current.color);
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
   * Make the canvas fill its parent
   */
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function getLineWidth() {
      return document.getElementById("widthslider").value;
  }

  var slider = document.getElementById("widthslider");
  //erase function
  function erase(){
    current.color = 'white';
    console.log('erase');
  }
  var hasExploded = false;
  // Socket Listener for the bomb channel
  socket.on('explosion', onBombEvent);

  function onBombEvent(data){
    if(!hasExploded){
      console.log("explosion!");
      alert("The canvas will be reset now!");
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    hasExploded = true;
  }




})();
