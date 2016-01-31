/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 灰度化
 */
var Highlight = defineFilter('qc.Filter.Highlight', qc.Filter, function(game) {
    this.vertexSrc = [
        'attribute vec2 aVertexPosition;',
        'attribute vec2 aTextureCoord;',
        'attribute vec4 aColor;',

        'uniform vec2 projectionVector;',
        'uniform vec2 offsetVector;',
        "uniform float light;",
        "uniform vec3 lightColor;",

        'varying vec2 vTextureCoord;',
        'varying vec4 vColor;',
        'varying vec4 vLight;',

        'const vec2 center = vec2(-1.0, 1.0);',

        'void main(void) {',
        '   gl_Position = vec4( ((aVertexPosition + offsetVector) / projectionVector) + center , 0.0, 1.0);',
        '   vTextureCoord = aTextureCoord;',
        '   vColor = vec4(aColor.rgb * aColor.a, aColor.a);',
        '   vLight = light * vec4(lightColor, 0.0);',
        '}'
    ];
    this.fragmentSrc = [
        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        'varying vec4 vLight;',

        "uniform sampler2D uSampler;",


        "void main(void) {",
        '   vec4 original =  texture2D(uSampler, vTextureCoord);',
        '   gl_FragColor = original + original.a * vLight;',
        "}"
    ];
    this.light = 0.5;
    this.lightColor = [1, 1, 1];
}, {
    light : qc.Filter.F1,
    lightColor : qc.Filter.F3V
});