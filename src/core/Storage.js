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
    this._data = {};
    this.timerMap = {};
};

Storage.prototype = {};
Storage.prototype.constructor = Storage;

Object.defineProperties(Storage.prototype, {
    /**
     * 本地数据存储标志符
     */
    key : {
        get : function() {
            return this.game.localStorageID;
        }
    }
});

/**
 * 还原出所有的数据
 */
Storage.prototype.restore = function() {
};

/**
 * 保存所有数据
 */
Storage.prototype.save = function() {
};

/**
 * 保存一条记录
 */
Storage.prototype.set = function(k, v) {
    var key = this.key + "_" + k;
    this._data[key] = v;

    // 写缓存
    var str = JSON.stringify(v);
    if (!window.__wx)
        window.localStorage.setItem(key, str);
    else
        wx.setStorage({key: key, data: str});
};

/**
 * 保存一条记录，延时写入缓顾存
 */
Storage.prototype.delaySet = function(k, v, delay) {
    if (this.timerMap[k])
        return;

    var key = this.key + "_" + k;
    this._data[key] = v;

    var self = this;
    this.timerMap[k] = this.game.timer.add(delay, function() {
        delete self.timerMap[k];
        self.set(k, v);
    });
};

/**
 * 删除一条记录
 */
Storage.prototype.del = function(k) {
    var key = this.key + "_" + k;
    if (this._data[key])
        delete this._data[key];

    if (!window.__wx)
        window.localStorage.removeItem(key);
    else
        wx.removeStorageSync(key);
};

/**
 * 检索一条记录
 */
Storage.prototype.get = function(k) {
    var key = this.key + "_" + k;
    if (this._data[key])
        return this._data[key];

    var str;
    if (!window.__wx)
        str = window.localStorage.getItem(key);
    else
        str = wx.getStorageSync(key);
    var v;
    if (str) {
        v = JSON.parse(str);
        this._data[key] = v;
    }
    return v;
};
