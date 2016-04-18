/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 * https://github.com/pixijs/pixi-extra-filters/blob/master/src/filters/glow/GlowFilter.js
 */

/**
 * 外发光
 */
var Glow = defineFilter('qc.Filter.Glow', qc.Filter, function(game) {
    this.quality = 0.4;
    this.distance = 25;
    this.outerStrength = 2;
    this.innerStrength = 1;
    this.glowColor = [1, 0, 0];

    this.pixelWidth = 1 / game.phaser.renderer.width;
    this.pixelHeight = 1 / game.phaser.renderer.height;

    this._updateFragmentSrc();

    this.registerCustomInspector('glowColor', qc.Color);
}, {
    quality: qc.Filter.F1,
    distance: qc.Filter.F1,
    outerStrength: qc.Filter.F1,
    innerStrength: qc.Filter.F1,
    glowColor: qc.Filter.F3V
});

Object.defineProperty(Glow.prototype, 'distance', {
    get: function() {
        return this._distance;
    },
    set: function(value) {
        this._distance = value;
        this._updateFragmentSrc();

        // 清空shader，之后会重新生成
        this.shaders = [];
    }
});

Object.defineProperty(Glow.prototype, 'quality', {
    get: function() {
        return this._quality;
    },
    set: function(value) {
        this._quality = value;
        this._updateFragmentSrc();

        // 清空shader，之后会重新生成
        this.shaders = [];
    }
});

/**
 * 更新片段着色器
 */
Glow.prototype._updateFragmentSrc = function() {
    this.fragmentSrc = [
        'precision mediump float;',
        'varying vec2 vTextureCoord;',
        'uniform sampler2D texture;',
        'uniform float quality;',
        'uniform float distance;',
        'uniform float outerStrength;',
        'uniform float innerStrength;',
        'uniform vec3 glowColor;',
        'uniform float pixelWidth;',
        'uniform float pixelHeight;',
        'vec2 px = vec2(' + this.pixelWidth + ', ' + this.pixelHeight + ');',
        'void main(void) {',
        '    const float PI = 3.14159265358979323846264;',
        '    vec4 ownColor = texture2D(texture, vTextureCoord);',
        '    vec4 curColor;',
        '    float totalAlpha = 0.;',
        '    float maxTotalAlpha = 0.;',
        '    float cosAngle;',
        '    float sinAngle;',
        '    for (float angle = 0.; angle <= PI * 2.; angle += ' + (1 / this.distance).toFixed(7) + ') {',
        '       cosAngle = cos(angle);',
        '       sinAngle = sin(angle);',
        '       for (float curDistance = 1.; curDistance <= ' + (this.distance * this.quality).toFixed(7) + '; curDistance++) {',
        '           curColor = texture2D(texture, vec2(vTextureCoord.x + cosAngle * curDistance * px.x, vTextureCoord.y + sinAngle * curDistance * px.y));',
        '           totalAlpha += (distance * quality - curDistance) * curColor.a;',
        '           maxTotalAlpha += (distance * quality - curDistance);',
        '       }',
        '    }',
        '    maxTotalAlpha = max(maxTotalAlpha, 0.0001);',

        '    ownColor.a = max(ownColor.a, 0.0001);',
        '    ownColor.rgb = ownColor.rgb / ownColor.a;',
        '    float outerGlowAlpha = (totalAlpha / maxTotalAlpha)  * outerStrength * (1. - ownColor.a);',
        '    float innerGlowAlpha = ((maxTotalAlpha - totalAlpha) / maxTotalAlpha) * innerStrength * ownColor.a;',
        '    float resultAlpha = (ownColor.a + outerGlowAlpha);',
        '    gl_FragColor = vec4(mix(mix(ownColor.rgb, glowColor, innerGlowAlpha / ownColor.a), glowColor.rgb, outerGlowAlpha / resultAlpha) * resultAlpha, resultAlpha);',
        '}'
    ];
};