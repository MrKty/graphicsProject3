// breather surface generator code
var gl;
var data = [];




var pointsArray = [];

var fColor;

const black = vec4(0.0, 0.0, 0.0, 1.0);
const red = vec4(1.0, 0.0, 0.0, 1.0);

// Camera variables
var fov = 10;
var eyeX = 0;
var eyeY = 10;
var eyeZ = -1;

// Shader arrays for Ellipsoid
var verticesE = [];
var indicesE = [];
var normalsE = [];
var loopSizeE = 0;


// Exponentials
var u = 3.0;
var v = 3.0;


var modeViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

function generateBreatherVertices() {
    verticesE = [];

    loopSizeE = 0;
    aa = 0.9;

    for (var u = -e2; u < e2; u += 1) {
        for (var v = -e1; v < e1; v += 1) {
            var w = Math.sqrt(1 - aa * aa);
            var denom = aa * (Math.pow(w * Math.cosh(aa * u), 2) + Math.pow(aa * Math.sin(w * v), 2));
            var x = -u + (2 * Math.pow(w, 2) * Math.cosh(aa * u) * Math.sinh(aa * u) / denom);
            var y = 2 * w * Math.cosh(aa * u) * (-(w * Math.cos(v) * Math.cos(w * v)) - (Math.sin(v) * Math.sin(w * v))) / denom;
            var z = 2 * w * Math.cosh(aa * u) * (-(w * Math.sin(v) * Math.cos(w * v)) + (Math.cos(v) * Math.sin(w * v))) / denom;

            verticesE.push(vec4(x, y, z, 1));
        }
        loopSizeE++;
    }
}




function generateBreather() {
    generateBreatherVertices();
    generateBreatherIndices();
}




window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // enable depth testing and polygon offset
    // so lines will be in front of filled triangles

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

    // vertex array of nRows*nColumns quadrilaterals 
    // (two triangles/quad) from data


    for (var i = 0; i < nRows - 1; i++) {
        for (var j = 0; j < nColumns - 1; j++) {
            pointsArray.push(vec4(2 * i / nRows - 1, data[i][j], 2 * j / nColumns - 1, 1.0));
            pointsArray.push(vec4(2 * (i + 1) / nRows - 1, data[i + 1][j], 2 * j / nColumns - 1, 1.0));
            pointsArray.push(vec4(2 * (i + 1) / nRows - 1, data[i + 1][j + 1], 2 * (j + 1) / nColumns - 1, 1.0));
            pointsArray.push(vec4(2 * i / nRows - 1, data[i][j + 1], 2 * (j + 1) / nColumns - 1, 1.0));
        }
    }
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    var vBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    fColor = gl.getUniformLocation(program, "fColor");

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // buttons for moving viewer and changing size

    document.getElementById("Button1").onclick = function () { near *= 1.1; far *= 1.1; };
    document.getElementById("Button2").onclick = function () { near *= 0.9; far *= 0.9; };
    document.getElementById("Button3").onclick = function () { radius *= 2.0; };
    document.getElementById("Button4").onclick = function () { radius *= 0.5; };
    document.getElementById("Button5").onclick = function () { theta += dr; };
    document.getElementById("Button6").onclick = function () { theta -= dr; };
    document.getElementById("Button7").onclick = function () { phi += dr; };
    document.getElementById("Button8").onclick = function () { phi -= dr; };
    document.getElementById("Button9").onclick = function () { left *= 0.9; right *= 0.9; };
    document.getElementById("Button10").onclick = function () { left *= 1.1; right *= 1.1; };
    document.getElementById("Button11").onclick = function () { ytop *= 0.9; bottom *= 0.9; };
    document.getElementById("Button12").onclick = function () { ytop *= 1.1; bottom *= 1.1; };

    render();

}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(theta));

    modelViewMatrix = lookAt(vec3(eyeX, eyeY, eyeZ), vec3(0,0,0), vec3(0, 1, 0));
    projectionMatrix = perspective(fov, 1, 0.02, 100);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // draw each quad as two filled red triangles
    // and then as two black line loops

    for (var i = 0; i < pointsArray.length; i += 4) {
        gl.uniform4fv(fColor, flatten(red));
        gl.drawArrays(gl.K, i, 4);
        gl.uniform4fv(fColor, flatten(black));
        gl.drawArrays(gl.LINE_LOOP, i, 4);
    }


    requestAnimFrame(render);
}
