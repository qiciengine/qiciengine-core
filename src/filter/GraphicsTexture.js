/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 着色器使用的绘制贴图
 */

var GraphicsTexture = qc.Filter.GraphicsTexture = function(game, width, height, render, resolution) {
    var self = this;

    /**
     * 游戏对象
     * @type {qc.Game}
     */
    self.game = game;

    /**
     * 使用的贴图
     * @type {qc.RenderTexture}
     */
    self._texture = new qc.RenderTexture(width || 100, height || 100, render || self.game.phaser.render, null, resolution || self.game.resolution);

    /**
     * Graphics在Texture中呈现时的偏移
     * @type {qc.Point}
     */
    self.offset = new qc.Point(0, 0);

    /**
     * 绘制对象
     * @type {PIXI.Graphics}
     */
    self._graphics = self.game.phaser.add.graphics(0, 0);
    if (self._graphics.parent) {
        self._graphics.parent.removeChild(self._graphics);
    }
};

GraphicsTexture.prototype = {};
GraphicsTexture.prototype.constructor = GraphicsTexture;

Object.defineProperties(GraphicsTexture.prototype, {
    /**
     *  @property {PIXI.Graphics} graphics - 用来绘制图元的绘制对象
     *  @readonly
     */
    graphics : {
        get : function() {
            return this._graphics;
        }
    },

    /**
     * @property {PIXI.Texture} filterTexture - 用于着色器使用的贴图
     */
    filterTexture : {
        get : function() {
            return this._texture;
        }
    }
});

/**
 * 更新贴图
 */
GraphicsTexture.prototype.updateTexture = function() {
    var self = this,
        texture = self._texture,
        g = self._graphics;
    if (g.dirty) {
        texture.directRenderWebGL(g, self.offset, true);    
    }
};

/**
 * 修改贴图的大小
 * @param  {number} width  - 贴图的宽
 * @param  {number} height - 贴图的高
 */
GraphicsTexture.prototype.resize = function(width, height) {
    width = width <= 1 ? 1 : width;
    height = height <= 1 ? 1 : height;
    this._texture.resize(width, height, true);
};