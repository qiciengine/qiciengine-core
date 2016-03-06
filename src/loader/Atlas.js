/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 图集资源的描述
 *
 * @class qc.Atlas
 * @constructor
 * @internal
 */
var Atlas = qc.Atlas = function(key, url, data, meta, ani) {
    /**
     * @property {string} key - 图集的标志，直接使用资源的网址
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
     * @property {object} animation - 动作信息
     * @readonly
     */
    this.animation = undefined;

    /**
     * @property {object} json - 图集的atlas数据
     * @internal
     */
    this.json = undefined;

    /**
     * @property {Image} img - 图集对应的图片
     */
    this.img = undefined;

    // 记录图集的数据
    this._data = data;

    // 解析动作信息
    if (ani) {
        this.animation = {
            type : meta.animationType,
            data : ani
        }
    }
};
Atlas.prototype.constructor = Atlas;

Object.defineProperties(Atlas.prototype, {
    /**
     * @property {number} count - 图片的数量
     * @readonly
     */
    'count' : {
        get : function() { return this._data.frameData.total; }
    },

    /**
     * @property {Array} frames - 所有的图片信息
     * @readonly
     */
    'frames' : {
        get : function() {
            return this._data.frameData._frames;
        }
    },

    /**
     * @property {Array} frameNames - 图片的名字列表
     * @readonly
     */
    frameNames : {
        get : function() {
            var frames = this.frames;
            if (!frames || frames.length < 1) return [0];
            var list = [];
            for (var i in frames) {
                list.push(frames[i].name);
            }
            return list;
        }
    },

    /**
     * @property {string} uuid - 资源唯一标识符
     * @readonly
     */
    uuid : {
        get : function() { return this.meta.uuid; }
    },

    /**
     * @property {string} class - 类的名字
     * @internal
     */
    class : {
        get : function() { return 'qc.Atlas'; }
    }
});

/**
 * 根据名字或位置取得某个图片
 *
 * @method qc.Atlas#getFrame
 * @param frame {string|number} - 帧的位置或名字
 */
Atlas.prototype.getFrame = function(frame) {
    if (typeof frame === 'number')
        return this._data.frameData.getFrame(frame);
    return this._data.frameData.getFrameByName(frame);
};

/**
 * Get the texture from atlas
 * @method qc.Atlas#getTexture
 * @param frame {string|number} - The name or index of the texture
 */
Atlas.prototype.getTexture = function(frame) {
    return new qc.Texture(this, frame);
};

/**
 * 取得某个图片的9宫格信息
 * @param {string|undefined} frame
 * @return [left, top, right, bottom]
 */
Atlas.prototype.getPadding = function(frame) {
    if (!this.meta || !this.meta.padding) return [0, 0, 0, 0];

    // 只有一个图片时，固定返回padding的内容
    if (this.count == 1) {
        var keys = Object.keys(this.meta.padding);
        frame = keys.length > 0 ? keys[0] : 0;
    }

    if (frame === undefined) frame = 0;
    var padding = this.meta.padding[frame];
    if (padding) {
        // 确保为数字
        padding[0] *= 1;
        padding[1] *= 1;
        padding[2] *= 1;
        padding[3] *= 1;
    }
    return padding || [0, 0, 0, 0];
};

/**
 * 释放本资源信息
 * @internal
 */
Atlas.prototype.unload = function(game) {
    game.assets._cache.removeImage(this.key, false);

    delete PIXI.TextureCache[this.key];
    delete PIXI.BaseTextureCache[this.key];
};
