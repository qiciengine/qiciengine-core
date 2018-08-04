/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 声音资源的描述
 *
 * @class qc.SoundAsset
 * @constructor
 * @internal
 */
var SoundAsset = qc.SoundAsset = function(key, url, sound,  meta) {
    /**
     * @property {string} key - 直接使用网址作为唯一标识
     * @readonly
     */
    this.key = url;

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
     * @property {object} sound - 声音信息
     * @readonly
     */
    this.sound = sound;
};
SoundAsset.prototype.constructor = SoundAsset;

Object.defineProperties(SoundAsset.prototype, {
    /**
     * @property {string} uuid - 资源唯一标识符
     * @readonly
     */
    uuid : {
        get : function() { return this.meta.uuid; }
    }
});

/**
 * 释放声音资源
 * @param game
 * @internal
 */
SoundAsset.prototype.unload = function(game) {
    if (window.__wx) {
        // 微信需要销毁音频实例
        this.sound.destroy();
    }
    game.assets._cache.removeSound(this.key);
};
