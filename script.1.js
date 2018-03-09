/// <reference path="webgl.d.ts" />

const DEBUG = true;

var vSource = `
precision mediump float;
attribute vec2 vertPosition;
attribute vec3 vertColor;
uniform mat4 mWorld;
uniform mat4 mProject;
uniform mat4 mView;
varying vec3 fragColor;
void main(){
    fragColor = vertColor;
    gl_Position = mProject * mView * mWorld * vec4(vertPosition, 1.0, 1.0);
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

    var triangle = [
        1.0, 1.0, 0.0, 0.0, 1.0,
        -1.0, 1.0, 0.0, 0.0, 1.0,
        -1.0, -1.0, 0.0, 0.0, 1.0,

        1.0, 1.0, 0.0, 0.0, 1.0,
        1.0, -1.0, 0.0, 1.0, 0.0,
        -1.0, -1.0, 0.0, 0.0, 1.0,

        0.0, 0.5, 1.0, 1.0, 1.0,
        -0.5, -0.5, 1.0, 0.0, 0.0,
        0.5, -0.5, 0.0, 0.0, 0.0
    ]

    triBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangle), gl.STATIC_DRAW);

    var positionAttLoc = gl.getAttribLocation(program, 'vertPosition');
    var colorAttLoc = gl.getAttribLocation(program, 'vertColor');
    gl.vertexAttribPointer(
        positionAttLoc,
        2,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        0
    );
    gl.vertexAttribPointer(
        colorAttLoc,
        3,
        gl.FLOAT,
        gl.FALSE,
        5 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT
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
    mat4.lookAt(mView, [0, 0, -1], [0, 0, 0], [0, 1, 0]);
    mat4.ortho(mProject, 1, -1, -1, 1, .1, 100);
    //mat4.perspective(mProject, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 100.0);

    gl.uniformMatrix4fv(mWorldUniLoc, gl.FALSE, mWorld);
    gl.uniformMatrix4fv(mViewUniLoc, gl.FALSE, mView);
    gl.uniformMatrix4fv(mProjectUniLoc, gl.FALSE, mProject);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 9);
    //Profit
}