/**
 * @author luohj
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 时间
 *
 * @class qc.Time
 * @param {qc.Game} game - A reference to the currently running game.
 * @constructor
 * @internal
 */
var Time = qc.Time = function(game) {
    this.phaser = game.phaser.time;
    this.phaser._qc = this;

    this.onFrameRateChanged = new qc.Signal();
}
Time.prototype.constructor = Time;

Object.defineProperties(Time.prototype, {

    'game' : {
        get : function() { return this.phaser.game._qc; }
    },

    /**
     *  现在的时间戳 (1970-01-01午夜到现在的时间间隔，用毫秒表述)
     *  @property {number} now
     *  @return {number}
     */
    'now' : { get : function() { return Date.now(); } },

    /**
     * @property fixedTime {number} - 这是以毫秒秒计自游戏开始的时间
     */
    'fixedTime' : { get : function() { return this.phaser.totalElapsedSeconds() * 1000 ; } },

    /**
     * @property scaleTime {number} -  自游戏开始后经历的时间，受timeScale影响
     */
    'scaledTime' : {
        get : function() {
            return this.phaser._totalEscapeTime || 0;
        }
    },
    /**
     * 传递时间的缩放。这可以用于减慢运动效果。
     * - 1.0 = normal speed
     * - 2.0 = half speed
     * @property {number} timeScale
     */
    'timeScale' : {
        get : function()  { return this.phaser.slowMotion; },
        set : function(v) {
            if (v <= 0) v = 0.000001;
            this.phaser.slowMotion = v;
        }
    },

    /**
     * @property {number} frameRate - 游戏运行的帧率
     */
    'frameRate' : {
        get : function() { return this.phaser.desiredFps; },
        set : function(v) {
            this.phaser.desiredFps = v;
            this.onFrameRateChanged.dispatch(v);
        }
    },

    /**
     * @property {number} deltaTime - 最后一帧到当前帧的时间间隔（单位：毫秒）
     */
    'deltaTime' : { get : function() { return this.phaser.frameDeltaTime; } }
});

Time.prototype.applyFrameRate = function(v) {
    var frameRate = this.game.device.desktop ? v.desktop : v.mobile;
    this.frameRate = frameRate;
};


