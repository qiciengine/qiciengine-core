/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * hack Phaser.SoundManager 中 decode sound 结束回调后，上下文变化导致无法找到 game.cache 而报错
 * Decode a sound by its asset key.
 *
 * @method Phaser.SoundManager#decode
 * @param {string} key - Assets key of the sound to be decoded.
 * @param {Phaser.Sound} [sound] - Its buffer will be set to decoded data.
 */
Phaser.SoundManager.prototype.decode = function (key, sound) {
    sound = sound || null;

    var soundData = this.game.cache.getSoundData(key);

    if (soundData)
    {
        if (this.game.cache.isSoundDecoded(key) === false)
        {
            this.game.cache.updateSound(key, 'isDecoding', true);

            var that = this;

            try
            {
                this.context.decodeAudioData(soundData, function (buffer) {
                    // hack start
                    // 上下文已经发生变化，不需要后续的行为
                    if (!that.game.cache) return;
                    // hack end

                    if (buffer) {
                        that.game.cache.decodedSound(key, buffer);
                    }
                    that.onSoundDecode.dispatch(key, sound);
                }, function(e) {
                    that.onSoundDecode.dispatch(key, sound);
                }).catch(function(e) { });
            }
            catch (e) {
                that.onSoundDecode.dispatch(key, sound);
            }
        }
    }
};


/**
 * iOS9下必须在touchEnd进行unlock
 * Initialises the sound manager.
 * @method Phaser.SoundManager#boot
 * @protected
 */
Phaser.SoundManager.prototype.boot = function () {

    if (this.game.device.iOS && this.game.device.webAudio === false)
    {
        this.channels = 1;
    }

    if (window['PhaserGlobal'])
    {
        //  Check to see if all audio playback is disabled (i.e. handled by a 3rd party class)
        if (window['PhaserGlobal'].disableAudio === true)
        {
            this.usingWebAudio = false;
            this.noAudio = true;
            return;
        }

        //  Check if the Web Audio API is disabled (for testing Audio Tag playback during development)
        if (window['PhaserGlobal'].disableWebAudio === true)
        {
            this.usingWebAudio = false;
            this.usingAudioTag = true;
            this.noAudio = false;
            return;
        }
    }

    if (window['PhaserGlobal'] && window['PhaserGlobal'].audioContext)
    {
        this.context = window['PhaserGlobal'].audioContext;
    }
    else
    {
        if (!!window['AudioContext'])
        {
            try {
                this.context = new window['AudioContext']();
            } catch (error) {
                this.context = null;
                this.usingWebAudio = false;
                this.noAudio = true;

                console.error('SoundManager boot error!', error);
                qc.Util.popupError(error.message);
            }
        }
        else if (!!window['webkitAudioContext'])
        {
            try {
                this.context = new window['webkitAudioContext']();
            } catch (error) {
                this.context = null;
                this.usingWebAudio = false;
                this.noAudio = true;

                console.error('SoundManager boot error!', error);
                qc.Util.popupError(error.message);
            }
        }
    }

    if (!!window['Audio'] && this.context === null)
    {
        this.usingWebAudio = false;
        this.usingAudioTag = true;
        this.noAudio = false;
    }

    if (this.context !== null)
    {
        if (typeof this.context.createGain === 'undefined')
        {
            this.masterGain = this.context.createGainNode();
        }
        else
        {
            this.masterGain = this.context.createGain();
        }

        this.masterGain.gain.value = 1;
        this.masterGain.connect(this.context.destination);
    }

};

/**
 * iOS9下需要设置touchEndCallback为null
 */
Phaser.SoundManager.prototype.unlock = function () {
    if (this.touchLocked === false)
    {
        return;
    }

    //  Global override (mostly for Audio Tag testing)
    if (this.game.device.webAudio === false || (window['PhaserGlobal'] && window['PhaserGlobal'].disableWebAudio === true))
    {
        //  Create an Audio tag?
        this.touchLocked = false;
        this._unlockSource = null;
        this.game.input._qc.touch.callbackContext = null;

        // iOS9下必须在touchEnd进行unlock
        // https://github.com/photonstorm/phaser/commit/f64fc42f3e28c8f02562234ad8d09fd9d49fd24a
        if (this.game.device.iOSVersion > 8) {
            this.game.input._qc.touch.touchEndCallback = null;
        }
        else {
            this.game.input._qc.touch.touchStartCallback = null;
        }
        this.game.input._qc.mouse.callbackContext = null;
        this.game.input._qc.mouse.mouseDownCallback = null;
    }
    else
    {
        // Create empty buffer and play it
        var buffer = this.context.createBuffer(1, 1, 22050);
        this._unlockSource = this.context.createBufferSource();
        this._unlockSource.buffer = buffer;
        this._unlockSource.connect(this.context.destination);

        if (typeof this._unlockSource.start === 'undefined')
        {
            this._unlockSource.noteOn(0);
        }
        else
        {
            this._unlockSource.start(0);
        }
    }
};

/**
 * iOS9下需要设置touchEndCallback为null
 */
Phaser.SoundManager.prototype.update = function () {

    if (this.touchLocked)
    {
        if (this.game.device.webAudio && this._unlockSource !== null)
        {
            if ((this._unlockSource.playbackState === this._unlockSource.PLAYING_STATE || this._unlockSource.playbackState === this._unlockSource.FINISHED_STATE))
            {
                this.touchLocked = false;
                this._unlockSource = null;
                this.game.input._qc.touch.callbackContext = null;

                // iOS9下必须在touchEnd进行unlock
                // https://github.com/photonstorm/phaser/commit/f64fc42f3e28c8f02562234ad8d09fd9d49fd24a
                if (this.game.device.iOSVersion > 8) {
                    this.game.input._qc.touch.touchEndCallback = null;
                }
                else {
                    this.game.input._qc.touch.touchStartCallback = null;
                }
            }
        }
    }

    for (var i = 0; i < this._sounds.length; i++)
    {
        this._sounds[i].update();
    }

    if (this._watching)
    {
        var key = this._watchList.first;

        while (key)
        {
            if (this.game.cache.isSoundDecoded(key))
            {
                this._watchList.remove(key);
            }

            key = this._watchList.next;
        }

        if (this._watchList.total === 0)
        {
            this._watching = false;
            this._watchCallback.call(this._watchContext);
        }
    }

};
