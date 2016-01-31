/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 本地数据保存
 *
 * @class qc.Storage
 * @constructor
 * @internal
 */
var Storage = qc.Storage = function(game) {
    this.game = game;
    this.restore();
}
Storage.prototype = {};
Storage.prototype.constructor = Storage;

Object.defineProperties(Storage.prototype, {
    /**
     * 本游戏使用的唯一标识符，采用BundleIdentifier
     */
    key : {
        get : function() {
            return this.game.bundleIdentifier;
        }
    }
});

/**
 * 还原出所有的数据
 */
Storage.prototype.restore = function() {
    var str = window.localStorage.getItem(this.key);
    if (str) {
        this._data = JSON.parse(str);
    }
    else {
        this._data = {};
    }
}

/**
 * 保存所有数据
 */
Storage.prototype.save = function() {
    var key = this.key;
    if (!key || key === 'com.DefaultCompany.Default') {
        throw new Error('game.bundleIdentifier should be set for local storage');
    }
    var str = JSON.stringify(this._data);
    window.localStorage.setItem(this.key, str);
}

/**
 * 保存一条记录
 */
Storage.prototype.set = function(k, v) {
    this._data[k] = v;
}

/**
 * 删除一条记录
 */
Storage.prototype.del = function(k) {
    if (this._data[k])
        delete this._data[k];
}

/**
 * 检索一条记录
 */
Storage.prototype.get = function(k) {
    if (this._data[k])
        return this._data[k];
}
