/**
 * @author wudm
 * copyright 2015 Qcplay All Rights Reserved.
 */


// TODO: hack Phaser.Loader 中 fileComplete 结束回调后，上下文变化导致无法找到 game.cache 而报错
/**
 * Called when a file/resources had been downloaded and needs to be processed further.
 *
 * @method Phaser.Loader#fileComplete
 * @private
 * @param {object} file - File loaded
 * @param {?XMLHttpRequest} xhr - XHR request, unspecified if loaded via other means (eg. tags)
 */
var phaserFileComplete = Phaser.Loader.prototype.fileComplete;
Phaser.Loader.prototype.fileComplete = function (file, xhr) {
    // hack start
    // 上下文已经发生变化，不需要后续的行为
    if (!this.game.cache) return;
    // hack end

    // 返回原有函数进行继续处理
    phaserFileComplete.call(this, file, xhr);
};