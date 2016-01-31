/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * hackpp
 * 游戏的主循环，改由qici发起
 */
Phaser.Game.prototype.update = function(time) {
    var t1 = Date.now();
    this._qc.update(time);
    this._qc.debug.total += Date.now() - t1;
};

// hack住设置渲染模式的代码，加入白名单功能
var phaser_setUpRenderer = Phaser.Game.prototype.setUpRenderer;
Phaser.Game.prototype.setUpRenderer = function() {
    if (this.device.webGL && !this.device.desktop && !this.device.iOS) {
        if (qc.isSupportWebGL && !qc.isSupportWebGL(this._qc)) {
            this.device.webGL = false;
        }
    }
    phaser_setUpRenderer.call(this);
};