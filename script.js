/// <reference path="webgl.d.ts" />

const DEBUG = true;

var vSource = `
precision highp float;
attribute vec3 vertPosition;
attribute vec3 vertColor;
uniform mat4 mProViewWorld;
uniform mat4 mAngle;
uniform vec3 posOffset;
varying vec3 fragColor;
void main(){
    fragColor = vertColor;
    gl_Position = mProViewWorld * mAngle * vec4(vertPosition, 1.0) + vec4(posOffset, 0.0);
}
`;
var fSource = `
precision highp float;
varying vec3 fragColor;
void main(){
    gl_FragColor = vec4(fragColor, 1.0);
}
`;

function main(){
    var canvas = document.getElementById('glCanvas');
    var gl = canvas.getContext('webgl');
    var programs = {
        vertColor: {
            program: createProgram(
                gl, 
                createShader(gl, gl.VERTEX_SHADER, vSource),
                createShader(gl, gl.FRAGMENT_SHADER, fSource)),
            attrib: [{
                loc: "vertPosition",
                size: 3,
                type: gl.FLOAT,
                norm: gl.FALSE,
                stride: 6 * Float32Array.BYTES_PER_ELEMENT,
                offset: 0,
            },
            {
                loc: "vertColor",
                size: 3,
                type: gl.FLOAT,
                norm: gl.FALSE,
                stride: 6 * Float32Array.BYTES_PER_ELEMENT,
                offset: 3 * Float32Array.BYTES_PER_ELEMENT,
            }],
            uniform: {
                mProViewWorld: null,
                posOffset: null,
                mAngle: null,
            },
            setUniforms: (gl) => {
                programs.vertColor.uniform.mProViewWorld = gl.getUniformLocation(programs.vertColor.program, "mProViewWorld");
                programs.vertColor.uniform.posOffset = gl.getUniformLocation(programs.vertColor.program, "posOffset");
                programs.vertColor.uniform.mAngle = gl.getUniformLocation(programs.vertColor.program, "mAngle");
            },
        },
    }
    var obj = {
        triangle: {
        program: programs.vertColor,
        vert: [
            0.0, 0.0, 0.0, .27, 1.0, 0.705,
            0.0, 1.0, 0.0, .27, 1.0, 0.705,
            -0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
        ],
        index: [
            0,1,2,
        ],
        posOffset: [0.0, 0.0, 0.0],
        transform: null,
        axis: [0, 0, 1],
        },
        box: {
            program: programs.vertColor,
            vert: [
                0.0, 0.0, 0.0, 1.0, 1.0, 0.705,
                1.0, 0.0, 0.0, .6, 1.0, 0.705,
                1.0, 1.0, 0.0, .6, 0, 1.0,
                0.0, 1.0, 0.0, .6, 0, 1.0,
            ],
            index: [
                0,1,2,
                0,2,3,
            ],
            posOffset: [0.0, 0.0, 0.0],
            transform: null,
            axis: [1, 1, 1],
        },
        curser: {
            program: programs.vertColor,
            vert: [
                0, 0, 0, 0, 0, 0,
                .1, 0, 0, 1, 1, 1,
                0, .3, 0, 1, 1, 1,
                -.1, 0, 0, 1, 1, 1,
                -.1, -.1, 0, 1, 1, 1,
                .1, -.1, 0, 1, 1, 1,
            ],
            index: [
                0,1,2,
                0,2,3,
                0,3,4,
                0,5,1,
            ],
            posOffset: [0.0, 0.0, 0.0],
            transform: null,
            axis: [1, 1, 1],
        }
    };
    var objToDraw = [
        new drawObj(gl, obj.triangle),
    ];
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);

    gl.useProgram(programs.vertColor.program);

    for(var program in programs){
        programs[program].setUniforms(gl);
    }

    var mWorld = new Float32Array(16);
    var inWorld = new Float32Array(16);
    var mView = new Float32Array(16);
    var mProject = new Float32Array(16);
    var mProViewWorld = new Float32Array(16);

    mat4.identity(mWorld);
    mWorld[5] = canvas.width / 1000;
    mWorld[0] = canvas.height / 1000;
    mat4.invert(inWorld, mWorld);
    mat4.lookAt(mView, [0, 0, -1], [0, 0, 0], [0, 1, 0]);
    mat4.ortho(mProject, 1, -1, -1, 1, .1, 10);
    mat4.multiply(mProViewWorld, mProject, mView);
    mat4.multiply(mProViewWorld, mProViewWorld, mWorld);

    var mRotate = new Float32Array(16);
    gl.uniformMatrix4fv(programs.vertColor.uniform.mProViewWorld, gl.FALSE, mProViewWorld);

    var curser = new drawObj(gl, obj.curser);
    var randomStuff = [];
    objToDraw.push(curser);

    canvas.addEventListener('mousemove', function(evt) {
        var pos = getMousePos(canvas, evt);
        curser.toDraw = true;
        curser.moveScreen([pos.x * 2 - 1, pos.y * 2 + 1, 0]);
    }, false);
    canvas.addEventListener('mouseleave', (evt) => {
        curser.toDraw = false;
    }, false);
    canvas.addEventListener('click', (evt) => {
        var thing = new drawObj(gl, obj.box);
        var pos = getMousePos(canvas, evt);
        thing.scale(Math.random());
        thing.moveScreen([pos.x * 2 - 1, pos.y * 2 + 1, 0]);
        randomStuff.push(thing);
        objToDraw.push(thing);
    }, false);

    var angle = 0;
    var delta = 0;
    var prev = 0;
    var loop = function(){
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        delta = (performance.now() - prev) / 1000;
        prev = performance.now();
        objToDraw.forEach(element => {
            element.draw(delta);
        });
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}
function createShader(gl, type, source){
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        console.error("Vertext shader compile error", gl.getShaderInfoLog(shader));
    }
    return shader;
}
function createProgram(gl, vShader, fShader){
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
    return program;
}
function getMousePos(canvas, evt){
    var rect = canvas.getBoundingClientRect();
    return{
        x: (evt.clientX - rect.left) / canvas.width,
        y: -1 * (evt.clientY - rect.top) / canvas.height
    };
}
class drawObj{
    constructor(gl, obj){
        this.obj = obj;
        this.gl = gl;
        this.position = [0, 0, 0];
        this.transform = new Float32Array(16);
        mat4.identity(this.transform);
        this.axis = this.obj.axis;
        this.toDraw = true;
        this.posTarget = null;
        this.moveTime = 0;
        this.transTarget = null;
        this.trasTime = 0;
    }
    bindBufferAndAttrib(){
        var buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.obj.vert), this.gl.STATIC_DRAW);
        if(this.obj.index != null){
            buffer = this.gl.createBuffer(); //TODO test this
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.obj.index), this.gl.STATIC_DRAW);
        }
        var location = null;
        var attrib = this.obj.program.attrib;
        for(var i = 0; i < attrib.length; ++i){
            location = this.gl.getAttribLocation(this.obj.program.program, attrib[i].loc);
            this.gl.vertexAttribPointer(
                location,
                attrib[i].size,
                attrib[i].type,
                attrib[i].norm,
                attrib[i].stride,
                attrib[i].offset
            );
            this.gl.enableVertexAttribArray(location);
        }
    }
    draw(delta){
        if(this.posTarget != null){
            this.position[0] += delta * (this.position[0] - this.posTarget[0]) / this.moveTime;
            this.position[1] += delta * (this.position[1] - this.posTarget[1]) / this.moveTime;
            this.moveTime -= delta;
            if(this.moveTime < 0){
                this.position[0] = this.posTarget[0];
                this.position[1] = this.posTarget[1];
                this.posTarget = null;
            }
        }
        if(this.transTarget != null){

        }
        if(this.toDraw){
            this.bindBufferAndAttrib();
            this.gl.uniform3fv(this.obj.program.uniform.posOffset, this.position);
            this.gl.uniformMatrix4fv(this.obj.program.uniform.mAngle, this.gl.FALSE, this.transform);
            this.gl.drawElements(this.gl.TRIANGLES, this.obj.index.length, this.gl.UNSIGNED_SHORT, 0);
        }
    }
    movePositon(position, world){
        var conversion = new Float32Array(3);
        mat4.getScaling(conversion, world);
        this.position = [position[0] * conversion[0], position[1] * conversion[1], position[2]];
    }
    moveScreen(position){
        this.position = position;
    }
    scale(factor){
        mat4.multiplyScalar(this.transform, this.transform, factor);
        this.transform[15] = 1;
    }
}