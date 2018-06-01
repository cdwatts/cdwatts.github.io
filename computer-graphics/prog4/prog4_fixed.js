//Claire Watts
//cdwatts@ucsc.edu

//*********************//
//vertex shader program//
//*********************//
var VSHADER = 
    'attribute vec4 a_position;\n' + //retrieve position from javascript
    'attribute vec4 a_flatColor;\n' + 
    'attribute vec4 a_smoothColor;\n' +
    'uniform mat4 u_mvpMatrix;\n' +
    'varying vec4 v_color;\n' +
    'uniform bool u_flatShaded;\n' +
    'uniform bool u_specular;\n' +
    'void main() {\n' +
    '   vec4 eyeView = vec4(u_mvpMatrix*a_position);' +
    '   vec4 lightColor = vec4(1,1,1,1);\n' +
    '   gl_Position = u_mvpMatrix * a_position;\n' +
    '   gl_PointSize = 10.0;\n' +
    '   if(u_flatShaded){v_color = a_flatColor;}\n' +
    '   else{v_color = a_smoothColor;}\n' +
    '}\n';

//***********************//
//fragment shader program//
//***********************//
var FSHADER =
    'precision mediump float;\n' +
    'varying vec4 v_color;\n' +
    'void main() {\n' +
    '   gl_FragColor = v_color;\n' + 
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
        mvpMatrix.lookAt(eyeXo, eyeYo, eyeZo, atXo*2, atYo*2, 0, 0, 1, 0);
    }else{
        mvpMatrix.setPerspective(fov, canvas.width/canvas.height, 1, 100*500);
        mvpMatrix.lookAt(eyeX*500, eyeY*500, eyeZ*500, atX*500, atY*500, 0, 0, 1, 0);
    }
    gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);
    
    var u_flatShaded = gl.getUniformLocation(gl.program, 'u_flatShaded');
    gl.uniform1i(u_flatShaded, flatShaded);
    
    var u_specular = gl.getUniformLocation(gl.program, 'u_specular');
    gl.uniform1i(u_specular, specular);

    //register event functions to be called
    canvas.onmousedown = function(ev) {click(ev, gl, canvas);};
    canvas.onmousemove = function(ev) {move(ev, gl, canvas);};
    canvas.onclick = function(ev) {pickObject(ev, gl, canvas);};
    canvas.onmouseup = function(ev) {mouseUp(ev, gl, canvas);};
    canvas.onmousewheel = function(ev) {wheel(ev, gl, canvas);};

    //enable hidden surface removal
    gl.enable(gl.DEPTH_TEST); 
    
    setupIOSOR("fileinput"); 
    
    return gl;
}  

var buttonC = false; //boolean for createSOR when button is clicked
var buttonE = false; //boolean for extractSOR when button is clicked
var stop = false; //boolean for stopping the draw-on-move thing
var drawN = true; //boolean for surface normal toggle button
var save = true; //boolean for saving each SOR only once
var flatShaded = true;
var specular = false;
var gloss =10;
var orthoProj = true;
var light1 = true;
var light2 = true;
var lights = true;

var objects = []; //array to store loaded objects
var currPick = null; //points to current picked object
var disx = 0;
var disy = 0;
var disz = 0;
var lastButton = null;
var scale = 1;

var mvpMatrix = new Matrix4(); //zooming, panning, & camera movement
var fov = 30;
var eyeX = 0;
var eyeY = 0;
var eyeZ = 4;
var eyeXo = 0;
var eyeYo = 0;
var eyeZo = 4;
var atX = 0;
var atY = 0;
var atXo = 0;
var atYo = 0;

//**********************//
//ARRAYS for created SOR//
//**********************//
var shape = []; //stores lines
var polyLine = []; //stores points in each line of shape
var normColor = []; //stores colors of normal vectors
var normRow = []; // stores face normals
var normFaces = []; // stores rows of normals

var points = []; //stores clicked points
var pointColor = []; //stores colors of clicked points

var vert = []; //stores SOR vertices
var ind = []; //stores order of vertices

var flatNormz = []; //one norm per surface (coords)
var flatColor = []; //flat shading color
var surfaceNormz = []; //pass to shader for flat
var drawFnormz = []; //for drawing only

var smoothNormz = []; //one norm per vertex (coords)
var smoothColor = []; //smooth shading color
var vertexNormz = []; //pass to shader for smooth


function moveOn() {
    stop = true;
}

