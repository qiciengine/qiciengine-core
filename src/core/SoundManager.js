/**
 * @author luohj
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 声音管理器
 *
 * @class qc.SoundManager
 * @param {qc.Game} game - A reference to the currently running game.
 * @constructor
 * @internal
 */
var SoundManager = qc.SoundManager = function(game) {
    this.game = game;
    this.phaser = game.phaser.sound;
    this.phaser._qc = this;

    var self = this;
    game.onStart.add(function() {
        self._boot();
    });
};
SoundManager.prototype.constructor = SoundManager;

// 初始化声音处理
SoundManager.prototype._boot = function() {
    var phaserSound = this.phaser;
    var input = this.game.input;

    if (!phaserSound.game.device.cocoonJS && phaserSound.game.device.iOS || (window['PhaserGlobal'] && window['PhaserGlobal'].fakeiOSTouchLock))
    {
        input.touch.callbackContext = phaserSound;

        // iOS9下必须在touchEnd进行unlock
        // https://github.com/photonstorm/phaser/commit/f64fc42f3e28c8f02562234ad8d09fd9d49fd24a
        if (phaserSound.game.device.iOSVersion > 8) {
            input.touch.touchEndCallback = phaserSound.unlock;
        }
        else {
            input.touch.touchStartCallback = phaserSound.unlock;
        }

        input.mouse.callbackContext = phaserSound;
        input.mouse.mouseDownCallback = phaserSound.unlock;
        phaserSound.touchLocked = true;
    }
    else
    {
        phaserSound.touchLocked = false;
    }
};

Object.defineProperties(SoundManager.prototype, {
    /**
     * 静音设置：ture 为 静音 false为非静音
     * @property {boolean} mute
     */
    'mute' : {
        get : function() { return this.phaser.mute; },
        set : function(v) { this.phaser.mute = v; }
    },

    /**
     * 音量设置
     * @property {number} volume
     */
    'volume' : {
        get : function() { return this.phaser.volume; },
        set : function(v) {
            this.phaser.volume = v;
        }
    },

    /**
     * 声音模式 -- 使用 web audio
     */
    'usingWebAudio' : {
        get : function() { return this.phaser.usingWebAudio; }
    },

    /**
     * 声音模式 -- 使用 audio tag
     */
    'usingAudioTag' : {
        get : function() { return this.phaser.usingAudioTag; }
    },

    /**
     * 是否支持mp3播放
     */
    mp3Support: {
        get: function() {
            return this.game.phaser.device.mp3;
        }
    },

    /**
     * 是否支持ogg播放
     */
    oggSupport: {
        get: function() {
            return (this.game.phaser.device.ogg || this.game.phaser.device.opus);
        }
    },

    /**
     * 是否支持web audio播放
     */
    webAudioSupport: {
        get: function() {
            return this.game.phaser.sound.usingWebAudio;
        }
    }
});

/**
 * 获取声音文件对应的浏览器支持格式的 url
 */
SoundManager.prototype.tryGetUrl = function(url) {
    var newUrl = url;

    if (newUrl.indexOf('.mp3.bin') > 0) {
        if (!this.mp3Support) {
            newUrl = newUrl.replace('.mp3.bin', '.ogg.bin');
        }
    }
    else if (newUrl.indexOf('.ogg.bin') > 0) {
        if (!this.oggSupport) {
            newUrl = newUrl.replace('.ogg.bin', '.mp3.bin');
        }
    }

    if (!this.webAudioSupport) {
        newUrl = newUrl.replace('.bin', '');
    }

    // 返回结果
    return newUrl;
};