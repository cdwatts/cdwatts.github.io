//vertex shader program
var VSHADER = 
    'attribute vec4 a_position;\n' +   //retrieve position from javascript
    'void main() {\n' +
    '    gl_Position = a_position;\n' +
    '    gl_PointSize = 10.0;\n' +
    '}\n';

//fragment shader program
var FSHADER =
    'precision mediump float;\n' +
    'void main() {\n' +
    '    gl_FragColor = vec4(1.0,0.0,1.0,1.0);\n' +   //purple
    '}\n';

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
    
    //register function to be called
    canvas.onmousedown = function(ev) {click(ev, gl, canvas)};
    canvas.onmousemove = function(ev) {move(ev, gl, canvas);};
    
    //clear canvas
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
}  

var points = []; //array to store mouse clicks + positions

function click(ev, gl, canvas) {
    var x = ev.clientX; //x coord of mouse
    var y = ev.clientY; //y coord of mouse
    var rect = ev.target.getBoundingClientRect();
    
    x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
    y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);
    
    //push coord onto array
    points.push(x); points.push(y);
    
    console.log('Clicked at: (',x,',', y,')'); //prints out clicked points
    
    draw(gl, canvas);  
}

function move(ev, gl, canvas) {
    var x = ev.clientX; //x coord of mouse
    var y = ev.clientY; //y coord of mouse
    var rect = ev.target.getBoundingClientRect();
    
    x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
    y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);
    
    //push coord onto array
    points.push(x); points.push(y);
    
    draw(gl, canvas);
    
    points.pop(); points.pop();
}

function draw(gl, canvas) {
    //clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    var len = points.length;
    for(var i=0; i<len; i+=2) {
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


function initVertexBuffers(gl) {
    var vertices = new Float32Array(points); //pass array of clicked points
    var n = vertices.length/2; //number of vertices

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

    var a_position = gl.getAttribLocation(gl.program, 'a_position');
    if (a_position < 0) {
        console.log('Failed to get the storage location of a_position');
        return -1;
    }
    
    //assign buffer object to a_position variable
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    //enable the assignment to a_position variable
    gl.enableVertexAttribArray(a_position);

    return n;
}