function coord(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

function sorObject(n, nC, v, i, fc, sc, sN, fN) {
    this.norm = n;
    this.normCo = nC;
    this.vertex = v;
    this.index = i;
    this.fcolor = fc;
    this.scolor = sc;
    this.smoothN = sN;
    this.flatN = fN;
}

function makeObject(){
    var center = new coord(0, 0, 0);
    var M = new sorObject(drawFnormz, normColor, vert, ind, flatColor, smoothColor, smoothNormz, flatNormz);
    return M;
}

function loadedObject(c, v, i, fc, sc, fn, sn) {
    this.center = c;
    this.vert = v;
    this.ind = i;
    this.fcolor = fc;
    this.scolor = sc;
    this.flatN = fn;
    this.smoothN = sn;
}

//***********************************************//
//normToggle function: run when button is clicked//
//***********************************************//
function normToggle() {
    gl = main();
    var N = makeObject();
    drawFnormz = N.norm;
    normColor = N.normCo;
    vert = N.vertex;
    flatColor = N.fcolor;
    smoothColor = N.scolor;
    ind = N.index;
    
    if (drawN === true) {
        drawLights(gl);
        drawSOR(gl);
        drawNormz(gl);
        drawN = false;
    }else if (drawN === false){
        drawLights(gl);
        drawSOR(gl);
        drawN = true;
    }
}

//************************************************//
//shadeToggle function: run when button is clicked//
//************************************************//
function shadeToggle() {
    var S = makeObject();
    drawFnormz = S.norm;
    normColor = S.normCo;
    vert = S.vertex;
    flatColor = S.fcolor;
    smoothColor = S.scolor;
    ind = S.index;
    
    if (flatShaded === true) {
        flatShaded = false;
        gl = main();
        if (buttonE){drawObjects();}
        else {drawSOR(gl); drawLights(gl);}
    }else if (flatShaded === false){
        flatShaded = true;
        gl = main();
        if (buttonE){drawObjects();}
        else {drawSOR(gl); drawLights(gl);}
    }
}

//************************************************//
//specToggle function: run when button is clicked//
//************************************************//
function specToggle() {
    var spec = makeObject();
    vert = spec.vertex;
    flatNormz = spec.flatN;
    smoothNormz = spec.smoothN;
    ind = spec.index;
    var tempF = spec.fcolor;
    var tempS = spec.scolor;
    
    if (specular === true) {
        specular = false;
        flatColor = tempF;
        smoothColor = tempS;
        gl = main();
        if (buttonE){drawObjects();}
        else {drawSOR(gl); drawLights(gl);}
    }else if (specular === false){
        specular = true;
        flatColor = tempF;
        smoothColor = tempF;
        if (flatShaded){flatColor = specularLighting(flatNormz);}
        else{smoothColor = specularLighting(smoothNormz);}
        gl = main();
        if (buttonE){drawObjects();}
        else{drawSOR(gl); drawLights(gl);}
        flatColor=tempF;
        smoothColor=tempS;
    }
}

//**********************************************************//
//lightsOn function: turns the lights on an off when clicked//
//**********************************************************//
function lightsOn(x, y){
    var L = makeObject();
    drawFnormz = L.norm;
    normColor = L.normCo;
    vert = L.vertex;
    flatNormz = L.flatN;
    smoothNormz = L.smoothN;
    ind = L.index;
    var tempF = L.fcolor;
    var tempS = L.scolor;
    
    if (!buttonC && !buttonE && lights){
        if (orthoProj){var n = 0;}
        else if(!orthoProj){var n = 25;}
        
        // DIRECTIONAL LIGHT
        if ((x>=0 && x<=500) && (y>=0 && y<=500) && (x>=y-5 && x<=y+5)){
            if (light1 === true){
                light1 = false;
            } else if (light1 === false){
                light1 = true;
            }
        }
        
        // POINT LIGHT
        if ((x>=-25 && x<=25) && (y>=475-n && y<=525)){
            if (light2 === true){
                light2 = false;
            } else if (light2 === false){
                light2 = true;  
            }
        }
        
        if(light1 === true && light2 === true){
            console.log("both on");
            if (flatShaded){
                flatColor = addColors(flatColor, pointLighting(smoothNormz));
            }else{
                smoothColor = addColors(smoothColor, pointLighting(smoothNormz));
            }
        }else if(light1 === true){
            console.log("1 on");
            flatColor = tempF;
            smoothColor = tempS;
        }else if(light2 ===true){
            console.log("2 on");
            if (flatShaded){
                flatColor = pointLighting(smoothNormz);
            }else{
                smoothColor = pointLighting(smoothNormz);
            }
        }else if(light1 === false && light2 === false){
            console.log("both off");
            flatColor = grayColors(tempF);
            smoothColor = grayColors(tempS);
        }
        
        gl = main(); 
        drawSOR(gl); 
        drawLights(gl);
        flatColor = tempF;
        smoothColor = tempS;
    }
}

//*************************************************************//
//grayColors function: creates color arrays when lights are off//
//*************************************************************//
function grayColors(colorArray){
    var array = [];
    for (var i=0; i<colorArray.length; i+=3){
        array.push(0.5,0.5,0.5);
    }
    return array;
}

//*************************************************************//
//addColors function: adds color arrays when both lights are on//
//*************************************************************//
function addColors(a1, a2){
    var array = [];
    for (var i=0; i<a1.length; i+=3){
        array.push(a1[i]+a2[i], a1[i+1]+a2[i+2], a1[i+3]+a2[i+3]);
    }
    return array;
}

//************************************************//
//projToggle function: run when button is clicked//
//************************************************//
function projToggle() {
    var P = makeObject();
    drawFnormz = P.norm;
    normColor = P.normCo;
    vert = P.vertex;
    ind = P.index;
    var tempF = P.fcolor;
    var tempS = P.scolor;
    
    if(light1 === true && light2 === true){
        if (flatShaded){
            flatColor = addColors(flatColor, pointLighting(smoothNormz));
        }else{
            smoothColor = addColors(smoothColor, pointLighting(smoothNormz));
        }
    }else if(light1 === true){
        flatColor = tempF;
        smoothColor = tempS;
    }else if(light2 ===true){
        if (flatShaded){
            flatColor = pointLighting(smoothNormz);
        }else{
            smoothColor = pointLighting(smoothNormz);
        }
    }else if(light1 === false && light2 === false){
        flatColor = grayColors(tempF);
        smoothColor = grayColors(tempS);
    }
    
    if (orthoProj === true) {
        orthoProj = false;
        gl = main();
        if (buttonE){drawObjects();}
        else {drawSOR(gl); drawLights(gl);}
    }else if (orthoProj === false){
        orthoProj = true;
        gl = main();
        if (buttonE){drawObjects();}
        else {drawSOR(gl); drawLights(gl);}
    }
    flatColor = tempF;
    smoothColor = tempS;
}

//**********************************************//
//glossSlider function: run when slider is moved//
//**********************************************//
function glossSlider() {
    gloss = document.getElementById("glossiness").value;
    var g = makeObject();
    vert = g.vertex;
    ind = g.index;
    flatNormz = g.flatN;
    smoothNormz = g.smoothN;
    var temp = g.fcolor;
    var temp2 = g.scolor;
    flatColor = g.fcolor;
    smoothColor = g.scolor;
    if(specular){
        if (flatShaded){flatColor = specularLighting(flatNormz);}
        else{smoothColor = specularLighting(smoothNormz);}
    }
    gl = main();
    if (buttonE){drawObjects();}
    else {drawSOR(gl); drawLights(gl);}
    flatColor=temp;
    smoothColor=temp2;
}

//***********************************************//
//updateScreen function: reads file and draws SOR//
//***********************************************//
function updateScreen(){  
    buttonE = true;
    specular = false;
    flatshaded = true;
    stop = false;
    drawN = true;
    save = true;
    lights = false;
    light1 = false;
    light2 = false;
    
    var extractedSOR = readFile();
    var name = extractedSOR.objName;
    
    vert = extractedSOR.vertices;
    ind = extractedSOR.indexes;
    center = updateCenter(vert);
    
    var Faces = [];
    var fnorm = [];
    var colorStore = [];
    var snorm = [];
    
    flatColor = extractedFcolors(vert, Faces, fnorm);
    var numClicks = (fnorm.length/108)+1;
    getSmoothNormz(numClicks, 37, Faces, snorm);
    getSmoothColors(snorm, colorStore);
    smoothColor = colorStore;
    
    var temp = [];
    for (i=0; i<fnorm.length; i+=3){
        temp.push(new coord(fnorm[i], fnorm[i+1], fnorm[i+2]));
    }
    fnorm = temp;
    flatNormz = fnorm;
    smoothNormz = snorm;
    
    var obj = new loadedObject(center, vert, ind, flatColor, smoothColor, flatNormz, smoothNormz);
    objects.push(obj);
    drawObjects();
    
    console.log("center", obj.center);
    console.log("vert", (obj.vert).length);
    console.log("ind", (obj.ind).length);
    console.log("flatColor", (obj.fcolor).length);
    console.log("smoothColor", (obj.scolor).length);
    console.log("OBJECTS:", objects);
    console.log("flat norms", obj.flatN);
    console.log("smooth norms", obj.smoothN);
}

//*****************************************************//
//drawObjects function: draws all of the loaded objects//
//*****************************************************//
function drawObjects(){
    if (currPick!=null){
        var tempF = currPick.fcolor;
        var tempS = currPick.scolor;
        
        currPick.fcolor = grayColors(tempF);
        currPick.scolor = grayColors(tempS);
    }

    for(var i=0; i<objects.length; i++){
        var D = objects[i];
        vert = D.vert;
        ind = D.ind;
        flatColor = D.fcolor;
        smoothColor = D.scolor;
        flatNormz = D.flatN;
        smoothNormz = D.smoothN;
        if(specular){
            if (flatShaded){flatColor = specularLighting(flatNormz);}
            else{smoothColor = specularLighting(smoothNormz);}
        }
        gl = main();
        drawSOR(gl);
    }
    
    if (currPick!=null){
        currPick.fcolor = tempF;
        currPick.scolor = tempS;
    }
}

//**************************************************************//
//pickObject function: picks and un-picks an object when clicked//
//**************************************************************//
function pickObject(ev, gl, canvas){
    if(buttonE && ev.button===0){
        var x = ev.clientX; //x coord of click
        var y = ev.clientY; //y coord of click
        var z = 0; //z coord of click
        var rect = ev.target.getBoundingClientRect();

        //translates cooridinates based on canvas size
        x = 500*((x - rect.left) - canvas.width/2) / (canvas.width/2);
        y = 500*(canvas.height/2 - (y - rect.top)) / (canvas.height/2);
        
        var i = 0;
        var p =false;
        var tempPick = currPick;
        while(i<objects.length && !p){
            var ob = objects[i];
            var ver = ob.vert;
            for (var j=0; j<ver.length; j+=12){
                if(x<=ver[j] && x>ver[j+6] || x<=ver[j+3] && x>=ver[j+9]){
                    if(y<=ver[j+1] && y>=ver[j+7] || y<=ver[j+4] && y>=ver[j+10]){
                        currPick = ob;
                        p = true;
                        scale = 1;
                        console.log("picked object:", currPick);
                        break;
                    }
                }
            }
            i++;
        }
        
        if (!p){
            currPick = null;
            console.log("no object picked");
        }
        
        drawObjects();
    } 
}

//***************************************************************//
//mouseUp function: calculate displacement when mouse is released//
//***************************************************************//
function mouseUp(ev, gl, canvas){
    var x = ev.clientX; //x coord of click
    var y = ev.clientY; //y coord of click
    var z = 0; //z coord of click
    var rect = ev.target.getBoundingClientRect();

    //translates cooridinates based on canvas size
    x = 500*((x - rect.left) - canvas.width/2) / (canvas.width/2);
    y = 500*(canvas.height/2 - (y - rect.top)) / (canvas.height/2);

    disx = x - disx;
    disy = y - disy;

    if ((disx>5 || disx<-5 || disy>5 || disy<-5) && lastButton===0){
        translate(disx, disy, disz);
        pan();
    }   
    
    if ((disx>5 || disx<-5 || disy>5 || disy<-5) && lastButton===2){
        rotate();
    }
}

//*********************************************//
//pan function: pans eyeX & eyeY for both views//
//*********************************************//
function pan(){
    if (buttonE && currPick===null){
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
        drawObjects();
    }
}

//**********************************************************//
//rotate function: rotates the object when mouse is released//
//**********************************************************//
function rotate(){
    if (buttonE && currPick!=null){
        
        vert = currPick.vert;
        var updatedVert = [];
        var R = new Matrix4();
        
        if(Math.abs(disx) > Math.abs(disy+10)){ //horizontal: rotate about Z axis
            R = R.setRotate(10, 0, 0, 1); 
            console.log("rotated about Z");
        }else if(Math.abs(disy) > Math.abs(disx+10)){ //vertical: rotate about X axis
            R = R.setRotate(10, 1, 0, 0); 
            console.log("rotated about X");
        }
        
        for (var i=0; i<vert.length; i+=3){
            var newVert = new Vector3([vert[i], vert[i+1], vert[i+2]]);
            newVert = R.multiplyVector3(newVert);
            updatedVert.push(newVert.elements[0], newVert.elements[1], newVert.elements[2]);
        }
        
        currPick.vert = updatedVert;
        drawObjects();
    }
}

//******************************************************************//
//translate function: translates the vertices when mouse is released//
//******************************************************************//
function translate(dX, dY, dZ){
    if (buttonE && currPick!=null){

        vert = currPick.vert;
        var updatedVert = [];
        var T = new Matrix4();
        T = T.setTranslate(dX, dY, dZ);
        
        for (var i=0; i<vert.length; i+=3){
            var newVert = new Vector3([vert[i], vert[i+1], vert[i+2]]);
            newVert = T.multiplyVector3(newVert);
            updatedVert.push(newVert.elements[0], newVert.elements[1], newVert.elements[2]);
        }
        
        currPick.vert = updatedVert;
        currPick.center = updateCenter(currPick.vert)
        
        console.log("translated");
        if(disx===dX && disy===dY && disz===dZ){drawObjects();}
    }
}

//*******************************************************//
//wheel function: recognizes when mouse wheel is scrolled//
//*******************************************************//
function wheel(ev, gl, canvas){
    var scroll = ev.deltaY;
    
    if(buttonE && currPick!=null){
        scaleObj(scroll);
    }else if(buttonE && currPick===null){
        if(lastButton===2){ //right mouse click
            moveCamera(scroll);
        }else{
            zoom(scroll);
        }
    }
    
    return false;
}

//***********************************************************//
//moveCamera function: changes eyeZ to move camera in and out//
//***********************************************************//
function moveCamera(scroll){
    if(!orthoProj){
        if(scroll > 0){
            eyeZ-=1;
        }else{
            eyeZ+=1;
        }
        gl = main();
        drawObjects();
    }
    
    return false;
}

//**********************************************************//
//zoom function: changes the fov in perspective view to zoom//
//**********************************************************//
function zoom(scroll){
    if(!orthoProj){
        if(scroll > 0){
            fov-=1;
        }else{
            fov+=1;
        }
        gl = main();
        drawObjects();
    }
    
    return false;
}

//************************************************//
//scaleObj function: scales the current SOR object//
//************************************************//
function scaleObj(scroll){

    if (buttonE && currPick!=null){

        if(scroll > 0){
           if(scale <= 2 && scale >= 1){
                scale+=0.1;
                console.log("scale up by:", scale);
            }else if(scale < 1){
                scale = 1;
            }
        }else{
            if(scale >= 0.5 && scale <= 1){
                scale-=0.1;
                console.log("scale down by:", scale);
            }else if(scale > 1){
                scale = 1;
            }
        }

        vert = currPick.vert;
        var updatedVert = [];
        var S = new Matrix4();
        S = S.setScale(scale, scale, scale);
        
        for (var i=0; i<vert.length; i+=3){
            if(scale<0.5 || scale>2){break;}
            var newVert = new Vector3([vert[i], vert[i+1], vert[i+2]]);
            newVert = S.multiplyVector3(newVert);
            updatedVert.push(newVert.elements[0], newVert.elements[1], newVert.elements[2]);
        }

        if(scale>=0.5 && scale<=2){currPick.vert = updatedVert;}
        console.log("scaled");
        drawObjects();
        
        return false;
    }
}

//********************************************************************//
//updateCenter function: calculates average of vertices to find center//
//********************************************************************//
function updateCenter(vertex){
    var Cx=0;
    var Cy=0;
    var Cz=0;
    for (var i = 0; i < vertex.length; i+=3){
        Cx+=vertex[i];
        Cy+=vertex[i+1];
        Cz+=vertex[i+2];
    }
    Cx = Cx/vertex.length;
    Cy = Cy/vertex.length;
    Cz = Cz/vertex.length;
    
    var center = new coord(Cx, Cy, Cz);
    
    return center;
}

//*************************************************//
//buttonCreate function: run when button is clicked//
//*************************************************//
function buttonCreate() {
    shape = [];
    polyLine = []; 
    normColor = []; 
    points = []; 
    pointColor = []; 
    vert = []; 
    ind = []; 
    drawFnormz = [];
    flatNormz = []; 
    flatColor = []; 
    smoothNormz = []; 
    smoothColor = []; 
    stop = false;
    buttonC = true;
    drawN = true;
    save = true;
    lights = true;
    light1 = true;
    light2 = true;
    
    //currPick = null;
    //drawObjects(); //make it work for createSOR too?
}

function extractedFcolors(vertex, Faces, fNo){
    var fCo = [];
    for (var i = 0; i<vertex.length; i+=12){
        var three = new coord(vertex[i+9], vertex[i+10], vertex[i+11]);
        var zero = new coord(vertex[i], vertex[i+1], vertex[i+2]);
        var one = new coord(vertex[i+3], vertex[i+4], vertex[i+5]);
        //CALCULATE SURFACE NORMALS
        var Snorm = calcNormal(three, zero, one);           
        Snorm.normalize();

        fNo.push(Snorm.elements[0], Snorm.elements[1], Snorm.elements[2]);

        //CALCULATE FLAT COLORS
        var lightDir = new Vector3([1, 1, 1]);
        lightDir.normalize();

        //cos(theta) = dot product of lightDir and normal vector
        var FdotP = (lightDir.elements[0]*Snorm.elements[0])+(lightDir.elements[1]*Snorm.elements[1])+           (lightDir.elements[2]*Snorm.elements[2]);
        //surface color = light color x base color x FdotP (DIFFUSE)
        var R = 1.0 * 0.0 * FdotP;
        var G = 1.0 * 1.0 * FdotP;
        var B = 1.0 * 0.0 * FdotP;

        fCo.push(R, G, B);
        fCo.push(R, G, B);
        fCo.push(R, G, B);
        fCo.push(R, G, B);
    }
    
    numClicks = (fNo.length/108)+1;
    
    //create first row of face normals set to 0
    var Row = [];
    for(var k=0; k<=37; k++){
        Row.push(new coord(0,0,0));
    }
    Faces.push(Row);
    
    //create next rows of face normals
    var l = 0; 
    for (var j = 0; j<numClicks-1; j++){
        var Row = []; 
        l = 108*j;
        for (var k = 0; k<36; k++){
            if (k===0 || k===35){
                //pushes first and last faces twice for first vertex
                Row.push(new coord(fNo[l], fNo[l+1], fNo[l+2]));
            }
            Row.push(new coord(fNo[l], fNo[l+1], fNo[l+2])); 
            l+=3;
        }
        Faces.push(Row);
    }
    
    //create last row of face normals set to 0
    var Row = [];
    for(var c=0; c<=37; c++){
        Row.push(new coord(0,0,0));
    }
    Faces.push(Row);
    
    return fCo;
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
    //create first row of face normals set to 0
    normRow = [];
    for(var k=0; k<=shape.length; k++){
        normRow.push(new coord(0,0,0));
    }
    normFaces.push(normRow);

    for (var i=0; i<shape[0].length-1; i++) {
        normRow = [];
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
            
            //1st triangle in poly
            ind.push(index, index + 1, index + 2); //0,1,2
            //2nd triangle in poly
            ind.push(index, index + 2, index + 3); //0,2,3
            
            //CALCULATE SURFACE NORMALS
            
            var Snorm = calcNormal(nextLine[i], currentLine[i], currentLine[i+1]);
            
            if (j===0 || j===shape.length-2){
                //pushes first and last faces twice for first vertex
                normRow.push(new coord(Snorm.elements[0], Snorm.elements[1], Snorm.elements[2]));
            }
            normRow.push(new coord(Snorm.elements[0], Snorm.elements[1], Snorm.elements[2]));
            
            Snorm.normalize();
            
            surfaceNormz.push(Snorm.elements[0], Snorm.elements[1], Snorm.elements[2]);
            flatNormz.push(new coord(Snorm.elements[0], Snorm.elements[1], Snorm.elements[2]));
    
            //push start point for drawing
            drawFnormz.push(currentLine[i].x);
            drawFnormz.push(currentLine[i].y);
            drawFnormz.push(currentLine[i].z);
            //push normal vector
            drawFnormz.push(currentLine[i].x + Snorm.elements[0]*100);
            drawFnormz.push(currentLine[i].y + Snorm.elements[1]*100);
            drawFnormz.push(currentLine[i].z + Snorm.elements[2]*100); 
            
            //CALCULATE FLAT COLORS
            
            var lightDir = new Vector3([1, 1, 1]);
            lightDir.normalize();
            
            //cos(theta) = dot product of lightDir and normal vector
            var FdotP = (lightDir.elements[0]*Snorm.elements[0])+(lightDir.elements[1]*Snorm.elements[1])+           (lightDir.elements[2]*Snorm.elements[2]);
            //surface color = light color x base color x FdotP (DIFFUSE)
            var R = 1.0 * 0.0 * FdotP;
            var G = 1.0 * 1.0 * FdotP;
            var B = 1.0 * 0.0 * FdotP;

            flatColor.push(R, G, B);
            flatColor.push(R, G, B);
            flatColor.push(R, G, B);
            flatColor.push(R, G, B);
        }
        normFaces.push(normRow); //pushes new row 
    }
    //create last row of face normals set to 0
    normRow = [];
    for(var c=0; c<=shape.length; c++){
        normRow.push(new coord(0,0,0));
    }
    normFaces.push(normRow);
    
    //push surface normal colors - red
    for (j=0; j<drawFnormz.length; j+=3){
        normColor.push(1.0);
        normColor.push(0.0);
        normColor.push(0.0);
    }
}

