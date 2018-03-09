/// <reference path="webgl.d.ts" />

const DEBUG = true;

var vSource = `
precision mediump float;
attribute vec3 vertPosition;
attribute vec3 vertColor;
uniform mat4 mWorld;
uniform mat4 mProject;
uniform mat4 mView;
varying vec3 fragColor;
void main(){
    fragColor = vertColor;
    gl_Position = mProject * mView * mWorld * vec4(vertPosition, 1.0);
}
`;
var fSource = `
precision mediump float;
varying vec3 fragColor;
void main(){
    gl_FragColor = vec4(fragColor, 1.0);
}
`;

function main(){
    var canvas = document.getElementById('glCanvas');
    var gl = canvas.getContext('webgl');
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK)
    
    var vShader = gl.createShader(gl.VERTEX_SHADER);
    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vShader, vSource);
    gl.shaderSource(fShader, fSource);

    gl.compileShader(vShader);
    if(!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)){
        console.error("Vertext shader compile error", gl.getShaderInfoLog(vShader));
    }

    gl.compileShader(fShader);
    if(!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)){
        console.error("fragment shader compile error", gl.getShaderInfoLog(fShader));
    }

    var program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.error("Linker error", gl.getProgramInfoLog(program));
    }

    if(DEBUG){
        gl.validateProgram(program);
        if(!gl.getProgramParameter(program, gl.VALIDATE_STATUS)){
            console.error("Validate Error", gl.getProgramInfoLog(program));
        }
    }

    var boxVertices = 
	[ // X, Y, Z           R, G, B
		// Top
		-1.0, 1.0, -1.0,   0.5, 0.5, 0.5,
		-1.0, 1.0, 1.0,    0.5, 0.5, 0.5,
		1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
		1.0, 1.0, -1.0,    0.5, 0.5, 0.5,

		// Left
		-1.0, 1.0, 1.0,    0.75, 0.25, 0.5,
		-1.0, -1.0, 1.0,   0.75, 0.25, 0.5,
		-1.0, -1.0, -1.0,  0.75, 0.25, 0.5,
		-1.0, 1.0, -1.0,   0.75, 0.25, 0.5,

		// Right
		1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
		1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
		1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
		1.0, 1.0, -1.0,   0.25, 0.25, 0.75,

		// Front
		1.0, 1.0, 1.0,    1.0, 0.0, 0.15,
		1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		-1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		-1.0, 1.0, 1.0,    1.0, 0.0, 0.15,

		// Back
		1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
		1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		-1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		-1.0, 1.0, -1.0,    0.0, 1.0, 0.15,

		// Bottom
		-1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
		-1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
		1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
		1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
	];

	var boxIndices =
	[
		// Top
		0, 1, 2,
		0, 2, 3,

		// Left
		5, 4, 6,
		6, 4, 7,

		// Right
		8, 9, 10,
		8, 10, 11,

		// Front
		13, 12, 14,
		15, 14, 12,

		// Back
		16, 17, 18,
		16, 18, 19,

		// Bottom
		21, 20, 22,
		22, 20, 23
	];

    boxBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);

    boxIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);

    var positionAttLoc = gl.getAttribLocation(program, 'vertPosition');
    var colorAttLoc = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        positionAttLoc,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.vertexAttribPointer(
        colorAttLoc,
        3,
        gl.FLOAT,
        gl.FALSE,
        6 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(positionAttLoc);
    gl.enableVertexAttribArray(colorAttLoc);
    gl.useProgram(program);

    var mWorldUniLoc = gl.getUniformLocation(program, 'mWorld');
    var mViewUniLoc = gl.getUniformLocation(program, 'mView');
    var mProjectUniLoc = gl.getUniformLocation(program, 'mProject');

    var mWorld = new Float32Array(16);
    var mView = new Float32Array(16);
    var mProject = new Float32Array(16);
    mat4.identity(mWorld);
    //mat4.identity(mView);
    //mat4.identity(mProject);
    mat4.lookAt(mView, [0, 0, -5], [0, 0, 0], [0, 1, 0]);
    //mat4.ortho(mProject, 10, -10, -10, 10, .1, 100);
    mat4.perspective(mProject, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 100.0);

    gl.uniformMatrix4fv(mWorldUniLoc, gl.FALSE, mWorld);
    gl.uniformMatrix4fv(mViewUniLoc, gl.FALSE, mView);
    gl.uniformMatrix4fv(mProjectUniLoc, gl.FALSE, mProject);

    var idMatrix = new Float32Array(16);
    mat4.identity(idMatrix);

    var angle = 0;
    var loop = function(){
        angle = performance.now() / 1000 / 6 * Math.PI;
        mat4.rotate(mWorld, idMatrix, angle, [0, 1, 1]);
        gl.uniformMatrix4fv(mWorldUniLoc, gl.FALSE, mWorld);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    //Profit
}