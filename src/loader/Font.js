/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 字体的描述
 *
 * @class qc.Font
 * @constructor
 * @internal
 */
var Font = qc.Font = function(key, url, image, xml, meta) {
    /**
     * @property {string} key - 字体的标志
     * @readonly
     */
    this.key = key;

    /**
     * @property {string} url - 资源的网址
     * @readonly
     */
    this.url = url;

    /**
     * @property {object} meta - meta数据
     * @readonly
     */
    this.meta = meta;

    /**
     * @property {object} xml - 字体的数据
     * @readonly
     */
    this.xml = xml;

    /**
     * @property {image} image - 字体图片
     * @readonly
     */
    this.image = image;

    /**
     * @property {array} _fontUrl - webFont的地址
     * @private
     */
    this._fontUrl;

    /**
     * 字体类型
     * @private
     */
    this._fontFamily = qc.UIText.SYSTEMFONT;
};

Font.prototype.constructor = Font;

Object.defineProperties(Font.prototype, {
    /**
     * @property {string} uuid - 资源唯一标识符
     * @readonly
     */
    uuid : {
        get : function() { return this.meta.uuid; }
    },

    /**
     * @property {number} xSpacing
     * @readonly
     */
    xSpacing : {
        get : function() {
            return this.meta.xSpacing;
        }
    },

    /**
     * @property {number} ySpacing
     * @readonly
     */
    ySpacing : {
        get : function() {
            return this.meta.ySpacing;
        }
    }
});

/**
 * 释放字体资源
 * @param game
 * @internal
 */
Font.prototype.unload = function(game) {
    game.assets._cache.removeBitmapData(this.key);
    game.assets._cache.removeBitmapFont(this.key);
};