//*****************************************************************//
//getSmoothColors function: calulates the colors for smooth shading//
//*****************************************************************//
function getSmoothColors(store, colorS){
    var f = store.length-1;
    for (var i=0; i<store.length; i++){

        var Vnorm = new Vector3([store[i].x, store[i].y, store[i].z]);

        var lightDir = new Vector3([1, 1, 1]);
        lightDir.normalize();

        //cos(theta) = dot product of lightDir and normal vector
        var SdotP = (lightDir.elements[0]*Vnorm.elements[0])+(lightDir.elements[1]*Vnorm.elements[1])+           (lightDir.elements[2]*Vnorm.elements[2]);

        //surface color = light color x base color x SdotP (DIFFUSE)
        var R = 1.0 * 0.0 * SdotP;
        var G = 1.0 * 1.0 * SdotP;
        var B = 1.0 * 0.0 * SdotP;

        colorS.push(R,G,B); 
    }
}

//************************************************************//
//getSmoothNormz function: calculates vertex normals by adding//
//up the surrounding face normals. used for smooth shading.   //
//************************************************************//
function getSmoothNormz(outer, inner, nface, store) {
    var k = 0;
    while (k < outer-1){
        var rowAbove = nface[k];
        var rowBelow = nface[k+1];
        for(var t=0; t < inner-1; t++){
            
            // first 2 vertices in polygon
            for(var j=k; j<=k+1; j++){
                
                rowAbove = nface[j];
                rowBelow = nface[j+1];
                     
                var x = rowAbove[t].x + rowAbove[t+1].x + rowBelow[t].x + rowBelow[t+1].x;
                var y = rowAbove[t].y + rowAbove[t+1].y + rowBelow[t].y + rowBelow[t+1].y;
                var z = rowAbove[t].z + rowAbove[t+1].z + rowBelow[t].z + rowBelow[t+1].z;

                var Vnorm = new Vector3([x, y, z]);
                Vnorm.normalize();
                
                vertexNormz.push(Vnorm.elements[0], Vnorm.elements[1], Vnorm.elements[2]);
                store.push(new coord(Vnorm.elements[0], Vnorm.elements[1], Vnorm.elements[2]));
            }
            
            // second 2 vertices in polygon
            for(var j=k+1; j>=k; j--){
                
                rowAbove = nface[j];
                rowBelow = nface[j+1];
                     
                var x = rowAbove[t+1].x + rowAbove[t+2].x + rowBelow[t+1].x + rowBelow[t+2].x;
                var y = rowAbove[t+1].y + rowAbove[t+2].y + rowBelow[t+1].y + rowBelow[t+2].y;
                var z = rowAbove[t+1].z + rowAbove[t+2].z + rowBelow[t+1].z + rowBelow[t+2].z;

                var Vnorm = new Vector3([x, y, z]);
                Vnorm.normalize();
                vertexNormz.push(Vnorm.elements[0], Vnorm.elements[1], Vnorm.elements[2]);
                store.push(new coord(Vnorm.elements[0], Vnorm.elements[1], Vnorm.elements[2]));
            }
        }
        k++;
    }
}

