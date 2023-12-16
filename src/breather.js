// Constant values of shader modes
const WIREFRAME = 0;
const PHONG = 1;
const GOURAUD = 2;

// WebGL
var gl;
var program;
var canvas;

// Global Matrices
var modelViewMatrix;
var modelViewMatrixLoc;
var projectionMatrix;
var projectionMatrixLoc;
var indexBuffer;

// Global variables
var shaderMode = WIREFRAME;
var isCameraMoving = false;

// Camera variables
var fov = 100;
var eyeX = 0;
var eyeY = 10;
var eyeZ = -1;

// Shader arrays
var verticesE = [];
var indicesE = [];
var normalsE = [];
var loopSizeE = 0;

// Variables
let uRange = 14;
let vRange = 30;
let du = 0.5;
let dv = 0.5;
let aa = 0.5;


// Define light and material properties
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0); 
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 100.0;

/***************************************************
  Init function of window
****************************************************/
window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) alert("WebGL isn't available");

  // Load shaders and initialize attribute buffers
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Draggable UI Elements
  dragElement(document.getElementById("UISettings"));

  // Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.width);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Creating projection and mv matrices
  projectionMatrix = perspective(fov, 1, 0.02, 100);
  modelViewMatrix = lookAt(vec3(eyeX, eyeY, eyeZ), vec3(0, 0, 0), vec3(0, 1, 0));

  // Sending matrices to shader
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  generateBreatherSurface();
  camera();
  // Setup shader mode options
  setupShaderMode("Wireframe", WIREFRAME);
  setupShaderMode("Phong", PHONG);
  setupShaderMode("Gouraud", GOURAUD);

  // Setup sliders
  setupSlider("uSlider", "uRange", "uRange");
  setupSlider("vSlider", "vRange", "vRange");
  setupSlider("dUSlider", "duText", "du");
  setupSlider("dVSlider", "dvText", "dv");
  setupSlider("aaSlider", "aaText", "aa");

  setShaderUniforms();

  // Add sliders for light properties
  setupSlider("lightXSlider", "lightXText", "lightPositionX");
  setupSlider("lightYSlider", "lightYText", "lightPositionY");
  setupSlider("lightZSlider", "lightZText", "lightPositionZ");

  render();
};

/***************************************************
  Render Function
****************************************************/
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  projectionMatrix = perspective(fov, 1, 0.02, 100);
  modelViewMatrix = lookAt(vec3(eyeX, eyeY, eyeZ), vec3(0, 0, 0), vec3(0, 1, 0));

  gl.uniformMatrix4fv(gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  drawObject();

  requestAnimFrame(render);
}

function generateBreatherSurface() {
  generateBreatherVertices();
  generateBreatherIndices();
  generateBreatherNormals();
}

function drawObject() {
  processBuffers(vec4(0.0, 0.0, 0.0, 1.0), verticesE, normalsE, indicesE);

  if (shaderMode === WIREFRAME) {
    gl.drawElements(gl.LINE_STRIP, indicesE.length, gl.UNSIGNED_SHORT, indexBuffer);
  }
  else if (shaderMode === PHONG) {
    gl.drawElements(gl.TRIANGLE_STRIP, indicesE.length, gl.UNSIGNED_SHORT, indexBuffer);
  }
  else {
    gl.drawElements(gl.TRIANGLE_STRIP, indicesE.length, gl.UNSIGNED_SHORT, indexBuffer);
  }
}

