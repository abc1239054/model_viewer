var state = {
	cubeRotation: 0.0,
	ui: {
		dragging: false,
		mouse: {
			lastX: -1,
			lastY: -1,
		},
		pressedKeys: {},
	},
	app: {
		angle: {
			x: 0,
			y: 0,
		},
		eye: {
			x: 2.,
			y: 2.,
			z: 7.,
		},
		fieldOfView: 45.,
	},
};


main();

//
// Start here
//
function main() {
	state.canvas = document.querySelector('#glcanvas');
	const gl = state.canvas.getContext('webgl');

	// If we don't have a GL context, give up now

	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}

	// Vertex shader program

	const vsSource = `
	attribute vec3 aVertexPosition;
	attribute vec3 aNormal;
	//attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
	uniform mat4 uProjectionMatrix;
	varying lowp vec4 vColor;
    void main() {
	  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
	  vColor =  vec4(0.5 * aNormal + 0.5, 1.0);
    }
  `;

	// Fragment shader program

	const fsSource = `
	varying lowp vec4 vColor;
    void main() {
      gl_FragColor = vColor;
    }
  `;

	// Initialize a shader program; this is where all the lighting
	// for the vertices and so forth is established.
	const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

	// Collect all the info needed to use the shader program.
	// Look up which attribute our shader program is using
	// for aVertexPosition and look up uniform locations.
	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
			normal: gl.getAttribLocation(shaderProgram, 'aNormal'),
			//vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor')
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
			modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
		},
	};

	initCallbacks();

	const model = loadModel('./3d_models/armadillo.obj');
	//console.log(model.vertices);
	//console.log(model.numOfVertices);
	//console.log(model.numOfNormals);

	// Here's where we call the routine that builds all the
	// objects we'll be drawing.
	const buffers = initBuffers(gl, model);

	var then = 0;

	// Draw the scene repeatedly
	function render(now) {
		now *= 0.001;  // convert to seconds
		const deltaTime = now - then;
		then = now;
		updateState();

		drawScene(gl, programInfo, buffers, deltaTime, model);

		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);

}


function initCallbacks() {
	document.onkeydown = keydown;
	document.onkeyup = keyup;
	state.canvas.onmousedown = mousedown;
	state.canvas.onmouseup = mouseup;
	state.canvas.onmousemove = mousemove;
	state.canvas.onmousewheel = mousewheel;
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple two-dimensional square.
//
function initBuffers(gl, model) {

	// Create a buffer for the square's positions.

	const vertexBuffer = gl.createBuffer();

	// Select the positionBuffer as the one to apply buffer
	// operations to from here out.

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

	

	// Now pass the list of positions into WebGL to build the
	// shape. We do this by creating a Float32Array from the
	// JavaScript array, then use it to fill the current buffer.

	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(model.vertices),
		gl.STATIC_DRAW);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

	// Now send the element array to GL

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(model.indices), gl.STATIC_DRAW);

	const normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(model.normals),
		gl.STATIC_DRAW);

	return {
		vertexBuffer: vertexBuffer,
		indexBuffer: indexBuffer,
		normalBuffer: normalBuffer,
	};
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, deltaTime, model) {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
	gl.clearDepth(1.0);                 // Clear everything
	gl.enable(gl.DEPTH_TEST);           // Enable depth testing
	gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

	// Clear the canvas before we start drawing on it.

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Create a perspective matrix, a special matrix that is
	// used to simulate the distortion of perspective in a camera.
	// Our field of view is 45 degrees, with a width/height
	// ratio that matches the display size of the canvas
	// and we only want to see objects between 0.1 units
	// and 100 units away from the camera.

	const fieldOfView = state.app.fieldOfView * Math.PI / 180;   // in radians
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = glMatrix.mat4.create();

	// note: glmatrix.js always has the first argument
	// as the destination to receive the result.
	glMatrix.mat4.perspective(projectionMatrix,
		fieldOfView,
		aspect,
		zNear,
		zFar);

	// Set the drawing position to the "identity" point, which is
	// the center of the scene.
	const modelViewMatrix = glMatrix.mat4.create();

	// Now move the drawing position a bit to where we want to
	// start drawing the square.


	glMatrix.mat4.translate(modelViewMatrix,     // destination matrix
		modelViewMatrix,     // matrix to translate
		[0.0, 0.0, -3.0]);  // amount to translate

	//glMatrix.mat4.rotate(modelViewMatrix,  // destination matrix
	//	modelViewMatrix,  // matrix to rotate
	//	cubeRotation,   // amount to rotate in radians
	//	[0, 0, 1]); 

	glMatrix.mat4.rotateX(modelViewMatrix,  // destination matrix
		modelViewMatrix,  // matrix to rotate
		state.app.angle.x,// amount to rotate in radians
	);

	glMatrix.mat4.rotateY(modelViewMatrix,  // destination matrix
		modelViewMatrix,  // matrix to rotate
		state.app.angle.y,// amount to rotate in radians
	);


	// Tell WebGL how to pull out the positions from the position
	// buffer into the vertexPosition attribute.
	{
		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);

		gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition,
			3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

		gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normalBuffer);
		gl.vertexAttribPointer(
			programInfo.attribLocations.normal,
			3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(programInfo.attribLocations.normal);

	}

	// Tell WebGL to use our program when drawing

	gl.useProgram(programInfo.program);

	// Set the shader uniforms

	gl.uniformMatrix4fv(
		programInfo.uniformLocations.projectionMatrix,
		false,
		projectionMatrix);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.modelViewMatrix,
		false,
		modelViewMatrix);

	{
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
		gl.drawElements(gl.TRIANGLES, model.numOfIndices, gl.UNSIGNED_SHORT, 0);
	}

	state.cubeRotation += deltaTime;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	// Create the shader program

	const shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	// If creating the shader program failed, alert

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
		return null;
	}

	return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
	const shader = gl.createShader(type);

	// Send the source to the shader object

	gl.shaderSource(shader, source);

	// Compile the shader program

	gl.compileShader(shader);

	// See if it compiled successfully

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}