//***************************************************************//
//pointLighting function: calulates the colors for point lighting//
//***************************************************************//
function pointLighting(normArray){
    var pLitColors = [];
    var k = 0;
    for (var i=0; i<normArray.length; i++){
        var norm = new Vector3([normArray[i].x, normArray[i].y, normArray[i].z]);
        var vAvg = [(vert[k]+vert[k+3]+vert[k+6]+vert[k+9])/4, (vert[k+1]+vert[k+4]+vert[k+7]+vert[k+10])/4, vert[k+2]+vert[k+5]+vert[k+8]+vert[k+11]];
        
        //light direction = light position (0,500,0) - vertex position
        var lightDir = new Vector3([0-vert[k], 500-vert[k+1], 0-vert[k+2]]);
        lightDir.normalize();
        k+=3;

        //cos(theta) = dot product of lightDir and normal vector
        var dotP = (lightDir.elements[0]*norm.elements[0])+(lightDir.elements[1]*norm.elements[1])+           (lightDir.elements[2]*norm.elements[2]);
        
        //surface color = light color x base color x dotP (DIFFUSE)
        var R = 1.0 * 0.0 * dotP;
        var G = 1.0 * 1.0 * dotP;
        var B = 0.0 * 0.0 * dotP;
        
        pLitColors.push(R, G, B);
    }
    return pLitColors;
}