/***************************************************
  Breather Vertex Generator
****************************************************/
function generateBreatherVertices() {
  verticesE = [];

  loopSizeE = 0;

  console.log("du: ", du);
  console.log("dv: ", dv);
  console.log("uRange", uRange);
  console.log("vRange: ", vRange);


  for (var u = -uRange; u < uRange; u += du) {
    for (var v = -vRange; v < vRange; v += dv) {
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
function generateBreatherNormals() {
  normalsE = [];

  // Assuming verticesE and loopSizeE are already defined

  // Helper function to calculate cross product of vectors
  function cross(a, b) {
    return vec4(
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
      0.0
    );
  }

  for (var i = 0; i < loopSizeE - 1; i++) {
    for (var j = 0; j < loopSizeE - 1; j++) {
      // Indices of the current quad
      var idx0 = i * loopSizeE + j;
      var idx1 = idx0 + 1;
      var idx2 = (i + 1) * loopSizeE + j;
      var idx3 = idx2 + 1;

      // Vertices of the current quad
      var v0 = verticesE[idx0];
      var v1 = verticesE[idx1];
      var v2 = verticesE[idx2];
      var v3 = verticesE[idx3];

      // Calculate tangent vectors with respect to u and v
      var tangentU = subtract(v1, v0);
      var tangentV = subtract(v2, v0);

      // Calculate normal using cross product
      var normal = normalize(cross(tangentU, tangentV));

      // Assign the same normal to each vertex of the quad
      normalsE.push(normal, normal, normal, normal);
    }
  }
}

/***************************************************
  Breather Index Generator
****************************************************/
function generateBreatherIndices() {
  indicesE = [];

  for (var i = 0; i < loopSizeE - 1; i++) {
    for (var j = 0; j < loopSizeE; j++) {
      indicesE.push(i * loopSizeE + j);
      indicesE.push((i + 1) * loopSizeE + j);
    }
  }
}

var theta = 0;
var phi = 0;
var prevX;
var prevY;
var prevTheta = 0;
var prevPhi = 0;

// Set light and material properties as shader uniforms
function setShaderUniforms() {
  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
  gl.uniform1f(gl.getUniformLocation(program, "materialShininess"), materialShininess);
}

function setShaderType() {
  gl.uniform1i(gl.getUniformLocation(program, "shaderType"), shaderMode);
}


/***************************************************
  Camera movement function 
  which decides object rotation
****************************************************/
function cameraMovement(event) {
  var curX = 2 * event.clientX / canvas.width - 1;
  var curY = 2 * (canvas.height - event.clientY) / canvas.height - 1;
  theta = prevTheta + (curY - prevY) * Math.PI / 20;
  phi = prevPhi - (curX - prevX) * Math.PI / 20;

  eyeX = eyeX;
  eyeY = eyeY * Math.cos(theta) - eyeZ * Math.sin(theta);
  eyeZ = eyeY * Math.sin(theta) + eyeZ * Math.cos(theta);

  eyeX = eyeX * Math.cos(phi) + eyeZ * Math.sin(phi);
  eyeY = eyeY;
  eyeZ = -eyeX * Math.sin(phi) + eyeZ * Math.cos(phi);

  var normalizedEye = normalize(vec3(eyeX, eyeY, eyeZ));
  eyeX = 11 * normalizedEye[0];
  eyeY = 11 * normalizedEye[1];
  eyeZ = 11 * normalizedEye[2];
}

/***************************************************
  Camera listeners
****************************************************/
function camera() {
  canvas.onmousedown = function (event) {
    prevX = 2 * event.clientX / canvas.width - 1;
    prevY = 2 * (canvas.height - event.clientY) / canvas.height - 1;
    isCameraMoving = true;
    canvas.style.cursor = "grabbing";
  }

  canvas.onmouseup = function (event) {
    isCameraMoving = false;
    prevTheta = theta;
    prevPhi = phi;
    canvas.style.cursor = "grab";
  }

  canvas.onmousemove = function (event) {
    if (isCameraMoving) {
      cameraMovement(event);
      canvas.style.cursor = "grabbing";
    }
    else {
      canvas.style.cursor = "grab";
    }
  }

  canvas.onwheel = function (event) {
    wheel = event.wheelDelta / 240;
    fov = fov - wheel;
  }
}

function setupShaderMode(id, mode) {
  document.getElementById(id).onchange = function () {
    shaderMode = mode;
    setShaderType();
    generateBreatherSurface();
  };
}

function setupSlider(id, rangeId, variable) {
  document.getElementById(id).oninput = function () {
    var sliderValue = event.srcElement.value;
    document.getElementById(rangeId).value = sliderValue;
    switch (variable) {
      case "uRange":
        uRange = parseFloat(sliderValue);
        break;
      case "vRange":
        vRange = parseFloat(sliderValue);
        break;
      case "du":
        du = parseFloat(sliderValue);
        break;
      case "dv":
        dv = parseFloat(sliderValue);
        break;
      case "aa":
        aa = parseFloat(sliderValue);
        break;
      case "lightPositionX":
        lightPosition[0] = parseFloat(sliderValue);
        break;
      case "lightPositionY":
        lightPosition[1] = parseFloat(sliderValue);
        break;
      case "lightPositionZ":
        lightPosition[2] = parseFloat(sliderValue);
        break;
    }
    if (variable === "lightPositionX" || variable === "lightPositionY" || variable === "lightPositionZ") {
      setShaderUniforms();
    }
    generateBreatherSurface();
  };
}

/***************************************************
  Vertex buffers with colors
****************************************************/
function processBuffers(color, vertices, normals, indices) {
  var colors = [];

  // Create color array as much as vertices length
  for (var i = 0; i < vertices.length; i++)
    colors.push(color);

  // Load the color data into the GPU
  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
  // Associate out vertex color variables with our color buffer
  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  // Load the vertex data into the GPU
  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
  // Associate out shader variables with our data buffer
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  // Load the normal vector data into the GPU
  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
  // Associate out shader variables with our data buffer
  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

/*******************************************************************
  Draggable UI Elements (Not modified)
 
  Taken from https://www.w3schools.com/howto/howto_js_draggable.asp
********************************************************************/
function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "Header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "Header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}