/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

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


