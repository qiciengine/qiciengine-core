/**
 * @author lijh
 * copyright 2015 Qcplay All Rights Reserved.
 * https://github.com/pixijs/pixi-extra-filters/blob/master/src/filters/glow/GlowFilter.js
 */

/**
 * 外发光
 */
var Glow = defineFilter('qc.Filter.Glow', qc.Filter, function(game) {
    this.distance = 40;
    this.outerStrength = 1.5;
    this.innerStrength = 1;
    this.glowColor = [1, 0, 0];

    this.pixelWidth = 1 / game.phaser.renderer.width;
    this.pixelHeight = 1 / game.phaser.renderer.height;

    this._updateFragmentSrc();

    // 指定 glowColor 属性的自定义显示类型
    this.registerCustomInspector('glowColor', qc.Color);
}, {
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

/**
 * 更新片段着色器
 */
Glow.prototype._updateFragmentSrc = function() {
    this.fragmentSrc = [
        'precision mediump float;',
        'varying vec2 vTextureCoord;',
        'uniform sampler2D texture;',
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
        '    float offset = 0.;',
        '    for (float curDistance = 0.; curDistance <= ' + this.distance.toFixed(7) + '; curDistance++) {',
        '       offset = curDistance - distance / 2.;',

        '       curColor = texture2D(texture, vec2(vTextureCoord.x + offset * px.x, vTextureCoord.y));',
        '       totalAlpha += (distance - curDistance) * curColor.a;',
        '       maxTotalAlpha += (distance - curDistance);',

        '       curColor = texture2D(texture, vec2(vTextureCoord.x, vTextureCoord.y + offset * px.y));',
        '       totalAlpha += (distance - curDistance) * curColor.a;',
        '       maxTotalAlpha += (distance - curDistance);',

        '       curColor = texture2D(texture, vec2(vTextureCoord.x + cos(PI * 0.25) * offset * px.x, vTextureCoord.y + sin(PI * 0.25) * offset * px.y));',
        '       totalAlpha += (distance - curDistance) * curColor.a;',
        '       maxTotalAlpha += (distance - curDistance);',

        '       curColor = texture2D(texture, vec2(vTextureCoord.x + cos(PI * 0.75) * offset * px.x, vTextureCoord.y + sin(PI * 0.75) * offset * px.y));',
        '       totalAlpha += (distance - curDistance) * curColor.a;',
        '       maxTotalAlpha += (distance - curDistance);',
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