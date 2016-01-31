/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 着色器使用的贴图
 */
var FilterTexture = qc.Filter.FilterTexture = function(game) {
    this._image = new qc.UIImage(game, null, false);
    this._image.parent.removeChild(this._image);
};

FilterTexture.prototype = {};
FilterTexture.prototype.constructor = FilterTexture;

Object.defineProperties(FilterTexture.prototype, {
    /**
     *  @property {qc.Atlas} texture - 获取or设置当前的图片
     */
    texture : {
        get : function() {
            return this._image.texture;
        },
        set : function(v) {
            this._image.texture = v;
        }
    },

    /**
     *  @property {int|string} frame - 获取or设置当前的图片帧，一般是图集才会用到该属性（可以为数字或别名）
     */
    frame : {
        get: function () {
            return this._image.frame;
        },

        set: function (value) {
            this._image.frame = value;
        }
    },

    /**
     * @property {PIXI.Texture} filterTexture - 用于着色器使用的贴图
     */
    filterTexture : {
        get : function() {
            return this._image.phaser.texture;
        }
    }
});