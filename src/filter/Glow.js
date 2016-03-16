/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 * https://github.com/pixijs/pixi-extra-filters/blob/master/src/filters/glow/GlowFilter.js
 */

/**
 * 外发光
 */
var Glow = defineFilter('qc.Filter.Glow', qc.Filter, function(game) {
    this.strength = 3;
    this.glowColor = [1, 0, 0];

    this.fragmentSrc = [
        'precision mediump float;',
        'varying vec2 vTextureCoord;',
        'uniform sampler2D texture;',
        'uniform float strength;',
        'uniform vec3 glowColor;',
        'void main(void) {',
        '    vec4 ownColor = texture2D(texture, vTextureCoord);',
        '    float glowAlpha = ownColor.a * strength * (1. - ownColor.a);',
        '    float resultAlpha = (ownColor.a + glowAlpha);',
        '    gl_FragColor = vec4(mix(ownColor.rgb, glowColor, glowAlpha / resultAlpha) * resultAlpha, resultAlpha);',
        '}'
    ];
}, {
    strength: qc.Filter.F1,
    glowColor: qc.Filter.F3V
});