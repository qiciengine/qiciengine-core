/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
* Called automatically when this sound is unlocked.
* @method Phaser.Sound#soundHasUnlocked
* @param {string} key - The Phaser.Cache key of the sound file to check for decoding.
* @protected
*/
Phaser.Sound.prototype.soundHasUnlocked = function(key) {
    if (key === this.key)
    {
        this._sound = this.game.cache.getSoundData(this.key);

        // 获取声音长度数据
        this.totalDuration = this.game._qc.sound._getAudioTagDurationInConfig(this);
    }
};


/**
* Play this sound, or a marked section of it.
*
* @method Phaser.Sound#play
* @param {string} [marker=''] - If you want to play a marker then give the key here, otherwise leave blank to play the full sound.
* @param {number} [position=0] - The starting position to play the sound from - this is ignored if you provide a marker.
* @param {number} [volume=1] - Volume of the sound you want to play. If none is given it will use the volume given to the Sound when it was created (which defaults to 1 if none was specified).
* @param {boolean} [loop=false] - Loop when finished playing? If not using a marker / audio sprite the looping will be done via the WebAudio loop property, otherwise it's time based.
* @param {boolean} [forceRestart=true] - If the sound is already playing you can set forceRestart to restart it from the beginning.
* @return {Phaser.Sound} This sound instance.
*/
Phaser.Sound.prototype.play = function (marker, position, volume, loop, forceRestart) {

    if (typeof marker === 'undefined' || marker === false || marker === null) { marker = ''; }
    if (typeof forceRestart === 'undefined') { forceRestart = true; }

    // console.log('Sound play: ' + marker);

    if (this.isPlaying && !this.allowMultiple && !forceRestart && !this.override)
    {
        //  Use Restart instead
        return this;
    }

    if (this._sound && this.isPlaying && !this.allowMultiple && (this.override || forceRestart))
    {
        if (this.usingWebAudio)
        {
            if (typeof this._sound.stop === 'undefined')
            {
                this._sound.noteOff(0);
            }
            else
            {
                try {
                    this._sound.stop(0);
                }
                catch (e) {
                }
            }
        }
        else if (this.usingAudioTag)
        {
            this._sound.pause();
            this._sound.currentTime = 0;
        }
    }

    if (marker === '' && Object.keys(this.markers).length > 0)
    {
        //  If they didn't specify a marker but this is an audio sprite,
        //  we should never play the entire thing
        return this;
    }

    if (marker !== '')
    {
        this.currentMarker = marker;

        if (this.markers[marker])
        {
            //  Playing a marker? Then we default to the marker values
            this.position = this.markers[marker].start;
            this.volume = this.markers[marker].volume;
            this.loop = this.markers[marker].loop;
            this.duration = this.markers[marker].duration;
            this.durationMS = this.markers[marker].durationMS;

            if (typeof volume !== 'undefined')
            {
                this.volume = volume;
            }

            if (typeof loop !== 'undefined')
            {
                this.loop = loop;
            }

            this._tempMarker = marker;
            this._tempPosition = this.position;
            this._tempVolume = this.volume;
            this._tempLoop = this.loop;

            // console.log('Marker pos: ' + this.position + ' duration: ' + this.duration + ' ms: ' + this.durationMS);
        }
        else
        {
            // console.warn("Phaser.Sound.play: audio marker " + marker + " doesn't exist");
            return this;
        }
    }
    else
    {
        position = position || 0;

        if (typeof volume === 'undefined') { volume = this._volume; }
        if (typeof loop === 'undefined') { loop = this.loop; }

        this.position = position;
        this.volume = volume;
        this.loop = loop;
        this.duration = 0;
        this.durationMS = 0;

        this._tempMarker = marker;
        this._tempPosition = position;
        this._tempVolume = volume;
        this._tempLoop = loop;
    }

    if (this.usingWebAudio)
    {
        //  Does the sound need decoding?
        if (this.game.cache.isSoundDecoded(this.key))
        {
            //  Do we need to do this every time we play? How about just if the buffer is empty?
            if (this._buffer === null)
            {
                this._buffer = this.game.cache.getSoundData(this.key);
            }

            this._sound = this.context.createBufferSource();
            this._sound.buffer = this._buffer;

            if (this.externalNode)
            {
                this._sound.connect(this.externalNode);
            }
            else
            {
                this._sound.connect(this.gainNode);
            }

            if (this.loop && marker === '')
            {
                this._sound.loop = true;
            }

            if (!this.loop && marker === '')
            {
                this._sound.onended = this.onEndedHandler.bind(this);
            }

            this.totalDuration = this._sound.buffer.duration;

            // console.log('dur', this._sound.buffer.duration, Math.ceil(this._sound.buffer.duration * 1000));

            if (this.duration === 0)
            {
                // console.log('duration reset');
                this.duration = this.totalDuration;
                this.durationMS = Math.ceil(this.totalDuration * 1000);
            }

            //  Useful to cache this somewhere perhaps?
            if (typeof this._sound.start === 'undefined')
            {
                this._sound.noteGrainOn(0, this.position, this.duration);
                //this._sound.noteOn(0); // the zero is vitally important, crashes iOS6 without it
            }
            else
            {
                if (this.loop && marker === '')
                {
                    this._sound.start(0);
                }
                else
                {
                    this._sound.start(0, this.position, this.duration);
                }
            }

            this.isPlaying = true;
            this.startTime = this.game.time.time;
            this.currentTime = 0;
            this.stopTime = this.startTime + this.durationMS;
            this.onPlay.dispatch(this);
        }
        else
        {
            this.pendingPlayback = true;

            if (this.game.cache.getSound(this.key) && this.game.cache.getSound(this.key).isDecoding === false)
            {
                this.game.sound.decode(this.key, this);
            }
        }
    }
    else
    {
        if (this.game.cache.getSound(this.key) && this.game.cache.getSound(this.key).locked)
        {
            this.game.cache.reloadSound(this.key);
            this.pendingPlayback = true;
        }
        else
        {
            if (this._sound && (this.game.device.cocoonJS || this._sound.readyState === 4 || (window.__wx && this._sound.readyState >= 2)))
            {
                this._sound.play();
                //  This doesn't become available until you call play(), wonderful ...
                this.totalDuration = this.game._qc.sound._getAudioTagDurationInConfig(this);

                if (this.duration === 0)
                {
                    this.duration = this.totalDuration;
                    this.durationMS = this.totalDuration * 1000;
                }

                this._sound.currentTime = this.position;
                this._sound.muted = this._muted;

                if (this._muted)
                {
                    this._sound.volume = 0;
                }
                else
                {
                    this._sound.volume = this._volume;
                }

                this.isPlaying = true;
                this.startTime = this.game.time.time;
                this.currentTime = 0;
                this.stopTime = this.startTime + this.durationMS;
                this.onPlay.dispatch(this);

                // console.log('stopTime: ' + this.stopTime + ' rs: ' + this._sound.readyState);
            }
            else
            {
                this.pendingPlayback = true;
            }
        }
    }

    return this;

}