//*********************************************************************//
//specularLighting function: calulates the colors for specular lighting//
//*********************************************************************//
function specularLighting(normArray){
    var specColors = [];
    for (var i=0; i<normArray.length; i++){
        var norm = new Vector3([normArray[i].x, normArray[i].y, normArray[i].z]);
        var lightDir = new Vector3([1, 1, 1]);
        lightDir.normalize();
        
        //halfway vector
        var view = new Vector3([0,0,1]);
        view.normalize();
        var mag = Math.sqrt(Math.pow(lightDir.elements[0]+view.elements[0], 2) + Math.pow(lightDir.elements[1]+view.elements[1], 2) + Math.pow(lightDir.elements[2]+view.elements[2], 2));
        var halfway = new Vector3([(lightDir.elements[0]+view.elements[0])/mag, (lightDir.elements[1]+view.elements[1])/mag, (lightDir.elements[2]+view.elements[2])/mag]);

        //cos(alpha) = dot product of view and reflect vector
        var normDotH = (norm.elements[0]*halfway.elements[0] + norm.elements[1]*halfway.elements[1] + norm.elements[2]*halfway.elements[2]);

        //surface color = light color x material color x normDotH^gloss (SPECULAR)
        R2 = 1.0 * 0.0 * Math.pow(normDotH, gloss);
        G2 = 1.0 * 1.0 * Math.pow(normDotH, gloss);
        B2 = 1.0 * 0.0 * Math.pow(normDotH, gloss);

        if (flatShaded){
            specColors.push(R2, G2, B2);
            specColors.push(R2, G2, B2);
            specColors.push(R2, G2, B2);
        }
        specColors.push(R2, G2, B2);
    }
    return specColors;
}

