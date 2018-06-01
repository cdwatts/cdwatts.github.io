//Claire Watts
//cdwatts@ucsc.edu

//*********************//
//vertex shader program//
//*********************//
var VSHADER = 
    'attribute vec4 a_position;\n' + //retrieve position from javascript
    'attribute vec4 a_color;\n' + 
    'uniform mat4 u_mvpMatrix;\n' +
    'varying vec4 v_color;\n' +
    'void main() {\n' +
    '  gl_Position = u_mvpMatrix * a_position;\n' +
    '  gl_PointSize = 10.0;\n' +
    '  v_color = a_color;\n' +
    '}\n';

//***********************//
//fragment shader program//
//***********************//
var FSHADER =
    'precision mediump float;\n' +
    'varying vec4 v_color;\n' +
    'void main() {\n' +
    '    gl_FragColor = v_color;\n' + // vec4(0.0,0.0,0.0,1.0)
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
    var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
    
    // Set the eye point and the viewing volume
    var mvpMatrix = new Matrix4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0);

    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);

    //register event functions to be called
    canvas.onmousedown = function(ev) {click(ev, gl, canvas);};
    canvas.onmousemove = function(ev) {move(ev, gl, canvas);};

    //set color to white and clear canvas
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.enable(gl.DEPTH_TEST); //enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    setupIOSOR("fileinput"); 
}  

var buttonC = false; //boolean for createSOR when button is clicked
var stop = false; //boolean for stopping the draw-on-move thing
var points = []; //array to store clicked points
var vert = []; //array to store SOR vertices
var ind = []; //array to store order of vertices
var normz = []; //array to store normalized vectors
var colorful = []; //array to store colors of vertices
var pointColor = []; //array to store colors of points
var normColor = []; //array to store colors of normal vectors
var drawN = true; //boolean for surface normal toggle button
var save = true; //boolean for saving each SOR only once

//***********************************************//
//updateScreen function: reads file and draws SOR//
//***********************************************//
function updateScreen(){  
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
    
    var extractedSOR = readFile();
    vert = extractedSOR.vertices;
    ind = extractedSOR.indexes;
    
    drawSOR(gl);
}

function moveOn() {
    stop = true;
}

function normObject(normz, normColor, vert, ind, colorful){
    this.norm = normz;
    this.normCo = normColor;
    this.vertex = vert;
    this.index = ind;
    this.color = colorful;
}

function getNormz(){
    var N = new normObject(normz, normColor, vert, ind, colorful);
    return N;
}

//**********************************************//
//showNormz function: run when button is clicked//
//**********************************************//
function toggle() {
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
    var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
    
    // Set the eye point and the viewing volume
    var mvpMatrix = new Matrix4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0);

    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);
    
    var N = getNormz();
    normz = N.norm;
    normColor = N.normCo;
    vert = N.vertex;
    colorful = N.color;
    ind = N.index;
    save = false;
    
    if (drawN === true) {
        drawSOR(gl);
        drawNormz(gl);
        drawN = false;
    }else if (drawN === false){
        drawSOR(gl);
        drawN = true;
    }
}

//*************************************************//
//buttonCreate function: run when button is clicked//
//*************************************************//
function buttonCreate() {
    points = [];
    vert = [];
    ind = [];
    normz = [];
    colorful = [];
    pointColor = [];
    normColor = [];
    stop = false;
    buttonC = true;
    drawN = true;
    save = true;
}

//**************************************************************************//
//createSOR function: Takes the clicked points and calculates the new points// 
//for every 10 degree rotation of the polyline. Saves the SOR to a file.    //
//**************************************************************************//
function createSOR(gl, canvas){     
    var pairs = 0;
    while (pairs < points.length-3){
        //push 1st point in pair onto vert array
        vert.push(points[pairs]);
        vert.push(points[pairs+1]);
        vert.push(points[pairs+2]);
        //push 2nd point in pair onto vert array
        vert.push(points[pairs+3]); 
        vert.push(points[pairs+4]);
        vert.push(points[pairs+5]);
        
        var temp = [];

        //1st temp point in pair
        temp.push(points[pairs]);
        temp.push(points[pairs+1]);
        temp.push(points[pairs+2]);
        //2nd temp point in pair
        temp.push(points[pairs+3]); 
        temp.push(points[pairs+4]);
        temp.push(points[pairs+5]);
        
        for (var angle=10; angle<=360; angle+=10){
            var len = temp.length;
            for (var i=0; i<len; i+=3){

                var theta = ((angle * Math.PI)/180);

                var x = temp[i];
                var y = temp[i+1];
                var z = temp[i+2];

                var newX = (x * Math.cos(theta)) + (z * Math.sin(theta));
                var newY = y;
                var newZ = -(x * Math.sin(theta)) + (z * Math.cos(theta));

                vert.push(newX); vert.push(newY); vert.push(newZ);
            }
        }
        pairs+=3;
    }
    
    //push order of vertices to be drawn onto ind array 
    for (var j=0; j<vert.length/3-2; j+=2){
        ind.push(j+2); //2
        ind.push(j);//0
        ind.push(j+1); //1

        ind.push(j+2); //2
        ind.push(j+1); //1
        ind.push(j+3); //3
    }
    
    calcNormz(gl, canvas);
    getColors(gl, canvas);
    drawSOR(gl);
    if (save === true) { saveFile(new SOR("", vert, ind))};  
}

