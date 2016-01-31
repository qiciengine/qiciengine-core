/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 预制资源(包含场景)的描述
 *
 * @class qc.Prefab
 * @constructor
 * @internal
 */
var Prefab = qc.Prefab = function(key, url, data, meta) {
    /**
     * @property {string} key - 预制的标志
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
     * @property {object} json - 预制的数据
     * @internal
     */
    this.json = data;
};
Prefab.prototype.constructor = Prefab;

Object.defineProperties(Prefab.prototype, {
    /**
     * @property {string} uuid - 资源唯一标识符
     * @readonly
     */
    uuid : {
        get : function() { return this.meta.uuid; }
    },

    /**
     * @property {object} dependences - 本资源依赖于其他哪些资源?
     */
    dependences : {
        get : function() {
            return this.json.dependences;
        }
    }
});

/**
 * 当前是不是还有依赖的资源没有加载成功？
 */
Prefab.prototype.hasUnloadedDependence = function(game) {
    for (var i in this.dependences) {
        var data = this.dependences[i];
        if (data.ok) continue;
        if (data.uuid === this.uuid) continue;
        var asset = game.assets.find(data.uuid);
        if (!asset)
            // 还有资源没有加载进来
            return true;

        if (asset.hasUnloadedDependence &&
            asset.hasUnloadedDependence(game))
            return true;

        // 标记此资源已经加载了
        data.ok = true;
    }
    return false;
};
