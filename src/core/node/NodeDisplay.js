/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 拓展 Node 的绘制属性
 */
/**
 * 生成一张缓存图片
 * @param resolution {Number} - 生成的截图的解析度
 * @param scaleMode {Number} - {{#crossLink "qc/scaleModes:property"}}qc.scaleModes{{/crossLink}}
 * @param offX {Number} - 生成截图对于实际绘制区域的 x 轴偏移
 * @param offY {Number} - 生成截图对于实际绘制区域的 y 轴偏移
 * @param width {Number} - 生成截图的宽度
 * @param height {Number} - 生成截图的高度
 * @return {qc.RenderTexture}
 */
Node.prototype.generateTexture = function(resolution, scaleMode, offX, offY, width, height) {
    if (!this.phaser) {
        return new qc.RenderTexture(0, 0, renderer, scaleMode, resolution);
    }
    var bounds = this.localBounds;
    bounds.x += offX || 0;
    bounds.y += offY || 0;
    isNaN(width) || (bounds.width = width);
    isNaN(height) || (bounds.height = height);

    var renderTexture = new qc.RenderTexture(bounds.width | 0, bounds.height | 0, null, scaleMode, resolution);

    PIXI.DisplayObject._tempMatrix.tx = -bounds.x;
    PIXI.DisplayObject._tempMatrix.ty = -bounds.y;

    renderTexture.render(this.phaser, PIXI.DisplayObject._tempMatrix);

    return renderTexture;
};

// 用于渲染用的临时矩阵
Node._snapTempMatrix = new PIXI.Matrix();

/**
 * 生成一张缓存的 RenderTexture
 * @param srcBounds {qc.Rectangle} - 绘制源的绘制区域，默认当前 Node 自身在屏幕中的最终宽高
 * @param dstWidth  {number} - 绘制目标的宽，默认为 srcBound 的宽
 * @param dstHeight {number} - 绘制目标的高，默认为 srcBound 的高
 * @param resolution {Number} - 生成的截图的解析度，默认选择当前游戏的 resolution
 * @return {qc.RenderTexture}
 */
Node.prototype._snapshotAsRenderTexture = function(srcBounds, dstWidth, dstHeight, resolution) {
    // 无效的绘制参数
    if (!this.phaser) {
        return new qc.RenderTexture(0, 0);
    }

    // 计算源的绘制区域
    var bounds = srcBounds;
    var worldScale = this.getWorldScale();

    if (!bounds) {
        bounds = qc.Bounds.getBounds(this);
    }

    dstWidth = dstWidth || (bounds.width * worldScale.x);
    dstHeight = dstHeight || (bounds.height * worldScale.y);

    var drawScaleX = dstWidth / bounds.width;
    var drawScaleY = dstHeight / bounds.height;

    resolution = resolution || this.game.resolution;

    // 目标节点绘制矩阵（只保留缩放，加入偏移，还需要考虑目标画布大小导致的缩放）
    Node._snapTempMatrix.a = drawScaleX;
    Node._snapTempMatrix.d = drawScaleY;
    Node._snapTempMatrix.tx = -bounds.x * drawScaleX;
    Node._snapTempMatrix.ty = -bounds.y * drawScaleY;

    var phaserGame = this.game.phaser;

    var renderTexture = new qc.RenderTexture(1, 1, phaserGame.renderer, phaserGame.scale.scaleMode, resolution);
    renderTexture.resize(dstWidth, dstHeight, true);

    // 绘制工作开始吧
    renderTexture.render(this.phaser, Node._snapTempMatrix);

    return renderTexture;
};

/**
 * 生成一张缓存的 image 对象
 * @param srcBounds {qc.Rectangle} - 绘制源的绘制区域，默认当前 Node 自身在屏幕中的最终宽高
 * @param dstWidth  {number} - 绘制目标的宽，默认为 srcBound 的宽
 * @param dstHeight {number} - 绘制目标的高，默认为 srcBound 的高
 * @param resolution {Number} - 生成的截图的解析度，默认选择当前游戏的 resolution
 * @param loadedCallback {function} - Image 成功 loaded 后的回调
 * @return {qc.RenderTexture}
 */
Node.prototype.snapshotAsImage = function(srcBounds, dstWidth, dstHeight, resolution, loadedCallback) {
    var renderTexture = this._snapshotAsRenderTexture(srcBounds, dstWidth, dstHeight, resolution);
    var base64 = renderTexture.getBase64();

    // 可以删除
    renderTexture.destroy(true);

    // 生成贴图对象
    var img = new Image();
    img.src = base64;

    if (loadedCallback) {
        // 关注图片生成
        img.onload = function() {
            loadedCallback(img);
        };
    }

    return img;
};

/**
 * 生成一张缓存的 atlas 对象，可以直接作为 UIImage 的使用
 * @param key {qc.Rectangle} - atlas key，后续可以用 assets.find 来获取到资源
 * @param srcBounds {qc.Rectangle} - 绘制源的绘制区域，默认当前 Node 自身在屏幕中的最终宽高
 * @param dstWidth  {number} - 绘制目标的宽，默认为 srcBound 的宽
 * @param dstHeight {number} - 绘制目标的高，默认为 srcBound 的高
 * @param resolution {Number} - 生成的截图的解析度，默认选择当前游戏的 resolution
 * @return {qc.RenderTexture}
 */
Node.prototype.snapshotAsAtlas = function(key, srcBounds, dstWidth, dstHeight, resolution) {
    // 获取 render texture
    var renderTexture = this._snapshotAsRenderTexture(srcBounds, dstWidth, dstHeight, resolution);

    // 需要删除之前缓存中记录的 key
    var cache = this.game.assets._cache;
    if (cache.checkImageKey(key)) cache.removeImage(key, false);

    // 加入到游戏中
    var atlas = qc.AssetUtil.addAtlasFromImage(this.game, key, key, renderTexture.getCanvas());

    return atlas;
};
