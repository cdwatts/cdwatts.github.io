//Claire Watts
//cdwatts@ucsc.edu

//*********************//
//vertex shader program//
//*********************//
var VSHADER = 
    'attribute vec4 a_position;\n' + //retrieve position from javascript
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' +
    'uniform mat4 u_mvpMatrix;\n' +
    'void main() {\n' +
    '   gl_Position = u_mvpMatrix * a_position;\n' +
    '   v_TexCoord = a_TexCoord;\n' +
    '   gl_PointSize = 10.0;\n' +
    '}\n';

//***********************//
//fragment shader program//
//***********************//
var FSHADER =
    'precision mediump float;\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
    '}\n';

//*************//
//main function//
//*************//
function main() {
    //retrieve canvas element
    var canvas = document.getElementById('webgl');
    if (!canvas) {
        console.log('Failed to retrieve <canvas> element');
        return;
    }

    //get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    
    //initialize shaders
    if (!initShaders(gl, VSHADER, FSHADER)) {
        console.log('Failed to initialize shaders');
        return;
    }
    
    //get storage locations
    var a_position = gl.getAttribLocation(gl.program, 'a_position');
    if (a_position < 0) {
        console.log('Failed to get the storage location of a_position');
        return -1;
    }
    
    // Set the eye point and the viewing volume
    var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
    
    if(orthoProj){
        mvpMatrix.setOrtho(-500, 500, -500, 500, -500, 500);
        mvpMatrix.lookAt(eyeXo, eyeYo, 4, atXo*2, atYo*2, 0, 0, 1, 0);
    }else{
        mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100*500);
        mvpMatrix.lookAt(eyeX*500, eyeY*500, 4*500, atX*500, atY*500, 0, 0, 1, 0);
    }
    gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);

    //register event functions to be called
    canvas.onmousedown = function(ev) {click(ev, gl, canvas);};
    canvas.onmousemove = function(ev) {move(ev, gl, canvas);};
    canvas.onmouseup = function(ev) {mouseUp(ev, gl, canvas);};

    //enable hidden surface removal
    gl.enable(gl.DEPTH_TEST);  
    
    return gl;
}  

var buttonC = false; //boolean for createSOR when button is clicked
var stop = false; //boolean for stopping the draw-on-move thing
var orthoProj = true;
var lastButton = null;

//panning
var mvpMatrix = new Matrix4();
var panning = false;
var disx = 0;
var disy = 0;
var eyeX = 0;
var eyeY = 0;
var eyeXo = 0;
var eyeYo = 0;
var atX = 0;
var atY = 0;
var atXo = 0;
var atYo = 0;

//**********************//
//ARRAYS for created SOR//
//**********************//
var shape = []; //stores lines
var polyLine = []; //stores points in each line of shape
var points = []; //stores clicked points
var pointColor = []; //stores colors of clicked points
var vert = []; //stores SOR vertices
var ind = []; //stores order of vertices
var text = []; //stores texture per vertex

function moveOn() {
    stop = true;
    panning = true;
}

