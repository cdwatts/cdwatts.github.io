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
    
    
    
    var mvpMatrix = new Matrix4();
    if(orthoProj){
        mvpMatrix.setOrtho(-500, 500, -500, 500, -500, 500);
    }else{
        mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100*500);
        mvpMatrix.lookAt(0, 0, 4*500, 0, 0, 0, 0, 1, 0);
    }
    gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix.elements);
    
    
//    var mvpMatrix = new Matrix4(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0);
//    mvpMatrix.setIdentity();
    
    var u_flatShaded = gl.getUniformLocation(gl.program, 'u_flatShaded');
    gl.uniform1i(u_flatShaded, flatShaded);
    
    var u_specular = gl.getUniformLocation(gl.program, 'u_specular');
    gl.uniform1i(u_specular, specular);

    //register event functions to be called
    canvas.onmousedown = function(ev) {click(ev, gl, canvas);};
    canvas.onmousemove = function(ev) {move(ev, gl, canvas);};
    canvas.onclick = function(ev) {lightsOn(ev, gl, canvas);};

    //set color to white and clear canvas
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.enable(gl.DEPTH_TEST); //enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    setupIOSOR("fileinput"); 
    
    return gl;
}  

var buttonC = false; //boolean for createSOR when button is clicked
var stop = false; //boolean for stopping the draw-on-move thing
var drawN = true; //boolean for surface normal toggle button
var save = true; //boolean for saving each SOR only once
var flatShaded = true;
var specular = false;
var gloss =10;
var orthoProj = true;
var light1 = true;
var light2 = true;
var lights = false;

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
    var N = new sorObject(drawFnormz, normColor, vert, ind, flatColor, smoothColor, smoothNormz, flatNormz);
    return N;
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
    save = false;
    
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
    save = false;
    
    if (flatShaded === true) {
        flatShaded = false;
        gl = main();
        drawLights(gl);
        drawSOR(gl);
    }else if (flatShaded === false){
        flatShaded = true;
        gl = main();
        drawLights(gl);
        drawSOR(gl);  
    }
}

//************************************************//
//specToggle function: run when button is clicked//
//************************************************//
function specToggle() {
    var spec = makeObject();
    drawFnormz = spec.norm;
    normColor = spec.normCo;
    vert = spec.vertex;
    flatNormz = spec.flatN;
    smoothNormz = spec.smoothN;
    ind = spec.index;
    save = false;
    var tempF = spec.fcolor;
    var tempS = spec.scolor;
    
    if (specular === true) {
        specular = false;
        flatColor = tempF;
        smoothColor = tempS;
        gl = main();
        drawLights(gl);
        drawSOR(gl);    
    }else if (specular === false){
        specular = true;
        flatColor = tempF;
        smoothColor = tempF;
        if (flatShaded){flatColor = specularLighting(flatNormz);}
        else{smoothColor = specularLighting(smoothNormz);}
        gl = main();
        drawLights(gl);
        drawSOR(gl); 
        flatColor=tempF;
        smoothColor=tempS;
    }
}

