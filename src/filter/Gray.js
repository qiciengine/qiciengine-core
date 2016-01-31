/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 灰度化
 */
var Gray = defineFilter('qc.Filter.Gray', qc.Filter, function(game) {
    this.fragmentSrc = [

        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        "uniform sampler2D uSampler;",

        "void main(void) {",
        '   vec4 original =  texture2D(uSampler, vTextureCoord);',
        '   float gray = original.r * 0.3 + original.g * 0.59 + original.b * 0.11;',
        '   gl_FragColor =  original;',
        '   gl_FragColor.r = gray;',
        '   gl_FragColor.g = gray;',
        '   gl_FragColor.b = gray;',
        "}"
    ];

}, {

});