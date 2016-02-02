/**
 * @author luohj
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 声音
 *
 * @class qc.Sound
 * @extends qc.Node
 * @param {qc.Game} game - A reference to the currently running game.
 * @constructor
 * @internal
 */
var Sound = qc.Sound = function(game, parent, uuid) {
    this.soundPhaser = new Phaser.Sound(game.phaser);
    this.soundPhaser._qc = this;

    this._loop = false;
    this.game = game;

    // 调用基类的初始
    qc.Node.call(this, new Phaser.Group(this.game.phaser, null), parent, uuid);

    // 初始化默认的名字
    this.name = 'Sound';

    // 注册信号回调
    this._related();

    // 将此声音添加到声音管理器中
    game.phaser.sound._sounds.push(this.soundPhaser);

    // 是否在awake里播放
    this._playOnAwake = false;

    // 默认在声音播放完毕后销毁
    this.destroyWhenStop = true;
};

Sound.prototype = Object.create(qc.Node.prototype);
Sound.prototype.constructor = Sound;

Object.defineProperties(Sound.prototype, {
    /**
     * @property {boolean} loop - 是否循环播放当前声音
     */
    'loop' : {
        get : function() { return this.soundPhaser.loop; },
        set : function(v) {
            this._loop = v;
            this.soundPhaser.loop = v;
            if (this.soundPhaser._sound) {
                this.soundPhaser._sound.loop = v;
            }
        }
    },

    /**
     * @property {SoundAsset} audio
     */
    'audio' : {
        get : function() {
            return this.game.assets.find(this.soundPhaser.key);
        },
        set : function(v) {
            var soundPhaser = this.soundPhaser;
            if (!v) {
                soundPhaser.key = v;
                return;
            }

            // 重新设置声音
            var key = v.key;
            if (soundPhaser && soundPhaser.key) {
                // 保存老值
                var oldLoop = this.loop,
                    oldMute = this.mute,
                    oldVolume = this.volume;

                soundPhaser.destroy();
                soundPhaser = this.soundPhaser = new Phaser.Sound(this.game.phaser, key);
                soundPhaser._qc = this;
                this.game.phaser.sound._sounds.push(soundPhaser);

                // 重置老值
                this.loop = oldLoop;
                this.mute = oldMute;
                this.volume = oldVolume;
            }
            else {
                soundPhaser.key = key;
                if (soundPhaser.usingAudioTag) {
                    if (soundPhaser.game.cache.getSound(key) && soundPhaser.game.cache.isSoundReady(key)) {
                        soundPhaser._sound = soundPhaser.game.cache.getSoundData(key);
                        soundPhaser.totalDuration = 0;

                        if (soundPhaser._sound.duration) {
                            soundPhaser.totalDuration = soundPhaser._sound.duration;
                        }
                    }
                    else {
                        soundPhaser.game.cache.onSoundUnlock.add(soundPhaser.soundHasUnlocked, soundPhaser);
                    }
                }
            }
        }
    },

    /**
     * @property {number} volume - 音量
     */
    'volume' : {
        get : function() { return this.soundPhaser.volume; },
        set : function(v) {
            this.soundPhaser.volume = v;
        }
    },

    /**
     * @property {boolean} playOnAwake - 是否在awake中播放
     */
    'playOnAwake' : {
        get : function() { return this._playOnAwake; },
        set : function(v) { this._playOnAwake = v; }
    },

    /**
    * @property {boolean} - 静音
    */
    'mute' : {
        get : function() { return this.soundPhaser.mute; },
        set : function(v) {this.soundPhaser.mute = v; }
    },

    /**
     * @property {boolean} destroyWhenStop - 声音播放完毕后自动销毁
     */
    destroyWhenStop : {
        get : function() { return this._destroyWhenStop || false; },
        set : function(v) {
            this._destroyWhenStop = v;
        }
    },

    /**
     * @property {string} class - 类的名字
     * @internal
     */
    class : {
        get : function() { return 'qc.Sound'; }
    },

    /**
     * @property {boolean} isPlaying - 是否正在播放
     */
    'isPlaying' : {
        get : function() {
            return this.soundPhaser.isPlaying;
        },
        set : function(v) {
            if (v)
                this.play();
            else
                this.stop();
        }
    },

    /**
     * @property {boolean} isPaused - 是否暂停中
     */
    'isPaused' : {
        get : function() {
            return this.soundPhaser.paused;
        }
    }
});

/**
 * 序列化完成后派发awake事件
 * @private
 * @override
 */
