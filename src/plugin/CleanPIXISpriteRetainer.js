/**
 * @author wudm
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 负责处理PIXI renderer 中 spriteBatch 对 sprite 的失效引用
 * 该引用会导致内存泄漏
 * @param game
 * @param parent
 * @constructor
 * @internal
 */

qc.CleanPIXISpriteRetainer = function(game, parent) {
    this._frameCount = 0;
    this.game = game;
}
qc.CleanPIXISpriteRetainer.prototype = {
    postRender : function() {
        this._frameCount++;
        if (this._frameCount < 100)
        // 100 帧再统一处理一次
            return;

        this._frameCount = 0;
        var renderer = this.game.phaser.renderer;
        if (!(renderer instanceof PIXI.WebGLRenderer))
        // 非 WebGL 模式不处理
            return;

        // 执行具体的消除引用行为
        var sprites = renderer.spriteBatch.sprites;
        var batchSize = renderer.spriteBatch.currentBatchSize;
        var maxLen = sprites.length;
        for (var i = batchSize; i < maxLen; i++) {
            sprites[i] = null;
        }
    }
};
qc.CleanPIXISpriteRetainer.prototype.constructor = qc.CleanPIXISpriteRetainer;
