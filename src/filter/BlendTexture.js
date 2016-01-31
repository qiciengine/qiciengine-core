/**
 * Created by qcplay on 7/9/15.
 */
var BlendTexture = defineFilter('qc.Filter.BlendTexture', qc.Filter, function(game) {
    this.mixing = 0.5;
    this.otherTexture = null;
    this.vertexSrc = [
        'attribute vec2 aVertexPosition;',
        'attribute vec2 aTextureCoord;',
        'attribute vec2 aOtherTextureCoord;',
        'attribute vec4 aColor;',

        'uniform vec2 projectionVector;',
        'uniform vec2 offsetVector;',

        'varying vec2 vTextureCoord;',
        'varying vec2 vOtherTextureCoord;',
        'varying vec4 vColor;',

        'const vec2 center = vec2(-1.0, 1.0);',

        'void main(void) {',
        '   gl_Position = vec4( ((aVertexPosition + offsetVector) / projectionVector) + center , 0.0, 1.0);',
        '   vTextureCoord = aTextureCoord;',
        '   vOtherTextureCoord = aOtherTextureCoord;',
        '   vColor = vec4(aColor.rgb * aColor.a, aColor.a);',
        '}'
    ];
    this.fragmentSrc = [

        'precision mediump float;',
        'varying vec2 vTextureCoord;',
        'varying vec2 vOtherTextureCoord;',
        'varying vec4 vColor;',

        'uniform sampler2D uSampler;',
        'uniform sampler2D otherTexture;',
        'uniform float mixing;',

        'void main(void) {',
        '   vec4 original =  texture2D(uSampler, vTextureCoord);',
        '   vec4 add =  texture2D(otherTexture, vOtherTextureCoord);',
        '   gl_FragColor = mixing * add + (1.0 - mixing) * original;',
        '}'

    ];
},{
    otherTexture : qc.Filter.SAMPLER2D,
    mixing : qc.Filter.F1
});