Sound.prototype._dispatchAwake = function() {
    var self = this;
    Node.prototype._dispatchAwake.call(self);
    if (!self.game.device.editor && self.playOnAwake) {
        // 直接播放声音
        self.play();
    }
};

/**
 * 注册信号回调
 * @method qc.SoundManager#_related
 */
Sound.prototype._related = function() {
    var self = this;
    self.onDecoded = self.soundPhaser.onDecoded;

    /**
     * @property {qc.Signal} onStop
     */
    self.onStop = self.soundPhaser.onStop;
    this.onStop.add(function(sound) {
        if (!self.game.device.editor && self.destroyWhenStop) {
            self.destroy();
        }
    }, self);

    /**
     * @property {qc.Signal} onLoop
     */
    self.onLoop = self.soundPhaser.onLoop;
};
/**
 * 播放声音
 * @method qc.SoundManager#play
 * @return {qc.Sound} The new sound instance.
 */
Sound.prototype.play = function() {
    if (this.isPaused) {
        this.soundPhaser.resume();
        return this;
    }
    // 需要将onended设置为空，否则如果连续调用play的情况下onended会将isPlaying参数错误设置为false
    if (this.soundPhaser.isPlaying && this.soundPhaser._sound && this.soundPhaser.usingWebAudio) {
        this.soundPhaser._sound.onended = null;
    }
    var markerName = this.marker ? this.marker.name : null;
    this.soundPhaser.play(markerName);
    return this;
};

/**
 * 淡入播放声音
 * @method qc.Sound#fadeIn
 * @param {number} duration - 淡入的时间，单位为毫秒
 */
Sound.prototype.fadeIn = function(duration) {
    this.soundPhaser.fadeIn(duration);
};

/**
 * 淡出播放声音
 * @method qc.Sound#fadeOut
 * @param {number} duration - 淡入的时间，单位为毫秒
 */
Sound.prototype.fadeOut = function(duration) {
    this.soundPhaser.fadeOut(duration);
};

/**
 * 暂停声音
 * @method qc.Sound#pause
 */
Sound.prototype.pause = function() { this.soundPhaser.pause(); };

/**
 * 恢复声音
 * @method qc.Sound#resume
 */
Sound.prototype.resume = function() { this.soundPhaser.resume(); };

/**
 * 停止播放声音
 * @method qc.Sound#stop
 */
Sound.prototype.stop = function() {
    // 需要将onended设置为空，否则如果调用stop再play的情况下onended会将isPlaying参数错误设置为false
    if (this.soundPhaser.isPlaying && this.soundPhaser._sound && this.soundPhaser.usingWebAudio) {
        this.soundPhaser._sound.onended = null;
    }
    this.soundPhaser.stop();
};

/**
 * 添加播放标记 从指定位置播放
 * @method qc.Sound#addMarker
 * @param {number} start - The start point of this marker in the audio file, given in seconds. 2.5 = 2500ms, 0.5 = 500ms, etc.
 * @param {number} duration - The duration of the marker in seconds. 2.5 = 2500ms, 0.5 = 500ms, etc.
 */
Sound.prototype.addMarker = function(start, duration) {
    // 先移除播放标记
    this.removeMarker();

    // 创建新的播放标记
    this.marker = {};
    this.marker.name = "s";
    this.marker.start = start;
    this.marker.duration = duration;

    // 将标记添加都phaser里
    this.soundPhaser.addMarker(this.marker.name, start, duration);
};

/**
 * 移除播放标记
 * @method qc.Sound#removeMarker
 */
Sound.prototype.removeMarker = function() {
    if (!this.marker) {
        return;
    }

    // 将phaser的标记清空
    this.soundPhaser.currentMarker = "";
    this.soundPhaser.markers = {};
    this.marker = null;
};

/**
 * @method onDestroy
 * @overide
 * @internal
 */
Sound.prototype.onDestroy = function() {
    this.game.phaser.sound.remove(this.soundPhaser);
    // 调用父类的析构
    qc.Node.prototype.onDestroy.call(this);
};

/**
 * 获取需要被序列化的信息描述
 * @overide
 * @internal
 */
Sound.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加Sound需要序列化的内容
    json.audio = s.AUDIO;
    json.loop = s.BOOLEAN;
    json.volume = s.NUMBER;
    json.playOnAwake = s.BOOLEAN;
    json.mute = s.BOOLEAN;
    json.destroyWhenStop = s.BOOLEAN;
    return json;
};