//***************************************************************//
//getColors function: This function calculates the vertex colors.//
//***************************************************************//
function getColors(gl, canvas) {

    //pushes SOR colors
    for (var i=0; i<vert.length; i+=6){
        
        //cos(theta) = dot product of lightDir and normal vector
        var dotP = (1*normz[i])+(1*normz[i+1])+(1*normz[i+2]);
        
        //surface color = light color x base color x dotP
        var R = 1.0 * 0.0 * dotP;
        var G = 1.0 * 1.0 * dotP;
        var B = 1.0 * 0.0 * dotP;
        
        
        //first point vert[i]
        colorful.push(R);
        colorful.push(G);
        colorful.push(B); 
        //second point vert[i+1]
        colorful.push(R);
        colorful.push(G); 
        colorful.push(B);
        //third point vert[i+3]
        colorful.push(R);
        colorful.push(G);
        colorful.push(B);
        //fourth point vert[i+2]
        colorful.push(R);
        colorful.push(G);
        colorful.push(B);
        
    }
    //push normal colors - red
    for (j=0; j<normz.length; j+=3){
        normColor.push(1.0);
        normColor.push(0.0);
        normColor.push(0.0);
    }
}

//****************************************************************//
//calcNormz function: This function calculates the surface normals// 
//for each polygon in the SOR.                                    //
//*************************************************************** //
function calcNormz(gl, canvas) {
    var start = 1;
    var anchor = new Vector3([vert[0], vert[1], vert[2]]);
    for (var i=0; i<vert.length; i+=6){
        //ind 2
        var Ax = vert[i+6]; //6
        var Ay = vert[i+7]; //7
        var Az = vert[i+8]; //8
        //ind 0
        var Bx = vert[i];   //0
        var By = vert[i+1]; //1
        var Bz = vert[i+2]; //2
        //ind 1
        var Cx = vert[i+3]; //3
        var Cy = vert[i+4]; //4
        var Cz = vert[i+5]; //5
        
        //calculate C-B vector
        var CBx = Cx-Bx;
        var CBy = Cy-By;
        var CBz = Cz-Bz;
        var CB = new Vector3([CBx, CBy, CBz]);

        //calculate A-B vector
        var ABx = Ax-Bx;
        var ABy = Ay-By;
        var ABz = Az-Bz;
        var AB = new Vector3([ABx, ABy, ABz]);
        
        //calculate cross product CBxAB
        var cross1X = (CBy*ABz) - (CBz*ABy);
        var cross1Y = (CBz*ABx) - (CBx*ABz);
        var cross1Z = (CBx*ABy) - (CBy*ABx);
        
        var Snorm = new Vector3([cross1X, cross1Y, cross1Z]);
        Snorm.normalize();
        
        //push start point for drawing
        normz.push(Bx);
        normz.push(By);
        normz.push(Bz);
        //push normal vector
        normz.push(Bx + Snorm.elements[0]);
        normz.push(By + Snorm.elements[1]);
        normz.push(Bz + Snorm.elements[2]); 
    }
}

//*************************************************************//
//click function: draws connecting lines from left mouse clicks//
//*************************************************************//
function click(ev, gl, canvas) {
    if(buttonC === true){
        var lastButton = ev.button; //detect left vs right mouse click

        var x = ev.clientX; //x coord of mouse
        var y = ev.clientY; //y coord of mouse
        var z = 0; //z coord of mouse
        var rect = ev.target.getBoundingClientRect();

        //translates coordinates based on canvas size
        x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
        y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);

        //push coords onto array
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
            createSOR(gl, canvas); //calls to create SOR when right-click detected
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
        var z = 0; //z
        var rect = ev.target.getBoundingClientRect();

        //translates cooridinates based on canvas size
        x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
        y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);

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
    //set color to white and clear canvas
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.enable(gl.DEPTH_TEST); //enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //set positions of the vertices
    var n = initVertexBuffers(gl, a_position, vert, ind, colorful);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }  
    
    //draw SOR
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

//****************************************//
//drawNormz function: draws normal vectors//
//****************************************//
function drawNormz(gl, a_position) {  
    //set positions of the vertices
    var n = initVertexBuffers(gl, a_position, normz, ind, normColor);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }  
    
    //draw each line
    gl.drawArrays(gl.LINES, 0, normz.length/3);
}

//*****************************************************//
//initVertexBuffers function: sets vertices to be drawn//
//*****************************************************//
function initVertexBuffers(gl, a_position, arrayV, arrayI, arrayC) {
    var vertices = new Float32Array(arrayV); //pass array of shape points
    var indices = new Uint16Array(arrayI); //pass order of SOR points
    var n = indices.length; //number of indices
    var colors = new Float32Array(arrayC); //pass array of colors
    
    //var normals = new Float32Array(arrayN);
        
    if(!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_position')) return -1;
    
    if(!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_color')) return -1;
    
    //if(!initArrayBuffer(gl, normals, 3, gl.FLOAT, 'a_normal')) return -1;
    
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
