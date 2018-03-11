/// <reference path="webgl.d.ts" />

const DEBUG = true;

var vSource = `
precision mediump float;
attribute vec3 vertPosition;
attribute vec2 vertTexCord;
uniform mat4 mWorld;
uniform mat4 mProject;
uniform mat4 mView;
varying vec2 fragTexCord;
void main(){
    fragTexCord = vertTexCord;
    gl_Position = mProject * mView * mWorld * vec4(vertPosition, 1.0);
}
`;
var fSource = `
precision mediump float;
varying vec2 fragTexCord;
uniform sampler2D sampler;
void main(){
    gl_FragColor = texture2D(sampler, fragTexCord);
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
		-1.0, 1.0, -1.0,   0, 0,
		-1.0, 1.0, 1.0,    0, 1,
		1.0, 1.0, 1.0,     1, 1,
		1.0, 1.0, -1.0,    1, 0,

		// Left
		-1.0, 1.0, 1.0,    1, 1,
		-1.0, -1.0, 1.0,   0, 1,
		-1.0, -1.0, -1.0,  0, 0,
		-1.0, 1.0, -1.0,   1, 0,

		// Right
		1.0, 1.0, 1.0,    1, 1,
		1.0, -1.0, 1.0,   0, 1,
		1.0, -1.0, -1.0,  0, 0,
		1.0, 1.0, -1.0,   1, 0,

		// Front
		1.0, 1.0, 1.0,    1, 1,
		1.0, -1.0, 1.0,    1, 0,
		-1.0, -1.0, 1.0,    0, 0,
		-1.0, 1.0, 1.0,    0, 1,

		// Back
		1.0, 1.0, -1.0,    1, 1,
		1.0, -1.0, -1.0,    1, 0,
		-1.0, -1.0, -1.0,    0, 0,
		-1.0, 1.0, -1.0,    0, 1,

		// Bottom
		-1.0, -1.0, -1.0,   0, 0,
		-1.0, -1.0, 1.0,    0, 1,
		1.0, -1.0, 1.0,     1, 1,
		1.0, -1.0, -1.0,    1, 0
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
    var textCordAttLoc = gl.getAttribLocation(program, 'vertTexCord');
    gl.vertexAttribPointer(
        positionAttLoc,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.vertexAttribPointer(
        textCordAttLoc,
        2,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        3 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.enableVertexAttribArray(positionAttLoc);
    gl.enableVertexAttribArray(textCordAttLoc);

    const boxTexture = loadTexture(gl, 'crate.png');
    /*
    var boxTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, boxTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, 1, 1, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, boxTecImg); 
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById("crateImg")); 
    gl.bindTexture(gl.TEXTURE_2D, null);
    */

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

        gl.clearColor(0.1, 1.1, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, boxTexture);
        gl.activeTexture(gl.TEXTURE0);

        gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    //Profit
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
  
    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    srcFormat, srcType, image);
  
      // WebGL1 has different requirements for power of 2 images
      // vs non power of 2 images so check if the image is a
      // power of 2 in both dimensions.
      if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
         // Yes, it's a power of 2. Generate mips.
         gl.generateMipmap(gl.TEXTURE_2D);
      } else {
         // No, it's not a power of 2. Turn of mips and set
         // wrapping to clamp to edge
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      }
    };
    image.src = url;
  
    return texture;
  }
  
  function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
  }