//Claire Watts
//cdwatts@ucsc.edu

//*********************//
//vertex shader program//
//*********************//
var VSHADER = 
    'attribute vec4 a_position;\n' + //retrieve position from javascript
    'void main() {\n' +
    '    gl_Position = a_position;\n' +
    '    gl_PointSize = 10.0;\n' +
    '}\n';

//***********************//
//fragment shader program//
//***********************//
var FSHADER =
    'precision mediump float;\n' +
    'void main() {\n' +
    '    gl_FragColor = vec4(0.0,0.0,0.0,1.0);\n' + //set line color to black
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
    
    //register functions to be called
    canvas.onmousedown = function(ev) {click(ev, gl, canvas);};
    canvas.onmousemove = function(ev) {move(ev, gl, canvas);};

    //set color to white and clear canvas
    gl.clearColor(1.0,1.0,1.0,1.0);
    //gl.enable(gl.DEPTH_TEST); //enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    setupIOSOR("fileinput"); 
}  

var buttonC = false; //boolean for createSOR when button is clicked
var stop = false; //boolean for stopping the draw-on-move thing
var points = []; //array to store points

function moveOn() {
    stop = true;
}

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
    points = extractedSOR.vertices;
    
    draw(gl);
}


//*************************************************//
//buttonCreate function: run when button is clicked//
//*************************************************//
function buttonCreate() {
    points = [];
    stop = false;
    buttonC = true;
}

//**************************************************************************//
//createSOR function: Takes the clicked points and calculates the new points// 
//for every 10 degree rotation of the polyline. Saves the SOR to a file.    //
//**************************************************************************//
function createSOR(gl, canvas) {
    //calls save SOR given function

    var polyLen = points.length;
    for (var angle=10; angle<360; angle+=10){
        
        var line =[]; //to store coords for each angle
            
        for (var i=0; i<polyLen; i+=3){

            var theta = ((angle * Math.PI)/180);

            var x = points[i];
            var y = points[i+1];
            var z = points[i+2];

            var newX = (x * Math.cos(theta)) + (z * Math.sin(theta));
            var newY = y;
            var newZ = -(x * Math.sin(theta)) + (z * Math.cos(theta));

            points.push(newX); points.push(newY); points.push(newZ);
        }
    }

    draw(gl);
    var ind = [];
    saveFile(new SOR("", points, ind));
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

        //echos clicked points to console
        if (lastButton === 0){
            console.log('Left click: (',x,',', y,',', z,')');
        } else if (lastButton === 2){
            console.log('Right click: (',x,',', y,',', z,')');
            moveOn; //sets stop to true
            buttonC = false;
            createSOR(gl, canvas); //calls to create SOR when right-click detected
        }

        //draw connecting line
        draw(gl); 
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
        }
    
        //draw 
        draw(gl);
        
        if (stop === false) {
            //pop off last mouse position from array
            points.pop(); points.pop(); points.pop();
        }
    }
}

//********************************************************//
//draw function: clears canvas, sets vertices, draws lines//
//********************************************************//
function draw(gl) {
    //set color to white and clear canvas
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = points.length;
    for(var i=0; i<len; i+=3) {
        //set positions of the vertices
        var n = initVertexBuffers(gl);
        if (n < 0) {
            console.log('Failed to set the positions of the vertices');
            return;
        }   
        //draw each line
        gl.drawArrays(gl.LINE_STRIP,0,n);
    }
}

//*****************************************************//
//initVertexBuffers function: sets vertices to be drawn//
//*****************************************************//
function initVertexBuffers(gl) {
    var vertices = new Float32Array(points); //pass array of shape points
    var n = points.length/3; //number of vertices

    //create buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    //bind buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    
    //write data into buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    //get storage location of a_position
    var a_position = gl.getAttribLocation(gl.program, 'a_position');
    if (a_position < 0) {
        console.log('Failed to get the storage location of a_position');
        return -1;
    }
    
    //assign buffer object to a_position variable
    gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);

    //enable the assignment to a_position variable
    gl.enableVertexAttribArray(a_position);

    return n;
}