function loadModel(file) {
	var rawFile = new XMLHttpRequest();
	var model = {};
	rawFile.open("GET", file, false);
	rawFile.onreadystatechange = function () {
		if (rawFile.readyState === 4) {
			if (rawFile.status === 200 || rawFile.status == 0) {
				model = {
					vertices: [],
					indices: [],
					normals: [],
					numOfVertices: 0,
					numOfIndices: 0,
					numOfNormals: 0,
				};
				var allText = rawFile.responseText;
				var lines = allText.split('\n');

				const callback = (line) => {
					if (line[0] == 'v') {
						var vertices = line.split(' ');
						model.vertices.push
							(parseFloat(vertices[1]),
								parseFloat(vertices[2]),
								parseFloat(vertices[3]));
					}
					else if (line[0] == 'f') {
						var indices = line.split(' ');
						model.indices.push(indices[1] - 1, indices[2] - 1, indices[3] - 1);
					}
				}
				lines.forEach(callback);
				model.numOfIndices = model.indices.length;
				model.numOfVertices = model.vertices.length / 3;

				computeNormals(model);
			}

		}
	}
	rawFile.send(null);
	return model;
}


function computeNormals(model) {
	model.normals = new Float32Array(model.numOfIndices * 3);
	for (var i = 0; i < model.numOfIndices; i += 3) {
		
		var indexOfA = model.indices[i];
		var indexOfB = model.indices[i + 1];
		var indexOfC = model.indices[i + 2];
		var vertexA = glMatrix.vec3.fromValues(
			model.vertices[indexOfA * 3],
			model.vertices[indexOfA * 3 + 1],
			model.vertices[indexOfA * 3 + 2]);
		var vertexB = glMatrix.vec3.fromValues(
			model.vertices[indexOfB * 3],
			model.vertices[indexOfB * 3 + 1],
			model.vertices[indexOfB * 3 + 2]);
		var vertexC = glMatrix.vec3.fromValues(
			model.vertices[indexOfC * 3],
			model.vertices[indexOfC * 3 + 1],
			model.vertices[indexOfC * 3 + 2]);

		var AB = glMatrix.vec3.create();
		var AC = glMatrix.vec3.create();
		var normal = glMatrix.vec3.create();
		glMatrix.vec3.sub(AB, vertexB, vertexA);
		glMatrix.vec3.sub(AC, vertexC, vertexA);
		glMatrix.vec3.cross(normal, AB, AC);
		glMatrix.vec3.normalize(normal, normal);

		model.normals[indexOfA * 3] = normal[0];
		model.normals[indexOfA * 3 + 1] = normal[1];
		model.normals[indexOfA * 3 + 2] = normal[2];
		model.normals[indexOfB * 3] = normal[0];
		model.normals[indexOfB * 3 + 1] = normal[1];
		model.normals[indexOfB * 3 + 2] = normal[2];
		model.normals[indexOfC * 3] = normal[0];
		model.normals[indexOfC * 3 + 1] = normal[1];
		model.normals[indexOfC * 3 + 2] = normal[2];

		model.numOfNormals = model.normals.length / 3;
	}
}

