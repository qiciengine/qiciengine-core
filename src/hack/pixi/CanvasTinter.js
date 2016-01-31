/**
 * @author linyw
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * Phaser2.3的实现未考虑sprite.tintedTexture已有的对象进行复用，
 * Phaser2.4考虑了老对象并对创建Canvas进行了池化：sprite.tintedTexture || PIXI.CanvasPool.create(this);
 * 我们先复用老的sprite.tintedTexture，后续可再考虑池化
 */
PIXI.CanvasTinter.getTintedTexture = function(sprite, color)
{
    var canvas = sprite.tintedTexture || document.createElement("canvas");

    PIXI.CanvasTinter.tintMethod(sprite.texture, color, canvas);

    return canvas;
};