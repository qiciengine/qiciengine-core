/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 解决Android下AudioTag类型声音对象第一时间无法获取正确duration值问题
 */
Phaser.Loader.prototype.loadAudioTag = function (file) {

    var _this = this;

    if (this.game.sound.touchLocked)
    {
        //  If audio is locked we can't do this yet, so need to queue this load request. Bum.
        file.data = new Audio();
        file.data.name = file.key;
        file.data.preload = 'auto';
        file.data.src = file.localPath || this.transformUrl(file.url, file);

        this.fileComplete(file);
    }
    else
    {
        file.data = new Audio();
        file.data.name = file.key;

        var playThroughEvent = function () {
            file.data.removeEventListener('canplaythrough', playThroughEvent, false);
            file.data.removeEventListener('stalled', onStalled, false);
            file.data.onerror = null;
            // Why does this cycle through games?
            Phaser.GAMES[_this.game.id].load.fileComplete(file);
        };
        file.data.onerror = function () {
            file.data.removeEventListener('canplaythrough', playThroughEvent, false);
            file.data.removeEventListener('stalled', onStalled, false);
            file.data.onerror = null;
            _this.fileError(file);
        };
        var onStalled = function() {
            file.data.removeEventListener('canplaythrough', playThroughEvent, false);
            file.data.removeEventListener('stalled', onStalled, false);
            file.data.onerror = null;
            _this.fileError(file);
        };

        file.data.preload = 'auto';
        file.data.src = file.localPath || this.transformUrl(file.url, file);
        file.data.addEventListener('canplaythrough', playThroughEvent, false);
        file.data.addEventListener('stalled', onStalled, false);

        // 屏蔽load()调用，改行代码会导致Android下很多浏览器第一时间无法获取正确duration值
        //file.data.load();
    }

};