function coord(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

function sorObject(v, i, t) {
    this.vertex = v;
    this.index = i;
    this.text = t;
}

function makeObject(){
    var M = new sorObject(vert, ind, text);
    return M;
}

//************************************************//
//projToggle function: run when button is clicked//
//************************************************//
function projToggle() {
    var P = makeObject();
    vert = P.vertex;
    ind = P.index;
    text = P.text;
    
    if (orthoProj === true) {
        orthoProj = false;
        gl = main();
        drawSOR(gl);
    }else if (orthoProj === false){
        orthoProj = true;
        gl = main();
        drawSOR(gl);
    }
}

//*************************************************//
//buttonCreate function: run when button is clicked//
//*************************************************//
function buttonCreate() {
    shape = [];
    polyLine = []; 
    points = []; 
    pointColor = []; 
    vert = []; 
    ind = []; 
    stop = false;
    buttonC = true;
    panning = false;
}

//***************************************************************//
//mouseUp function: calculate displacement when mouse is released//
//***************************************************************//
function mouseUp(ev, gl, canvas){
    var x = ev.clientX; //x coord of click
    var y = ev.clientY; //y coord of click
    var rect = ev.target.getBoundingClientRect();

    //translates cooridinates based on canvas size
    x = 500*((x - rect.left) - canvas.width/2) / (canvas.width/2);
    y = 500*(canvas.height/2 - (y - rect.top)) / (canvas.height/2);

    disx = x - disx;
    disy = y - disy;

    if ((disx>5 || disx<-5 || disy>5 || disy<-5) && lastButton===0){
        pan();
    }   
}

//*********************************************//
//pan function: pans eyeX & eyeY for both views//
//*********************************************//
function pan(){
    console.log("panning", panning);
    if(Math.abs(disx) > Math.abs(disy+10)){ //horizontal
        if(disx>0){ //pan right
            if(!orthoProj){eyeX+=1; atX+=0.1;}
            else{eyeXo+=1; atXo+=1;}
            console.log("pan right");
        }else{ //pan left
            if(!orthoProj){eyeX-=1; atX-=0.1;}
            else{eyeXo-=1; atXo-=1;}
            console.log("pan left");
        }
    }else if(Math.abs(disy) > Math.abs(disx+10)){ //vertical
        if(disy>0){ //pan up
            if(!orthoProj){eyeY+=1; atY+=0.1;}
            else{eyeYo+=1; atYo+=1;}
            console.log("pan up");
        }else{ //pan down
            if(!orthoProj){eyeY-=1; atY-=0.1;}
            else{eyeYo-=1; atYo-=1;}
            console.log("pan down");
        }
    } 
    gl = main();
    drawSOR(gl);
}

//***********************************************************//
//createSOR function: Takes the clicked points and calculates//
//the new points for every 10 degree rotation of the polyline//
//***********************************************************//
function createSOR(){     
    for (var angle=10; angle<=360; angle+=10){
        var theta = ((angle * Math.PI) / 180);
        var currentLine = shape[0];
        polyLine = [];

        for (var i = 0; i < currentLine.length; i++) {
            var coordIterator = currentLine[i];
            var x = (Math.cos(theta) * coordIterator.x) - (Math.sin(theta) * coordIterator.z);
            var y = coordIterator.y;
            var z = (Math.cos(theta) * coordIterator.z) + (Math.sin(theta) * coordIterator.x);
            polyLine.push(new coord(x, y, z));
        }
        shape.push(polyLine);
    }
}

//********************************************************//
//calcVertices function: Populates the vert and ind arrays//
//********************************************************//
function calcVertices(){
    var countX = 1.0/(shape.length-1);
    var countY = 1.0/(shape[0].length-1);
    var currLeft = 1.0;
    var currRight = 1.0-countX;
    var currTop = 1.0;
    var currBot = 1.0-countY;
        
    for (var i=0; i<shape[0].length-1; i++) {
        for (j=0; j<shape.length-1; j++) {
            
            var index = (vert.length/3);
            var currentLine = shape[j];
            var nextLine = shape[j+1];
            var thirdLine = shape[j+2];

            //push four points to make polygon
            vert.push(currentLine[i].x, currentLine[i].y, currentLine[i].z);
            vert.push(currentLine[i + 1].x, currentLine[i + 1].y, currentLine[i + 1].z);
            vert.push(nextLine[i + 1].x, nextLine[i + 1].y, nextLine[i + 1].z);
            vert.push(nextLine[i].x, nextLine[i].y, nextLine[i].z); 
            
            //push on four textures for polygon
            text.push(currLeft, currTop, 0.0); //top left
            text.push(currLeft, currBot, 0.0); // bottom left
            text.push(currRight, currBot, 0.0); // bottom right
            text.push(currRight, currTop, 0.0); //top right

            
            //1st triangle in poly
            ind.push(index, index + 1, index + 2); //0,1,2
            //2nd triangle in poly
            ind.push(index, index + 2, index + 3); //0,2,3
            
            currLeft = currLeft-countX;
            currRight = currRight-countX;
        } 
        currTop = currTop-countY;
        currBot = currBot-countY;
        currLeft = 1.0;
        currRight = 1.0-countX;
    }
}

//*************************************************************//
//click function: draws connecting lines from left mouse clicks//
//*************************************************************//
function click(ev, gl, canvas) {
    lastButton = ev.button;
    
    var x = ev.clientX; //x coord of mouse
    var y = ev.clientY; //y coord of mouse
    var z = 0; //z coord of mouse
    var rect = ev.target.getBoundingClientRect();

    //translates coordinates based on canvas size
    x = 500*((x - rect.left) - canvas.width/2) / (canvas.width/2);
    y = 500*(canvas.height/2 - (y - rect.top)) / (canvas.height/2);

    disx = x;
    disy = y;
    
    if(buttonC === true){
        //push coords onto array
        polyLine.push(new coord(x, y, z));
        points.push(x); points.push(y); points.push(z);
        pointColor.push(0.0); pointColor.push(1.0); pointColor.push(0.0);

        //echos clicked points to console
        if (lastButton === 0){
            console.log('Left click: (',x,',', y,',', z,')');
            //draw connecting line
            drawClicked(gl); 
        } else if (lastButton === 2){
            console.log('Right click: (',x,',', y,',', z,')');
            moveOn; //sets stop to true
            buttonC = false;
            shape.push(polyLine);
            createSOR();
            calcVertices();
            drawSOR(gl);
        }
    }
}

//**************************************************************//
//move function: draws rubberband line to current mouse position//
//**************************************************************//
function move(ev, gl, canvas) {
    if (buttonC === true){
        var x = ev.clientX; //x coord of mouse
        var y = ev.clientY; //y coord of mouse
        var z = 0; //z coord of mouse
        var rect = ev.target.getBoundingClientRect();

        //translates cooridinates based on canvas size
        x = 500*((x - rect.left) - canvas.width/2) / (canvas.width/2);
        y = 500*(canvas.height/2 - (y - rect.top)) / (canvas.height/2);

        if (stop === false){
            //push coords onto array
            points.push(x); points.push(y); points.push(z);
            pointColor.push(0.0); pointColor.push(1.0); pointColor.push(0.0);
        }
    
        //draw 
        drawClicked(gl);
        
        if (stop === false) {
            //pop off last mouse position from array
            points.pop(); points.pop(); points.pop();
            pointColor.pop(); pointColor.pop(); pointColor.pop(); 
        }
    }
}

//********************************************************//
//drawClicked function: clears canvas, draws clicked lines//
//********************************************************//
function drawClicked(gl, a_position) {
    //set color to white and clear canvas
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    //set positions of the vertices
    var n = initVertexBuffers(gl, a_position, points, ind, pointColor);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }  
    
    //draw each line
    gl.drawArrays(gl.LINE_STRIP, 0, points.length/3);
}

