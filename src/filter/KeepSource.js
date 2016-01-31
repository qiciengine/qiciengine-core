/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 为 shader处理 保持原图效果
 */
var KeepSource = defineFilter('qc.Filter.KeepSource', qc.Filter, function(game) {
    this.fragmentSrc = [

        "precision mediump float;",
        "varying vec2 vTextureCoord;",
        "varying vec4 vColor;",
        'varying vec2 vMaskCoord;',
        'varying vec4 vMaskLimit;',

        "uniform sampler2D uSampler;",
        "uniform sampler2D uSourceSampler;",

        "void main(void) {",
        '   vec4 original =  texture2D(uSampler, vTextureCoord);',
        '   vec4 add =  texture2D(uSourceSampler, vTextureCoord);',
        '   gl_FragColor =  add.a * add + (1.0 - add.a) * original;',
        "}"

    ];

}, {

});