
var nRows = 20;
var nColumns = 20;


// data for radial hat function: sin(Pi*r)/(Pi*r)


var data = new Array(nRows);
aa = 0.9;

var cnt = 0;
for (var u = -1; u < 1; u += 0.1) {
    data[cnt] = new Array(nColumns);
    for (var v = -1; v < 1; v += 0.1) {
        var w = Math.sqrt(1 - aa * aa);
        var denom = aa * (Math.pow(w * Math.cosh(aa * u), 2) + Math.pow(aa * Math.sin(w * v), 2));
        var x = -u + (2 * Math.pow(w, 2) * Math.cosh(aa * u) * Math.sinh(aa * u) / denom);
        var y = 2 * w * Math.cosh(aa * u) * (-(w * Math.cos(v) * Math.cos(w * v)) - (Math.sin(v) * Math.sin(w * v))) / denom;
        var z = 2 * w * Math.cosh(aa * u) * (-(w * Math.sin(v) * Math.cos(w * v)) + (Math.cos(v) * Math.sin(w * v))) / denom;

        data.push(vec4(x, y, z, 1));
    }
    cnt++;
}


var pointsArray = [];

var canvas;
var gl;

var near = -10;
var far = 10;
var radius = 1.0;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var left = -20.0;
var right = 20.0;
var ytop = 20.0;
var bottom = -20.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }


    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    // vertex array of data for nRows and nColumns of line strips

    for (var i = 0; i < nRows - 1; i++) for (var j = 0; j < nColumns - 1; j++) {
        pointsArray.push(data[i][j]);
    }
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

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


var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // render columns of data then rows

    for (var i = 0; i < nRows; i++) gl.drawArrays(gl.LINE_STRIP, i * nColumns, nColumns);
    for (var i = 0; i < nColumns; i++) gl.drawArrays(gl.LINE_STRIP, i * nRows + pointsArray.length / 2, nRows);

    requestAnimFrame(render);
}