//**********************************************************//
//lightsOn function: turns the lights on an off when clicked//
//**********************************************************//
function lightsOn(ev, gl, canvas){
    var L = makeObject();
    drawFnormz = L.norm;
    normColor = L.normCo;
    vert = L.vertex;
    flatNormz = L.flatN;
    smoothNormz = L.smoothN;
    ind = L.index;
    save = false;
    var tempF = L.fcolor;
    var tempS = L.scolor;
    
    if (buttonC === false && lights === true){
        var x = ev.clientX; //x coord of click
        var y = ev.clientY; //y coord of click
        var z = 0; //z coord of click
        var rect = ev.target.getBoundingClientRect();

        //translates cooridinates based on canvas size
        x = 500*((x - rect.left) - canvas.width/2) / (canvas.width/2);
        y = 500*(canvas.height/2 - (y - rect.top)) / (canvas.height/2);
        
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
        
        gl = main(); 
        drawLights(gl);
        drawSOR(gl); 
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
        array.push(0.4,0.4,0.4);
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
    save = false;
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
        drawLights(gl);
        drawSOR(gl);
    }else if (orthoProj === false){
        orthoProj = true;
        gl = main();
        drawLights(gl);
        drawSOR(gl);  
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
    drawFnormz = g.norm;
    normColor = g.normCo;
    vert = g.vertex;
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
    ind = g.index;
    save = false;
    gl = main();
    drawLights(gl);
    drawSOR(gl); 
    flatColor=temp;
    smoothColor=temp2;
}

//***********************************************//
//updateScreen function: reads file and draws SOR//
//***********************************************//
function updateScreen(){  
    gl = main();
    var extractedSOR = readFile();
    vert = extractedSOR.vertices;
    ind = extractedSOR.indexes;
    
    var vertices = new Float32Array(vert); //pass array of shape points
    var indices = new Uint16Array(ind); //pass order of SOR points
    var n = indices.length; //number of indices
    
    if(!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_position')) return -1;
    
    //create buffer for indices
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    //write indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    //set color to white and clear canvas
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.enable(gl.DEPTH_TEST); //enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.drawElements(gl.LINE_STRIP, n, gl.UNSIGNED_SHORT, 0);
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
}

//***********************************************************//
//createSOR function: Takes the clicked points and calculates//
//the new points for every 10 degree rotation of the polyline//
//***********************************************************//
function createSOR(gl, canvas){     
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
function calcVertices(gl, canvas){
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
        normColor.push(0.0);
        normColor.push(0.5);
        normColor.push(1.0);
    }
}

//*****************************************************************//
//getSmoothColors function: calulates the colors for smooth shading//
//*****************************************************************//
function getSmoothColors(){
    var f = smoothNormz.length-1;
    for (var i=0; i<smoothNormz.length; i++){

        var Vnorm = new Vector3([smoothNormz[i].x, smoothNormz[i].y, smoothNormz[i].z]);

        var lightDir = new Vector3([1, 1, 1]);
        lightDir.normalize();

        //cos(theta) = dot product of lightDir and normal vector
        var SdotP = (lightDir.elements[0]*Vnorm.elements[0])+(lightDir.elements[1]*Vnorm.elements[1])+           (lightDir.elements[2]*Vnorm.elements[2]);

        //surface color = light color x base color x SdotP (DIFFUSE)
        var R = 1.0 * 0.0 * SdotP;
        var G = 1.0 * 1.0 * SdotP;
        var B = 1.0 * 0.0 * SdotP;

        smoothColor.push(R,G,B); 
    }
}

//************************************************************//
//getSmoothNormz function: calculates vertex normals by adding//
//up the surrounding face normals. used for smooth shading.   //
//************************************************************//
function getSmoothNormz(gl, canvas) {
    var k = 0;
    while (k < shape[0].length-1){
        var rowAbove = normFaces[k];
        var rowBelow = normFaces[k+1];
        for(var t=0; t<shape.length-1; t++){
            
            // first 2 vertices in polygon
            for(var j=k; j<=k+1; j++){
                
                rowAbove = normFaces[j];
                rowBelow = normFaces[j+1];
                     
                var x = rowAbove[t].x + rowAbove[t+1].x + rowBelow[t].x + rowBelow[t+1].x;
                var y = rowAbove[t].y + rowAbove[t+1].y + rowBelow[t].y + rowBelow[t+1].y;
                var z = rowAbove[t].z + rowAbove[t+1].z + rowBelow[t].z + rowBelow[t+1].z;

                var Vnorm = new Vector3([x, y, z]);
                Vnorm.normalize();
                
                vertexNormz.push(Vnorm.elements[0], Vnorm.elements[1], Vnorm.elements[2]);
                smoothNormz.push(new coord(Vnorm.elements[0], Vnorm.elements[1], Vnorm.elements[2]));
            }
            
            // second 2 vertices in polygon
            for(var j=k+1; j>=k; j--){
                
                rowAbove = normFaces[j];
                rowBelow = normFaces[j+1];
                     
                var x = rowAbove[t+1].x + rowAbove[t+2].x + rowBelow[t+1].x + rowBelow[t+2].x;
                var y = rowAbove[t+1].y + rowAbove[t+2].y + rowBelow[t+1].y + rowBelow[t+2].y;
                var z = rowAbove[t+1].z + rowAbove[t+2].z + rowBelow[t+1].z + rowBelow[t+2].z;

                var Vnorm = new Vector3([x, y, z]);
                Vnorm.normalize();
                vertexNormz.push(Vnorm.elements[0], Vnorm.elements[1], Vnorm.elements[2]);
                smoothNormz.push(new coord(Vnorm.elements[0], Vnorm.elements[1], Vnorm.elements[2]));
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

        //cos(theta) = dot product of lightDir and normal vector
        var dotP = (lightDir.elements[0]*norm.elements[0])+(lightDir.elements[1]*norm.elements[1])+           (lightDir.elements[2]*norm.elements[2]);
        
        //surface color = light color x base color x dotP (DIFFUSE)
        var R = 1.0 * 0.0 * dotP;
        var G = 1.0 * 1.0 * dotP;
        var B = 1.0 * 0.0 * dotP;

        //vec = (2 x dotP x normal vector
        var vec = new Vector3([2*dotP*norm.elements[0], 2*dotP*norm.elements[1], 2*dotP*norm.elements[2]]);
        
        //reflection = (vec - lightDir)
        var reflect = new Vector3([vec.elements[0]-lightDir.elements[0], vec.elements[1]-lightDir.elements[1], vec.elements[2]-lightDir.elements[2]]);

        //cos(alpha) = dot product of view and reflect vector
        var view = new Vector3([0,0,1]);
        view.normalize();
        var viewDotR = (view.elements[0]*reflect.elements[0] + view.elements[1]*reflect.elements[1] + view.elements[2]*reflect.elements[2]);

        //surface color = light color x material color x viewDotR^gloss (SPECULAR)
        R2 = 1.0 * 1.0 * Math.pow(viewDotR, gloss);
        G2 = 1.0 * 0.0 * Math.pow(viewDotR, gloss);
        B2 = 1.0 * 0.0 * Math.pow(viewDotR, gloss);

        if (flatShaded){
            specColors.push(R+R2, G+G2, B+B2);
            specColors.push(R+R2, G+G2, B+B2);
            specColors.push(R+R2, G+G2, B+B2);
        }
        specColors.push(R+R2, G+G2, B+B2);
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
    if(buttonC === true){
        var lastButton = ev.button; //detect left vs right mouse click

        var x = ev.clientX; //x coord of mouse
        var y = ev.clientY; //y coord of mouse
        var z = 0; //z coord of mouse
        var rect = ev.target.getBoundingClientRect();

        //translates coordinates based on canvas size
        x = 500*((x - rect.left) - canvas.width/2) / (canvas.width/2);
        y = 500*(canvas.height/2 - (y - rect.top)) / (canvas.height/2);

        //push coords onto array
        polyLine.push(new coord(x, y, z));
        points.push(x); points.push(y); points.push(z);
        pointColor.push(0.0); pointColor.push(0.0); pointColor.push(0.0);

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
            createSOR(gl, canvas);
            calcVertices(gl, canvas);
            getSmoothNormz(gl, canvas);
            getSmoothColors();
            drawLights(gl);
            drawSOR(gl);
            if (save === true) {saveFile(new SOR("", vert, ind))};
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
            pointColor.push(0.0); pointColor.push(0.0); pointColor.push(0.0);
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
    //set color to white and clear canvas
    gl.clearColor(1.0,1.0,1.0,1.0);
    gl.enable(gl.DEPTH_TEST); //enable hidden surface removal
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //DIRECTIONAL LIGHT
    var source1 = [0,0,0,500,500,500];
    var Lcolor1 = [1,1,0,1,1,0,1,1,0,1,1,0]; //yellow
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

