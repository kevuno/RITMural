'use strict';


(function() {
  var lines = [];

  function redrawLines(lines, canvas_w, canvas_h){
    console.log("redrawwinggg " + lines.length)
    lines.forEach(line => {
      drawLine(line.x0 * canvas_w, line.y0 * canvas_h, line.x1 * canvas_w, line.y1 * canvas_h,
              line.color, line.width, false);
    });
  }



  var img = new Image;
  // Setting up succcet
  var socket = io();

  // Setting up canvas
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var color_picker = document.getElementById('color_picker');
  var eraser = document.getElementById('erase');
  var context = canvas.getContext('2d');

  // Add transformations to canvas
  trackTransforms(context);
        
  function redraw(){
      // Clear the entire canvas
      var p1 = context.transformedPoint(0,0);
      var p2 = context.transformedPoint(canvas.width,canvas.height);
      console.log(p1,p2,context);
      context.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);

      context.save();
      context.setTransform(1,0,0,1,0,0);
      context.clearRect(0,0,canvas.width,canvas.height);
      context.restore();

      context.drawImage(img,100,100);
      redrawLines(lines, canvas.width, canvas.height);

  }
  redraw();

  img.src = 'zoom/dood.jpg';


  var lastX=canvas.width/2, lastY=canvas.height/2;

  //var dragStart,dragged;

  // canvas.addEventListener('mousedown',function(evt){
  //     document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
  //     lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
  //     lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
  //     dragStart = context.transformedPoint(lastX,lastY);
  //     dragged = false;
  // },false);

  // canvas.addEventListener('mousemove',function(evt){
  //     lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
  //     lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
  //     dragged = true;
  //     if (dragStart){
  //         var pt = context.transformedPoint(lastX,lastY);
  //         console.log(pt);
  //         context.translate(pt.x-dragStart.x,pt.y-dragStart.y);
  //         redraw();
  //         }
  // },false);

  // canvas.addEventListener('mouseup',function(evt){
  //     dragStart = null;
  //     if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
  // },false);

  var scaleFactor = 1.1;
  var inverse_factor = 1;
  var zoom = function(clicks){
      console.log(clicks);
      var pt = context.transformedPoint(lastX,lastY);
      context.translate(pt.x,pt.y);
      var factor = Math.pow(scaleFactor,clicks);
      console.log(pt);
      inverse_factor = (1/Math.pow(1.1 * factor, -1 * clicks));
      context.scale(factor,factor);
      context.translate(-pt.x,-pt.y);
      redraw();
  }

  var handleScroll = function(evt){
      var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
      if (delta) zoom(delta);
      return evt.preventDefault() && false;
  };

  canvas.addEventListener('DOMMouseScroll',handleScroll,false);
  canvas.addEventListener('mousewheel',handleScroll,false);

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
  socket.on('drawing_initial', onDrawingInitEvent);
  window.addEventListener('resize', onResize, false);
  onResize();


  /**
   * Main method called from socket listener to draw a line segment
   * @param data: The data of the line to draw
   */
  function onDrawingEvent(data){
    lines.push(data);
    var w = canvas.width;
    var h = canvas.height;
    // console.log("Line at (" + data.x0 + "," + data.y0 + ") and (" + data.x1 + "," + data.y1 + ")");
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color, data.width);
  }
  
  /**
   * Main method called from socket listener to draw a line segment
   * @param data: The data of the line to draw
   */
  function onDrawingInitEvent(data){
    lines.push(data);
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
    // console.log("Line at (" + x0 + "," + y0 + ") and (" + x1 + "," + y1 + ")");
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
    console.log("MOUSE DOWN");
    console.log(current.x, e.clientX);
    console.log(current.y, e.clientY);
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
    var w = canvas.width;
    var h = canvas.height;
    lines.push({
      x0: (current.x * inverse_factor) / w,
      y0: (current.y * inverse_factor) / h,
      x1: (e.clientX * inverse_factor) / w,
      y1: (e.clientY * inverse_factor) / h,
      color: current.color,
      width: getLineWidth()

    });
    drawLine(current.x * inverse_factor, current.y * inverse_factor, e.clientX * inverse_factor, e.clientY * inverse_factor, current.color, getLineWidth(), true);
  }

  /**
   * On Mouse move event
   * @param e: The even object containing the new coordinates
   */
  function onMouseMove(e){
    if (!drawing) { return; }

    var w = canvas.width;
    var h = canvas.height;
    lines.push({
      x0: (current.x * inverse_factor) / w,
      y0: (current.y * inverse_factor) / h,
      x1: (e.clientX * inverse_factor) / w,
      y1: (e.clientY * inverse_factor) / h,
      color: current.color,
      width: getLineWidth()

    });
    drawLine(current.x * inverse_factor, current.y * inverse_factor, e.clientX * inverse_factor, e.clientY * inverse_factor , current.color, getLineWidth(), true);
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



  // Adds context.getTransform() - returns an SVGMatrix
  // Adds context.transformedPoint(x,y) - returns an SVGPoint
  function trackTransforms(context){
    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var xform = svg.createSVGMatrix();
    context.getTransform = function(){ return xform; };

    var savedTransforms = [];
    var save = context.save;
    context.save = function(){
        savedTransforms.push(xform.translate(0,0));
        return save.call(context);
    };

    var restore = context.restore;
    context.restore = function(){
        xform = savedTransforms.pop();
        return restore.call(context);
    };

    var scale = context.scale;
    context.scale = function(sx,sy){
        xform = xform.scaleNonUniform(sx,sy);
        return scale.call(context,sx,sy);
    };

    var rotate = context.rotate;
    context.rotate = function(radians){
        xform = xform.rotate(radians*180/Math.PI);
        return rotate.call(context,radians);
    };

    var translate = context.translate;
    context.translate = function(dx,dy){
        xform = xform.translate(dx,dy);
        return translate.call(context,dx,dy);
    };

    var transform = context.transform;
    context.transform = function(a,b,c,d,e,f){
        var m2 = svg.createSVGMatrix();
        m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
        xform = xform.multiply(m2);
        return transform.call(context,a,b,c,d,e,f);
    };

    var setTransform = context.setTransform;
    context.setTransform = function(a,b,c,d,e,f){
        xform.a = a;
        xform.b = b;
        xform.c = c;
        xform.d = d;
        xform.e = e;
        xform.f = f;
        return setTransform.call(context,a,b,c,d,e,f);
    };

    var pt  = svg.createSVGPoint();
    context.transformedPoint = function(x,y){
        pt.x=x; pt.y=y;
        return pt.matrixTransform(xform.inverse());
    }
  }




  /**
   * Gets the current line width
   */
  function getLineWidth() {
      return document.getElementById("widthslider").value;
  }

  /**
   * Erase function
   */
  function erase(){
    current.color = 'white';
    console.log('erase');
  }

})();
