/**
 * @author chenx
 * @date 2015.12.23
 * copyright 2015 Qcplay All Rights Reserved.
 *
 */

/**
 * action资源的描述
 *
 * @class qc.ActionAsset
 * @constructor
 * @internal
 */
var ActionAsset = qc.ActionAsset = function(key, url, data, meta) {
    /**
     * @property {string} key - 资源的标志
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
     * @property {object} json - 资源的数据
     * @internal
     */
    this.json = data;
};
ActionAsset.prototype.constructor = ActionAsset;

Object.defineProperties(ActionAsset.prototype, {
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
ActionAsset.prototype.hasUnloadedDependence = function(game) {
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