//***********************************************************//
//calcNormal function: calculates a normal between 3 vertices//
//***********************************************************//
function calcNormal(a, b, c) {
    //ind 3
    var Ax = a.x;
    var Ay = a.y; 
    var Az = a.z;
    //ind 0
    var Bx = b.x; 
    var By = b.y;
    var Bz = b.z;
    //ind 1
    var Cx = c.x;
    var Cy = c.y;
    var Cz = c.z; 

    //calculate C-B vector
    var CBx = Bx-Cx;
    var CBy = By-Cy;
    var CBz = Bz-Cz;
    var CB = new Vector3([CBx, CBy, CBz]);

    //calculate A-B vector
    var ABx = Bx-Ax;
    var ABy = By-Ay;
    var ABz = Bz-Az;
    var AB = new Vector3([ABx, ABy, ABz]);

    //calculate cross product ABxCB
    var cross1X = (ABy*CBz) - (ABz*CBy);
    var cross1Y = (ABz*CBx) - (ABx*CBz);
    var cross1Z = (ABx*CBy) - (ABy*CBx);

    var Snorm = new Vector3([cross1X, cross1Y, cross1Z]);
    return Snorm;  
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
    
    if(!buttonC && lights){
        lightsOn(x, y);
    }
    
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
            getSmoothNormz(shape[0].length, shape.length, normFaces, smoothNormz);
            getSmoothColors(smoothNormz, smoothColor);
            drawSOR(gl);
            drawLights(gl);
            if (save) {saveFile(new SOR("", vert, ind))};
            save = false;
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
    var n = initVertexBuffers(gl, a_position, points, ind, pointColor, pointColor);
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
    var n = initVertexBuffers(gl, a_position, vert, ind, flatColor, smoothColor);
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
    var n = initVertexBuffers(gl, a_position, drawFnormz, ind, normColor, normColor);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }  
    
    //draw each line
    gl.drawArrays(gl.LINES, 0, drawFnormz.length/3);
}