/**
 * 解决在WebAudio模式下，loop循环的音乐在pause之后resume会导致loop失效的问题
 */
Phaser.Sound.prototype.resume = function () {

    if (this.paused && this._sound)
    {
        if (this.usingWebAudio)
        {
            var p = this.position + (this.pausedPosition / 1000);

            this._sound = this.context.createBufferSource();
            this._sound.buffer = this._buffer;

            if (this.externalNode)
            {
                this._sound.connect(this.externalNode);
            }
            else
            {
                this._sound.connect(this.gainNode);
            }

            if (this.loop)
            {
                this._sound.loop = true;
            }

            if (!this.loop && this.currentMarker === '')
            {
                this._sound.onended = this.onEndedHandler.bind(this);
            }

            var duration = this.duration - (this.pausedPosition / 1000);

            if (typeof this._sound.start === 'undefined')
            {
                this._sound.noteGrainOn(0, p, duration);
                //this._sound.noteOn(0); // the zero is vitally important, crashes iOS6 without it
            }
            else
            {
                // 如果是循环播放，则不传入duration，否则即使loop为true，播放到duration后就停止了
                if (this.loop)
                {
                    this._sound.start(0, p);
                }
                else
                {
                    this._sound.start(0, p, duration);
                }
            }
        }
        else
        {
            this._sound.play();
        }

        this.isPlaying = true;
        this.paused = false;
        this.startTime += (this.game.time.time - this.pausedTime);
        this.onResume.dispatch(this);
    }

};


