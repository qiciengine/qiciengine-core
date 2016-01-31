/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 文本资源的描述
 *
 * @class qc.TextAsset
 * @constructor
 * @internal
 */
var TextAsset = qc.TextAsset = function(key, url, data, meta) {
    /**
     * @property {string} key - 图集的标志
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
     * @property {string} text - 文本信息
     * @readonly
     */
    this.text = data;
}
TextAsset.prototype.constructor = TextAsset;

Object.defineProperties(TextAsset.prototype, {
    /**
     * @property {string} uuid - 资源唯一标识符
     * @readonly
     */
    uuid : {
        get : function() { return this.meta.uuid; }
    }
});

/**
 * 释放文本资源
 * @param game
 * @internal
 */
SoundAsset.prototype.unload = function(game) {
    game.assets._cache.removeText(this.key);
};

