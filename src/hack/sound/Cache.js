/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

Phaser.Cache.prototype.getSound = function (key) {
    if (this._sounds[key])
    {
        return this._sounds[key];
    }
    else
    {
        // 关闭警告，qc.Sound构造函数未初始化key，导致audio tag下出警告提示
        //console.warn('Phaser.Cache.getSound: Invalid key: "' + key + '"');
        return null;
    }
};