//*************************************************//
//drawSOR function: clears canvas, draws SOR object//
//*************************************************//
function drawSOR(gl, a_position) {
    //enable hidden surface removal
    gl.enable(gl.DEPTH_TEST);
    
    //set positions of the vertices
    var n = initVertexBuffers(gl, a_position, vert, ind, text);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    } 
    
    //set color to white and clear canvas
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    //set textures
    if (!initTextures(gl, n)) {
        console.log('Failed to intialize the texture.');
        return;
    }
}

//*****************************************************//
//initVertexBuffers function: sets vertices to be drawn//
//*****************************************************//
function initVertexBuffers(gl, a_position, arrayV, arrayI, arrayT) {
    var vertices = new Float32Array(arrayV); //pass array of shape points
    var indices = new Uint16Array(arrayI); //pass order of SOR points
    var n = indices.length; //number of indices
    
    var textures = new Float32Array(arrayT);
        
    if(!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_position')) return -1;
    
    if(!initArrayBuffer(gl, textures, 3, gl.FLOAT, 'a_TexCoord')) return -1;
    
    //create buffer for indices
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    //write indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return n;
}

//********************************************************//
//initArrayBuffer function: to write data to buffer object//
//********************************************************//
function initArrayBuffer(gl, data, num, type, attribute) {
  var buffer = gl.createBuffer();   // Create a buffer object
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

function initTextures(gl, n) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
    console.log('Failed to create the texture object');
    return false;
    }

    // Get the storage location of u_Sampler
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
    }
    var image = new Image();  // Create the image object
    if (!image) {
    console.log('Failed to create the image object');
    return false;
    }
    // Register the event handler to be called on loading an image
    image.onload = function(){ loadTexture(gl, n, texture, u_Sampler, image); };
    // Tell the browser to load an image
    image.src = 'sky.jpg';

    return true;
}

function loadTexture(gl, n, texture, u_Sampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
    // Enable texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler, 0);

    gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>
    
    //draw SOR
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