//*********************************************//
//drawLights function: draws both light sources//
//*********************************************//
function drawLights(gl, a_position) { 
    //enable hidden surface removal
    gl.enable(gl.DEPTH_TEST);
    
    //DIRECTIONAL LIGHT
    var source1 = [0,0,0,500,500,500];
    var Lcolor1 = [1,0,0,1,0,0]; //red
    if (!light1){Lcolor1 = grayColors(Lcolor1);}
    
    //set positions of the vertices
    var n = initVertexBuffers(gl, a_position, source1, ind, Lcolor1, Lcolor1);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    } 
    gl.lineWidth(30);
    gl.drawArrays(gl.LINES, 0, source1.length/3);
    
    //POINT LIGHT
    var source2 = [25,525,25,25,475,25,-25,475,25,-25,525,25]; //centered at 0,500,0
    var Lind2 = [0,1,2,0,3,2]; //currently draws just a square (not a cube)
    var Lcolor2 = [1,1,0,1,1,0,1,1,0,1,1,0]; //yellow
    if (!light2){Lcolor2 = grayColors(Lcolor2);}
    
    //set positions of the vertices
    var n = initVertexBuffers(gl, a_position, source2, Lind2, Lcolor2, Lcolor2);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }  
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
}

//*****************************************************//
//initVertexBuffers function: sets vertices to be drawn//
//*****************************************************//
function initVertexBuffers(gl, a_position, arrayV, arrayI, arrayFC, arraySC) {
    var vertices = new Float32Array(arrayV); //pass array of shape points
    var indices = new Uint16Array(arrayI); //pass order of SOR points
    var n = indices.length; //number of indices
    var Fcolors = new Float32Array(arrayFC); //pass array of flat colors
    var Scolors = new Float32Array(arraySC); //pass array of smooth colors
        
    if(!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_position')) return -1;
    
    if(!initArrayBuffer(gl, Fcolors, 3, gl.FLOAT, 'a_flatColor')) return -1;
    
    if(!initArrayBuffer(gl, Scolors, 3, gl.FLOAT, 'a_smoothColor')) return -1;
    
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
