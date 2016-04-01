/**
 * @author wudm
 * copyright 2015 Qcplay All Rights Reserved.
 */


/**
 * Called by the Stage visibility handler.
 *
 * @method Phaser.Game#gamePaused
 * @param {object} event - The DOM event that caused the game to pause, if any.
 * @protected
 */
Phaser.Game.prototype.gamePaused = function (event) {

    //   If the game is already paused it was done via game code, so don't re-pause it
    if (!this._paused)
    {
        this._paused = true;
        this.time.gamePaused();
        this.sound.setMute();
        this.onPause.dispatch(event);

        //  Avoids Cordova iOS crash event: https://github.com/photonstorm/phaser/issues/1800
        if (this.device.cordova && this.device.iOS)
        {
            this.lockRender = true;
        }
    }

};

/**
 * Called by the Stage visibility handler.
 *
 * @method Phaser.Game#gameResumed
 * @param {object} event - The DOM event that caused the game to pause, if any.
 * @protected
 */
Phaser.Game.prototype.gameResumed = function (event) {

    //  Game is paused, but wasn't paused via code, so resume it
    if (this._paused && !this._codePaused)
    {
        this._paused = false;
        this.time.gameResumed();
        this.input.reset();
        this.sound.unsetMute();
        this.onResume.dispatch(event);

        //  Avoids Cordova iOS crash event: https://github.com/photonstorm/phaser/issues/1800
        if (this.device.cordova && this.device.iOS)
        {
            this.lockRender = false;
        }
    }

};

// TODO: hack Phaser.Game 中 parseConfig 方法，其 antialias 默认值为 true，且判断是写成
//       if (config['antialias']) ...  导致我们 config 中的 antialias 设置为 false 不被接受
/**
 * Parses a Game configuration object.
 *
 * @method Phaser.Game#parseConfig
 * @protected
 */
var phaserGameParseConfig = Phaser.Game.prototype.parseConfig;
Phaser.Game.prototype.parseConfig = function(config) {
    // 返回原有函数进行继续处理
    phaserGameParseConfig.call(this, config);

    // hack start
    // 设置 antialias
    if ('antialias' in config) {
        this.antialias = !!config['antialias'];
    }
    // hack end
};

// hack Phaser.RequestAnimationFrame
// 原版中主循环调度没有捕获错误，这里加上
var phaser_updateSetTimeout = Phaser.RequestAnimationFrame.prototype.updateSetTimeout;
Phaser.RequestAnimationFrame.prototype.updateSetTimeout = function() {
    try {
        phaser_updateSetTimeout.call(this);
    }
    catch (e) {
        this.game._qc.log.error('Error：{0}', e.stack);
    }
};
var phaser_updateRAF = Phaser.RequestAnimationFrame.prototype.updateRAF;
Phaser.RequestAnimationFrame.prototype.updateRAF = function(rafTime) {
    try {
        phaser_updateRAF.call(this, rafTime);
    }
    catch (e) {
        this.game._qc.log.error('Error：{0}', e.stack);
    }
};

// 用来提供实际每帧的间隔
Phaser.Game.prototype.updateFrameDelta = function(fixedFrameDelta) {
    var self = this,
        time = self.time;
    var currTime = time.time;
    var diff = self.__lastFrameTime ? (currTime - self.__lastFrameTime) : fixedFrameDelta;
    self.__lastFrameTime = currTime;
    time.frameDeltaTime = diff / time.slowMotion;
    time._totalEscapeTime = time.frameDeltaTime + (time._totalEscapeTime || 0);
};
