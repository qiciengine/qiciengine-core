/**
 * @author wudm
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * image 对象，一般用于 UI，静态图片显示
 *
 * @class qc.UIImage
 * @extends qc.Node
 * @param {qc.Game} game
 * @constructor
 * @internal
 */
var UIImage = qc.UIImage = function(game, parent, uuid) {
    var self = this;
    var phaserImage = new Phaser.Sprite(game.phaser);
    qc.Node.call(self, phaserImage, parent, uuid);
    self._oldUpdateTransformFunc = phaserImage.updateTransform;

    // 需要重载掉 Phaser 的 _renderWebGL 来实现九宫格
    phaserImage._renderWebGL = imageRenderWebGL;

    // 需要重载掉 Phaser 的 _renderCanvas 来实现九宫格
    phaserImage._renderCanvas = imageRenderCanvas;

    // 初始化九宫格边界
    self._borderLeft = 0;
    self._borderRight = 0;
    self._borderTop = 0;
    self._borderBottom = 0;

    self._imageType = qc.UIImage.IMAGE_TYPE_SIMPLE;

    // 初始化默认的名字
    self.name = 'UIImage';
};

UIImage.prototype = Object.create(qc.Node.prototype);
UIImage.prototype.constructor = UIImage;

UIImage.IMAGE_TYPE_SIMPLE = 0;
UIImage.IMAGE_TYPE_SLICED = 1;
UIImage.IMAGE_TYPE_TILED = 2;

Object.defineProperties(UIImage.prototype, {
    /**
     * 获取or设置当前的图片
     * @property {qc.Texture} texture
     */
    texture : {
        get : function() {
            if (!this._atlas) return null;
            return new qc.Texture(this._atlas, this.frame);
        },
        set : function(value) {
            var self = this;
            if (!value) {
                self._atlas = null;
                self.phaser.loadTexture(null, self.frame);
                return;
            }

            if (value instanceof qc.Atlas) {
                value = value.getTexture(this.frame);
            }
            else if (typeof value === 'string') {
                // 兼容旧版本的数据
                if (self._atlas) {
                    value = self._atlas.getTexture(value);
                    if (!value) {
                        return;
                    }
                }
                else 
                    return;
            }
            if (self._atlas === value.atlas && self.frame === value.frame) return;
            self._atlas = value.atlas;

            // 如果frame不存在，则使用第一帧
            if (!value.atlas.getFrame(value.frame)) value.frame = 0;

            // 载入图片(通过设置frame来起效)
            self.phaser.key = value.atlas.key;
            self.frame = value.frame;
        }
    },

    /**
     * 获取or设置当前的图片帧，一般是图集才会用到该属性（可以为数字或别名）
     * @property {int|string} frame
     */
    frame : {
        get: function () {
            return this.phaser.frameName;
        },

        set: function (value) {
            if (!this.texture) return;
            var frameNames = this.texture.atlas.frameNames || [0];
            if (typeof(value) === 'string' && frameNames.indexOf(value) === -1)
                return;
            this.phaser.loadTexture(this.texture.atlas.key, value);
            this.setWidth(this.width);
            this.setHeight(this.height);

            // 设置9宫格边距
            this._resetNinePadding();
            this._dispatchLayoutArgumentChanged('size');
            this.phaser.displayChanged(qc.DisplayChangeStatus.TEXTURE);
            if (this._onTextureChanged) {
                this._onTextureChanged.dispatch();
            }
        }
    },

    /**
     * @property {qc.Rectangle} nativeSize - 图片实际大小
     * @readonly
     */
    nativeSize : {
        get : function() {
            return (this.phaser && this.phaser.texture && this.phaser.texture.crop) || new qc.Rectangle(0, 0, 0, 0);
        }
    },

    /**
     * 设置or获取图片显示的方式
     * @property {enum} imageType
     * @internal
     */
    imageType : {
        get: function() {
            return this._imageType;
        },
        set: function(value) {
            if (this._imageType === value) {
                return;
            }
            this._imageType = value;
            this.phaser.displayChanged(qc.DisplayChangeStatus.TEXTURE);
        }
    },

    /**
     *  获取or设置图片的九宫格的上
     *  @property {int} borderTop
     *  @internal
     */
    borderTop : {
        get: function () {
            return this._borderTop;
        },

        set: function (value) {
            this._borderTop = value;
        }
    },
    /**
     *  获取or设置图片的九宫格的下
     *  @property {int} borderBottom
     *  @internal
     */
    borderBottom : {
        get: function () {
            return this._borderBottom;
        },

        set: function (value) {
            this._borderBottom = value;
        }
    },

    /**
     *  获取or设置图片的九宫格的左
     *  @property {int} borderLeft
     *  @internal
     */
    borderLeft : {
        get: function () {
            return this._borderLeft;
        },

        set: function (value) {
            this._borderLeft = value;
        }
    },

    /**
     *  获取or设置图片的九宫格的右
     *  @property {int} borderRight
     *  @internal
     */
    borderRight : {
        get: function () {
            return this._borderRight;
        },

        set: function (value) {
            this._borderRight = value;
        }
    },

    /**
     * @property {Phaser.Signal} onTextureChanged - 当显示的贴图发生变化时触发
     */
    onTextureChanged : {
        get : function() {
            if (!this._onTextureChanged) {
                this._onTextureChanged = new Phaser.Signal();
            }
            return this._onTextureChanged;
        }
    },

    /**
     * @property {number} skewX - x轴拉伸角度，为兼容 DragonBones添加
     * @override
     */
    skewX : {
        get: function () {
            return this._skewX;
        },
        set: function (v) {
            var self = this;
            if (self._skewX === v) {
                return;
            }
            self._skewX = v;
            self.phaser.displayChanged(qc.DisplayChangeStatus.ROTATION);

            // 需要更新变换矩阵
            self._isTransformDirty = true;

            // updateTransform需要被替换掉
            if (self._skewX || self._skewY) {
                this.phaser.updateTransform = imageUpdateTransform;
            }
            else {
                self.phaser.updateTransform = self._oldUpdateTransformFunc;
            }
        }
    },

    /**
     * @property {number} skewY - y轴拉伸角度，为兼容 DragonBones添加
     * @override
     */
    skewY : {
        get: function () {
            return this._skewY;
        },
        set: function (v) {
            var self = this;
            if (self._skewY === v) {
                return;
            }
            self._skewY = v;
            self.phaser.displayChanged(qc.DisplayChangeStatus.ROTATION);

            // 需要更新变换矩阵
            self._isTransformDirty = true;

            // updateTransform需要被替换掉
            if (self._skewX || self._skewY) {
                this.phaser.updateTransform = imageUpdateTransform;
            }
            else {
                self.phaser.updateTransform = self._oldUpdateTransformFunc;
            }
        }
    },

    /**
     * @property {string} class - 类的名字
     * @internal
     */
    class : {
        get : function() { return 'qc.UIImage'; }
    }
});

/**
 * 设置图片大小为实际大小
 */
UIImage.prototype.resetNativeSize = function() {
    if (this.parent) {
        this.width = this.nativeSize.width;
        this.height = this.nativeSize.height;
    }
    else {
        this.setWidth(this.nativeSize.width);
        this.setHeight(this.nativeSize.width);
    }
};

/**
 * 设置节点的宽度
 * @protected
 * @override
 */
UIImage.prototype.setWidth = function(w) {
    Node.prototype.setWidth.call(this, w);
    if (!this.phaser.texture.trim) {
        this.phaser.texture.frame.width = w;
        this.phaser.displayChanged(qc.DisplayChangeStatus.SIZE);
    }
};

/**
 * 设置节点的高度
 * @protected
 * @override
 */
UIImage.prototype.setHeight = function(h) {
    Node.prototype.setHeight.call(this, h);
    if (!this.phaser.texture.trim) {
        this.phaser.texture.frame.height = h;
        this.phaser.displayChanged(qc.DisplayChangeStatus.SIZE);
    }
};

/**
 * 设置9宫格图片的边距
 * @private
 */
UIImage.prototype._resetNinePadding = function() {
    if (!this.texture) return;
    var padding = this.texture.padding;
    this._borderLeft = padding[0];
    this._borderTop = padding[1];
    this._borderRight = padding[2];
    this._borderBottom = padding[3];
};

/**
 * 获取需要被序列化的信息描述
 * @overide
 * @internal
 */
UIImage.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加UIImage需要序列化的内容
    json.texture = s.TEXTURE;
    json.frame = s.AUTO;
    json.imageType = s.NUMBER;
    json.skewX = s.NUMBER;
    json.skewY = s.NUMBER;
    return json;
};

/**
 * hack image 的 _renderWebGL 方法为了绘制九宫格
 * @hackpp
 */
var imageRenderWebGL = function(renderSession)
{
    var _qc = this._qc;
    if (_qc.imageType === qc.UIImage.IMAGE_TYPE_SIMPLE) {
        // 类别是普通拉伸，或者Slice拉升却没有任何九宫格信息，使用基类的方法
        return Phaser.Sprite.prototype._renderWebGL.call(this, renderSession);
    }

    // if the sprite is not visible or the alpha is 0 then no need to render this element
    if (!this.visible || this.alpha <= 0 || !this.renderable) return;

    var i, j;
    if (this.softClip) {
        SoftClipManager.getManager(renderSession).pushPolygon(this.softClip);
    }
    // do a quick check to see if this element has a mask or a filter.
    if (this._graphicsFilter || this._mask || this._filters)
    {
        var spriteBatch =  renderSession.spriteBatch;

        if (this._graphicsFilter) {
            spriteBatch.flush();
            renderSession.filterManager.pushFilter(this._graphicsFilter);
        }

        // push filter first as we need to ensure the stencil buffer is correct for any masking
        if (this._filters && !this.filterSelf)
        {
            spriteBatch.flush();
            renderSession.filterManager.pushFilter(this._filterBlock);
        }

        if (this._mask)
        {
            spriteBatch.stop();
            renderSession.maskManager.pushMask(this.mask, renderSession);
            spriteBatch.start();
        }

        if (this._filters && this.filterSelf) {
            spriteBatch.flush();
            renderSession.filterManager.pushFilter(this._filterBlock);
        }

        // add this sprite to the batch
        // @hackpp  hack this line
        imageFillVBO(spriteBatch, this);

        if (this._filters && this.filterSelf) {
            spriteBatch.stop();
            renderSession.filterManager.popFilter();
            spriteBatch.start();
        }

        // now loop through the children and make sure they get rendered
        for (i = 0; i < this.children.length; i++)
        {
            this.children[i]._renderWebGL(renderSession);
        }

        // time to stop the sprite batch as either a mask element or a filter draw will happen next
        spriteBatch.stop();

        if (this._mask) renderSession.maskManager.popMask(this._mask, renderSession);
        if (this._filters && !this.filterSelf) renderSession.filterManager.popFilter();
        if (this._graphicsFilter) renderSession.filterManager.popFilter();
        spriteBatch.start();
    }
    else
    {
        // @hackpp  hack this line
        imageFillVBO(renderSession.spriteBatch, this);

        // simple render children!
        for (i = 0; i < this.children.length; i++)
        {
            this.children[i]._renderWebGL(renderSession);
        }
    }
    if (this.softClip) {
        SoftClipManager.getManager(renderSession).popPolygon();
    }
};

// 根据九宫格信息，生成拉伸的图元
var generateSlicedSprite = function(spriteBatch, sprite) {
    var texture = sprite.texture;
    var uvs = texture._uvs;
    if (! uvs) return;

    var _qc = sprite._qc;
    var bL = _qc.borderLeft;
    var bR = _qc.borderRight;
    var bT = _qc.borderTop;
    var bB = _qc.borderBottom;

    var aX = sprite.anchor.x;
    var aY = sprite.anchor.y;

    var w0, w1, h0, h1;

    if (texture.trim)
    {
        // if the sprite is trimmed then we need to add the extra space before transforming the sprite coords..
        var trim = texture.trim;

        w1 = trim.x - aX * trim.width;
        w0 = w1 + texture.crop.width;

        h1 = trim.y - aY * trim.height;
        h0 = h1 + texture.crop.height;

    }
    else
    {
        w0 = (texture.frame.width ) * (1-aX);
        w1 = (texture.frame.width ) * -aX;

        h0 = texture.frame.height * (1-aY);
        h1 = texture.frame.height * -aY;
    }

    var tw = texture.baseTexture.width;
    var th = texture.baseTexture.height;
    var uvScractch = [
        new Phaser.Point(uvs.x0, uvs.y0),
        new Phaser.Point(uvs.x0 + bL / tw, uvs.y0 + bT / th),
        new Phaser.Point(uvs.x2 - bR / tw, uvs.y2 - bB / th),
        new Phaser.Point(uvs.x2, uvs.y2)
    ];

    // 调整 boarder
    var width = Math.abs(w0 - w1);
    var height = Math.abs(h0 - h1);
    if (width < bL + bR) {
        bL = width * bL / (bL + bR);
        bR = width - bL;
    }
    if (w1 > w0) { bL = -bL; bR = -bR; }
    if (height < bT + bB) {
        bT = height * bT / (bT + bB);
        bB = height - bT;
    }
    if (h1 > h0) { bT = -bT; bB = -bB; }

    var vertScratch = [
        new Phaser.Point(w1, h1),
        new Phaser.Point(w1 + bL, h1 + bT),
        new Phaser.Point(w0 - bR, h0 - bB),
        new Phaser.Point(w0, h0)
    ];

    var tint = sprite.tint;
    tint = (tint >> 16) + (tint & 0xff00) + ((tint & 0xff) << 16) +
    (sprite.worldAlpha * 255 << 24);

    var resolution = texture.baseTexture.resolution;
    var worldTransform = sprite.worldTransform;

    var a = worldTransform.a / resolution;
    var b = worldTransform.b / resolution;
    var c = worldTransform.c / resolution;
    var d = worldTransform.d / resolution;
    var tx = worldTransform.tx;
    var ty = worldTransform.ty;

    for (var x = 0; x < 3; ++x) {
        var x2 = x + 1;

        for (var y = 0; y < 3; ++y) {
            var y2 = y + 1;

            webGLAddQuad(spriteBatch, sprite,
                vertScratch[x].x, vertScratch[y].y,
                vertScratch[x2].x, vertScratch[y2].y,
                uvScractch[x].x, uvScractch[y].y,
                uvScractch[x2].x, uvScractch[y2].y,
                a, b, c, d, tx, ty,
                tint);
        }
    }
};

// 增加定点
var webGLAddQuad = function(spriteBatch, sprite, w1, h1, w0, h0, uvx0, uvy0, uvx1, uvy1, a, b, c, d, tx, ty, tint) {
    var clipMgr = spriteBatch.renderSession.softClipManager;
    if (clipMgr && clipMgr.needClip) {
        // 需要进行软件裁切
        clipMgr.renderSprite(spriteBatch.renderSession, sprite,
            w1, h1, w0, h0,
            uvx0, uvy0, uvx1, uvy1,
            a, b, c, d, tx, ty,
            tint);
        return;
    }

    if(spriteBatch.currentBatchSize >= spriteBatch.size)
    {
        spriteBatch.flush();
        spriteBatch.currentBaseTexture = sprite.texture.baseTexture;
    }

    var colors = spriteBatch.colors;
    var positions = spriteBatch.positions;
    var index = spriteBatch.currentBatchSize * 4 * spriteBatch.vertSize;

    if(spriteBatch.renderSession.roundPixels)
    {
        // xy
        positions[index] = a * w1 + c * h1 + tx | 0;
        positions[index+1] = d * h1 + b * w1 + ty | 0;

        // xy
        positions[index+5] = a * w0 + c * h1 + tx | 0;
        positions[index+6] = d * h1 + b * w0 + ty | 0;

        // xy
        positions[index+10] = a * w0 + c * h0 + tx | 0;
        positions[index+11] = d * h0 + b * w0 + ty | 0;

        // xy
        positions[index+15] = a * w1 + c * h0 + tx | 0;
        positions[index+16] = d * h0 + b * w1 + ty | 0;
    }
    else
    {
        // xy
        positions[index] = a * w1 + c * h1 + tx;
        positions[index+1] = d * h1 + b * w1 + ty;

        // xy
        positions[index+5] = a * w0 + c * h1 + tx;
        positions[index+6] = d * h1 + b * w0 + ty;

        // xy
        positions[index+10] = a * w0 + c * h0 + tx;
        positions[index+11] = d * h0 + b * w0 + ty;

        // xy
        positions[index+15] = a * w1 + c * h0 + tx;
        positions[index+16] = d * h0 + b * w1 + ty;
    }

    // uv
    positions[index+2] = uvx0;
    positions[index+3] = uvy0;

    // uv
    positions[index+7] = uvx1;
    positions[index+8] = uvy0;

    // uv
    positions[index+12] = uvx1;
    positions[index+13] = uvy1;

    // uv
    positions[index+17] = uvx0;
    positions[index+18] = uvy1;

    // color and alpha
    colors[index+4] = colors[index+9] = colors[index+14] = colors[index+19] = tint;

    // increment the batchsize
    spriteBatch.sprites[spriteBatch.currentBatchSize++] = sprite;

};

var generateTiledSprite = function(spriteBatch, sprite) {
    var texture = sprite.texture;
    var uvs = texture._uvs;
    if (! uvs) return;

    var _qc = sprite._qc;
    var bL = _qc.borderLeft;
    var bR = _qc.borderRight;
    var bT = _qc.borderTop;
    var bB = _qc.borderBottom;

    var aX = sprite.anchor.x;
    var aY = sprite.anchor.y;

    var w0, w1, h0, h1;

    if (texture.trim)
    {
        // if the sprite is trimmed then we need to add the extra space before transforming the sprite coords..
        var trim = texture.trim;

        w1 = trim.x - aX * trim.width;
        w0 = w1 + texture.crop.width;

        h1 = trim.y - aY * trim.height;
        h0 = h1 + texture.crop.height;

    }
    else
    {
        w0 = (texture.frame.width ) * (1-aX);
        w1 = (texture.frame.width ) * -aX;

        h0 = texture.frame.height * (1-aY);
        h1 = texture.frame.height * -aY;
    }

    var tw = texture.baseTexture.width;
    var th = texture.baseTexture.height;
    var uvScractch = [
        new Phaser.Point(uvs.x0, uvs.y0),
        new Phaser.Point(uvs.x0 + bL / tw, uvs.y0 + bT / th),
        new Phaser.Point(uvs.x2 - bR / tw, uvs.y2 - bB / th),
        new Phaser.Point(uvs.x2, uvs.y2)
    ];

    var uvMinX = uvs.x0 + bL / tw;
    var uvMinY = uvs.y0 + bT / th;
    var uvMaxX = uvs.x2 - bR / tw;
    var uvMaxY = uvs.y2 - bB / th;

    // 调整 boarder
    var width = Math.abs(w0 - w1);
    var height = Math.abs(h0 - h1);
    if (width < bL + bR) {
        bL = width * bL / (bL + bR);
        bR = width - bL;
    }
    if (w1 > w0) { bL = -bL; bR = -bR; }
    if (height < bT + bB) {
        bT = height * bT / (bT + bB);
        bB = height - bT;
    }
    if (h1 > h0) { bT = -bT; bB = -bB; }

    // 计算步进
    var xMax = w0 - bR;
    var yMax = h0 - bB;
    var xMin = w1 + bL;
    var yMin = h1 + bT;

    var vertScratch = [
        new Phaser.Point(w1, h1),
        new Phaser.Point(xMin, yMin),
        new Phaser.Point(xMax, yMax),
        new Phaser.Point(w0, h0)
    ];

    var tint = sprite.tint;
    tint = (tint >> 16) + (tint & 0xff00) + ((tint & 0xff) << 16) +
    (sprite.worldAlpha * 255 << 24);

    var resolution = texture.baseTexture.resolution;
    var worldTransform = sprite.worldTransform;

    var a = worldTransform.a / resolution;
    var b = worldTransform.b / resolution;
    var c = worldTransform.c / resolution;
    var d = worldTransform.d / resolution;
    var tx = worldTransform.tx;
    var ty = worldTransform.ty;

    var tileWidth = (uvs.x2 - uvs.x0) * tw - bL - bR;
    var tileHeight = (uvs.y2 - uvs.y0) * th - bT - bB;
    if (width - bL - bR > tileWidth * 32)
        tileWidth = (width - bL - bR) / 32;

    if (height - bT - bB > tileHeight * 32)
        tileHeight = (height - bT - bB) / 32;

    // 中部填充
    var clippedX = uvMaxX;
    var clippedY = uvMaxY;

    if (tileWidth > 0 && tileHeight > 0) {
        for (var y1 = yMin; y1 < yMax; y1 += tileHeight) {
            var y2 = y1 + tileHeight;
            if (y2 > yMax) {
                clippedY = uvMinY + (uvMaxY - uvMinY) * (yMax - y1) / (y2 - y1);
                y2 = yMax;
            }

            clippedX = uvMaxX;
            for (var x1 = xMin; x1 < xMax; x1 += tileWidth) {
                var x2 = x1 + tileWidth;
                if (x2 > xMax)  {
                    clippedX = uvMinX + (uvMaxX - uvMinX) * (xMax - x1) / (x2 - x1);
                    x2 = xMax;
                }

                webGLAddQuad(spriteBatch, sprite,
                    x1, y1,
                    x2, y2,
                    uvMinX, uvMinY,
                    clippedX, clippedY,
                    a, b, c, d, tx, ty,
                    tint);
            }
        }
    }

    // 左右填充
    clippedX = uvMaxX;
    clippedY = uvMaxY;
    if (tileHeight) {
        for (var y1 = yMin; y1 < yMax; y1 += tileHeight) {
            var y2 = y1 + tileHeight;
            if (y2 > yMax) {
                clippedY = uvMinY + (uvMaxY - uvMinY) * (yMax - y1) / (y2 - y1);
                y2 = yMax;
            }

            webGLAddQuad(spriteBatch, sprite,
                w1, y1,
                xMin, y2,
                uvs.x0, uvMinY,
                uvMinX, clippedY,
                a, b, c, d, tx, ty,
                tint);
            webGLAddQuad(spriteBatch, sprite,
                xMax, y1,
                w0, y2,
                uvMaxX, uvMinY,
                uvs.x2, clippedY,
                a, b, c, d, tx, ty,
                tint);
        }
    }

    // 上下填充
    clippedX = uvMaxX;
    clippedY = uvMaxY;
    if (tileWidth) {
        for (var x1 = xMin; x1 < xMax; x1 += tileWidth) {
            var x2 = x1 + tileWidth;
            if (x2 > xMax) {
                clippedX = uvMinX + (uvMaxX - uvMinX) * (xMax - x1) / (x2 - x1);
                x2 = xMax;
            }

            webGLAddQuad(spriteBatch, sprite,
                x1, h1,
                x2, yMin,
                uvMinX, uvs.y0,
                clippedX, uvMinY,
                a, b, c, d, tx, ty,
                tint);
            webGLAddQuad(spriteBatch, sprite,
                x1, yMax,
                x2, h0,
                uvMinX, uvMaxY,
                clippedX, uvs.y2,
                a, b, c, d, tx, ty,
                tint);
        }
    }

    // 四角填充
    webGLAddQuad(spriteBatch, sprite,
        vertScratch[0].x, vertScratch[0].y,
        vertScratch[1].x, vertScratch[1].y,
        uvScractch[0].x, uvScractch[0].y,
        uvScractch[1].x, uvScractch[1].y,
        a, b, c, d, tx, ty,
        tint);
    webGLAddQuad(spriteBatch, sprite,
        vertScratch[2].x, vertScratch[0].y,
        vertScratch[3].x, vertScratch[1].y,
        uvScractch[2].x, uvScractch[0].y,
        uvScractch[3].x, uvScractch[1].y,
        a, b, c, d, tx, ty,
        tint);
    webGLAddQuad(spriteBatch, sprite,
        vertScratch[2].x, vertScratch[2].y,
        vertScratch[3].x, vertScratch[3].y,
        uvScractch[2].x, uvScractch[2].y,
        uvScractch[3].x, uvScractch[3].y,
        a, b, c, d, tx, ty,
        tint);
    webGLAddQuad(spriteBatch, sprite,
        vertScratch[0].x, vertScratch[2].y,
        vertScratch[1].x, vertScratch[3].y,
        uvScractch[0].x, uvScractch[2].y,
        uvScractch[1].x, uvScractch[3].y,
        a, b, c, d, tx, ty,
        tint);
};

/**
 * hack image 的 _renderCanvas 方法为了绘制九宫格
 * @hackpp
 */
var imageRenderCanvas = function(renderSession) {
    // If the sprite is not visible or the alpha is 0 then no need to render this element
    if (this.visible === false || this.alpha === 0 || this.renderable === false || this.texture.crop.width <= 0 || this.texture.crop.height <= 0) return;

    var textureValid = this.texture.valid;
    var _qc = this._qc;
    var imageType = _qc.imageType;

    if (this.maskPixel && textureValid && imageType === qc.UIImage.IMAGE_TYPE_SIMPLE) {
        var bufferPool = renderSession.bufferPool || ( renderSession.bufferPool = []);
        var oldContext = renderSession.context;
        var oldOffX = (oldContext.globalOffX || 0);
        var oldOffY = (oldContext.globalOffY || 0);

        var filterArea = this.maskPixel.target.filterArea || this.maskPixel.target.getBounds();
        var minX = Math.max(oldOffX, filterArea.x);
        var minY = Math.max(oldOffY, filterArea.y);
        var maxX = Math.min(filterArea.x + filterArea.width, oldContext.canvas.width + oldOffX);
        var maxY = Math.min(filterArea.y + filterArea.height, oldContext.canvas.height + oldOffY);
        filterArea.x = minX;
        filterArea.y = minY;
        filterArea.width = maxX - minX;
        filterArea.height = maxY - minY;

        var canvasBuffer =  bufferPool.pop();
        if (!canvasBuffer) {
            canvasBuffer = new PIXI.CanvasBuffer(renderSession.context.canvas.width * renderSession.resolution, renderSession.context.canvas.height * renderSession.resolution);
            canvasBuffer.context._setTransform = canvasBuffer.context.setTransform;
            canvasBuffer.context.setTransform = function(a, b, c, d, tx, ty) {
                this._setTransform(a, b, c, d, tx - (this.globalOffX || 0), ty - (this.globalOffY || 0));
            };
        }
        canvasBuffer.resize(filterArea.width * renderSession.resolution, filterArea.height * renderSession.resolution);
        canvasBuffer.context.clearRect(0, 0, filterArea.width * renderSession.resolution, filterArea.height * renderSession.resolution);
        canvasBuffer.context.globalOffX = filterArea.x * renderSession.resolution + oldOffX;
        canvasBuffer.context.globalOffY = filterArea.y * renderSession.resolution + oldOffY;
        renderSession.context = canvasBuffer.context;
    }

    var context = renderSession.context;

    if (this.blendMode !== renderSession.currentBlendMode)
    {
        renderSession.currentBlendMode = this.blendMode;
        context.globalCompositeOperation = PIXI.blendModesCanvas[renderSession.currentBlendMode];
    }

    if (this._mask)
    {
        renderSession.maskManager.pushMask(this._mask, renderSession);
    }

    //  Ignore null sources
    if (textureValid)
    {
        var resolution = this.texture.baseTexture.resolution / renderSession.resolution;

        context.globalAlpha = this.worldAlpha;

        //  If smoothingEnabled is supported and we need to change the smoothing property for this texture
        ////---- Hackpp here resize 时 context 中的平滑属性会被变更，需要重新设置
        if (renderSession.smoothProperty &&
            (renderSession.scaleMode !== this.texture.baseTexture.scaleMode ||
            context[renderSession.smoothProperty] !== (renderSession.scaleMode === PIXI.scaleModes.LINEAR)))
        {
            renderSession.scaleMode = this.texture.baseTexture.scaleMode;
            context[renderSession.smoothProperty] = (renderSession.scaleMode === PIXI.scaleModes.LINEAR);
        }

        //  If the texture is trimmed we offset by the trim x/y, otherwise we use the frame dimensions
        var dx = (this.texture.trim) ? this.texture.trim.x - this.anchor.x * this.texture.trim.width : this.anchor.x * -this.texture.frame.width;
        var dy = (this.texture.trim) ? this.texture.trim.y - this.anchor.y * this.texture.trim.height : this.anchor.y * -this.texture.frame.height;
        var width = (this.texture.trim) ? this.texture.crop.width : this.texture.frame.width;
        var height = (this.texture.trim) ? this.texture.crop.height : this.texture.frame.height;

        //  Allow for pixel rounding
        if (renderSession.roundPixels)
        {
            context.setTransform(
                this.worldTransform.a,
                this.worldTransform.b,
                this.worldTransform.c,
                this.worldTransform.d,
                (this.worldTransform.tx * renderSession.resolution) | 0,
                (this.worldTransform.ty * renderSession.resolution) | 0);
            dx = dx | 0;
            dy = dy | 0;
        }
        else
        {
            context.setTransform(
                this.worldTransform.a,
                this.worldTransform.b,
                this.worldTransform.c,
                this.worldTransform.d,
                this.worldTransform.tx * renderSession.resolution,
                this.worldTransform.ty * renderSession.resolution);
        }

        var canvasDrawImage = function(context, image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
            if (!dWidth || !dHeight) return;
            renderSession.drawCount++;
            context.drawImage(image, sx, sy, sWidth || 1, sHeight || 1, dx, dy, dWidth, dHeight);
        };

        var texture;
        var uvx, uvy, uvw, uvh;

        if (this.tint !== 0xFFFFFF)
        {
            if (this.cachedTint !== this.tint)
            {
                this.cachedTint = this.tint;
                this.tintedTexture = PIXI.CanvasTinter.getTintedTexture(this, this.tint);
            }

            texture = this.tintedTexture;
            uvx = 0;
            uvy = 0;
            uvw = this.texture.crop.width;
            uvh = this.texture.crop.height;
        }
        else
        {
            texture = this.texture.baseTexture.source;
            uvx = this.texture.crop.x;
            uvy = this.texture.crop.y;
            uvw = this.texture.crop.width;
            uvh = this.texture.crop.height;
        }

        dx = Math.round(dx / resolution);
        dy = Math.round(dy / resolution);
        width = Math.round(width / resolution);
        height = Math.round(height / resolution);

        if (imageType === qc.UIImage.IMAGE_TYPE_SIMPLE) {

            // 普通类型，或者是 slice 但是没有任何九宫格信息
            if (!this.maskPixel) {
                canvasDrawImage(context, texture,
                    uvx, uvy, uvw, uvh,
                    dx, dy, width, height);
            }
        }
        else if (_qc.texture && width && height) {
            // 用于查找 canvas 的关键字
            var canvasKey = _qc.texture.uuid + imageType + _qc.frame + this.tint + width + height;
            var canvasFetchRet = qc.CanvasPool.get(canvasKey);
            var cacheCanvas = canvasFetchRet.canvas;
            if (canvasFetchRet.dirty) {
                var cacheContext = cacheCanvas.getContext('2d');

                // 初始化 canvas
                if (renderSession.smoothProperty &&
                    cacheContext[renderSession.smoothProperty] !== (renderSession.scaleMode === PIXI.scaleModes.LINEAR))
                    cacheContext[renderSession.smoothProperty] = (renderSession.scaleMode === PIXI.scaleModes.LINEAR);
                cacheCanvas.width = width;
                cacheCanvas.height = height;
                cacheContext.clearRect(0, 0, width, height);

                var bL = _qc.borderLeft;
                var bR = _qc.borderRight;
                var bT = _qc.borderTop;
                var bB = _qc.borderBottom;

                var uvScractch = [
                    new Phaser.Point(uvx, uvy),
                    new Phaser.Point(uvx + bL, uvy + bT),
                    new Phaser.Point(uvx + uvw - bR, uvy + uvh - bB),
                    new Phaser.Point(uvx + uvw, uvy + uvh)
                ];
                bL /= resolution;
                bT /= resolution;
                bR /= resolution;
                bB /= resolution;

                if (width < bL + bR) {
                    bL = width * bL / (bL + bR);
                    bR = width - bL;
                }
                if (height < bT + bB) {
                    bT = height * bT / (bT + bB);
                    bB = height - bT;
                }

                var vertScratch = [
                    new Phaser.Point(0, 0),
                    new Phaser.Point(bL, bT),
                    new Phaser.Point(width - bR, height - bB),
                    new Phaser.Point(width, height)
                ];

                if (imageType == qc.UIImage.IMAGE_TYPE_SLICED) {
                    for (var x = 0; x < 3; ++x) {
                        var x2 = x + 1;

                        for (var y = 0; y < 3; ++y) {
                            var y2 = y + 1;

                            var uvx0 = uvScractch[x].x;
                            var uvy0 = uvScractch[y].y;
                            var uvx1 = uvScractch[x2].x;
                            var uvy1 = uvScractch[y2].y;
                            var dx0 = vertScratch[x].x;
                            var dy0 = vertScratch[y].y;
                            var dx1 = vertScratch[x2].x;
                            var dy1 = vertScratch[y2].y;

                            if (uvx1 - uvx0 <= 0 ||
                                uvy1 - uvy0 <= 0 ||
                                dx1 - dx0 <= 0 ||
                                dy1 - dy0 <= 0) {
                                continue;
                            }

                            canvasDrawImage(cacheContext, texture,
                                uvx0, uvy0, uvx1 - uvx0, uvy1 - uvy0,
                                dx0, dy0, dx1 - dx0, dy1 - dy0);
                        }
                    }
                }
                else {
                    var uvMinX = uvScractch[1].x;
                    var uvMinY = uvScractch[1].y;
                    var uvMaxX = uvScractch[2].x;
                    var uvMaxY = uvScractch[2].y;

                    // 计算步进
                    var xMax = width - bR;
                    var yMax = height - bB;
                    var xMin = bL;
                    var yMin = bT;

                    var tileWidth = uvw / resolution - bL - bR;
                    var tileHeight = uvh / resolution - bT - bB;
                    if (width - bL - bR > tileWidth * 32)
                        tileWidth = (width - bL - bR) / 32;

                    if (height - bT - bB > tileHeight * 32)
                        tileHeight = (height - bT - bB) / 32;

                    var clippedX = uvMaxX;
                    var clippedY = uvMaxY;

                    if (tileWidth > 0 && tileHeight > 0) {
                        for (var y1 = yMin; y1 < yMax; y1 += tileHeight) {
                            var y2 = y1 + tileHeight;
                            if (y2 > yMax) {
                                clippedY = uvMinY + (uvMaxY - uvMinY) * (yMax - y1) / (y2 - y1);
                                y2 = yMax;
                            }

                            clippedX = uvMaxX;
                            for (var x1 = xMin; x1 < xMax; x1 += tileWidth) {
                                var x2 = x1 + tileWidth;
                                if (x2 > xMax) {
                                    clippedX = uvMinX + (uvMaxX - uvMinX) * (xMax - x1) / (x2 - x1);
                                    x2 = xMax;
                                }

                                if (clippedX - uvMinX <= 0 ||
                                    clippedY - uvMinY <= 0 ||
                                    x2 - x1 <= 0 ||
                                    y2 - y1 <= 0) {
                                    continue;
                                }

                                canvasDrawImage(cacheContext, texture,
                                    uvMinX, uvMinY, clippedX - uvMinX, clippedY - uvMinY,
                                    x1, y1,
                                    x2 - x1, y2 - y1);
                            }
                        }
                    }

                    // 左右填充
                    clippedY = uvMaxY;
                    if (tileHeight) {
                        for (var y1 = yMin; y1 < yMax; y1 += tileHeight) {
                            var y2 = y1 + tileHeight;
                            if (y2 > yMax) {
                                clippedY = uvMinY + (uvMaxY - uvMinY) * (yMax - y1) / (y2 - y1);
                                y2 = yMax;
                            }

                            canvasDrawImage(cacheContext, texture,
                                uvx, uvMinY, uvMinX - uvx, clippedY - uvMinY,
                                0, y1,
                                bL, y2 - y1);
                            canvasDrawImage(cacheContext, texture,
                                uvMaxX, uvMinY, uvx + uvw - uvMaxX, clippedY - uvMinY,
                                xMax, y1,
                                bR, y2 - y1);
                        }
                    }

                    // 上下填充
                    clippedX = uvMaxX;
                    if (tileWidth) {
                        for (var x1 = xMin; x1 < xMax; x1 += tileWidth) {
                            var x2 = x1 + tileWidth;
                            if (x2 > xMax) {
                                clippedX = uvMinX + (uvMaxX - uvMinX) * (xMax - x1) / (x2 - x1);
                                x2 = xMax;
                            }

                            canvasDrawImage(cacheContext, texture,
                                uvMinX, uvy, clippedX - uvMinX, uvMinY - uvy,
                                x1, 0,
                                x2 - x1, bT);
                            canvasDrawImage(cacheContext, texture,
                                uvMinX, uvMaxY, clippedX - uvMinX, uvy + uvh - uvMaxY,
                                x1, yMax,
                                x2 - x1, bB);
                        }
                    }

                    // 四个脚
                    canvasDrawImage(cacheContext, texture,
                        uvScractch[0].x, uvScractch[0].y,
                        uvScractch[1].x - uvScractch[0].x, uvScractch[1].y - uvScractch[0].y,
                        vertScratch[0].x, vertScratch[0].y,
                        vertScratch[1].x - vertScratch[0].x, vertScratch[1].y - vertScratch[0].y);
                    canvasDrawImage(cacheContext, texture,
                        uvScractch[2].x, uvScractch[0].y,
                        uvScractch[3].x - uvScractch[2].x, uvScractch[1].y - uvScractch[0].y,
                        vertScratch[2].x, vertScratch[0].y,
                        vertScratch[3].x - vertScratch[2].x, vertScratch[1].y - vertScratch[0].y);
                    canvasDrawImage(cacheContext, texture,
                        uvScractch[2].x, uvScractch[2].y,
                        uvScractch[3].x - uvScractch[2].x, uvScractch[3].y - uvScractch[2].y,
                        vertScratch[2].x, vertScratch[2].y,
                        vertScratch[3].x - vertScratch[2].x, vertScratch[3].y - vertScratch[2].y);
                    canvasDrawImage(cacheContext, texture,
                        uvScractch[0].x, uvScractch[2].y,
                        uvScractch[1].x - uvScractch[0].x, uvScractch[3].y - uvScractch[2].y,
                        vertScratch[0].x, vertScratch[2].y,
                        vertScratch[1].x - vertScratch[0].x, vertScratch[3].y - vertScratch[2].y);
                }
            }

            // 将缓存的 canvas 绘制到屏幕中
            canvasDrawImage(context, cacheCanvas,
                0, 0, width, height,
                dx, dy, width, height);
        }
    }

    // OVERWRITE
    for (var i = 0; i < this.children.length; i++)
    {
        this.children[i]._renderCanvas(renderSession);
    }

    if (this._mask)
    {
        renderSession.maskManager.popMask(renderSession);
    }

    if (this.maskPixel && textureValid && imageType === qc.UIImage.IMAGE_TYPE_SIMPLE) {
        context.globalCompositeOperation = 'destination-in';
        //  Allow for pixel rounding
        if (renderSession.roundPixels)
        {
            context.setTransform(
                this.worldTransform.a,
                this.worldTransform.b,
                this.worldTransform.c,
                this.worldTransform.d,
                (this.worldTransform.tx * renderSession.resolution) | 0,
                (this.worldTransform.ty * renderSession.resolution) | 0);
            dx = dx | 0;
            dy = dy | 0;
        }
        else
        {
            context.setTransform(
                this.worldTransform.a,
                this.worldTransform.b,
                this.worldTransform.c,
                this.worldTransform.d,
                this.worldTransform.tx * renderSession.resolution,
                this.worldTransform.ty * renderSession.resolution);
        }
        canvasDrawImage(context, texture,
            uvx, uvy, uvw, uvh,
            dx, dy, width, height);

        context.globalCompositeOperation = 'source-over';

        renderSession.context = oldContext;
        if (renderSession.roundPixels)
        {
            renderSession.context.setTransform(
                1, 0, 0, 1,
                filterArea.x * renderSession.resolution | 0,
                filterArea.y * renderSession.resolution | 0);
        }
        else
        {
            renderSession.context.setTransform(
                1, 0, 0, 1,
                filterArea.x * renderSession.resolution,
                filterArea.y * renderSession.resolution);
        }
        if (!canvasBuffer.canvas.height || !canvasBuffer.canvas.width) {
            return;
        }
        renderSession.drawCount++;
        renderSession.context.drawImage(canvasBuffer.canvas,
            0, 0, canvasBuffer.canvas.width, canvasBuffer.canvas.height,
            0, 0, canvasBuffer.canvas.width, canvasBuffer.canvas.height);
        bufferPool.push(canvasBuffer);
    }
};

// 填充 UIIamge 的 VBO，使用九宫格信息
var imageFillVBO = function(spriteBatch, sprite) {
    switch (sprite._qc.imageType)
    {
    case UIImage.IMAGE_TYPE_SLICED :
        generateSlicedSprite(spriteBatch, sprite);
        break;

    case UIImage.IMAGE_TYPE_TILED :
        generateTiledSprite(spriteBatch, sprite);
        break;
    }
};

// hack uiimage 的 updateTransform，用于支持 skewX, skewY
// 注意，skewX、skewY 是给 dragon bones 用的，且不是标准的 skew
// 对于 spine 骨骼来说只用到 rotation 而不用 skew 这东西
//@hackpp
var imageUpdateTransform = function()
{
    var self = this,
        parent = self.parent;
    if (!parent || !self.visible)
    {
        return;
    }

    // TODO: 考虑将此代码移除出去，没有必要每帧调度
    // 改变alpha的值
    self.worldAlpha = self.alpha * parent.worldAlpha;

    if (!self._isNotNeedCalcTransform || parent._isSubNeedCalcTransform) {
        self.game && self.game._calcTransformCount++;

        // 是否更新 sin cos 信息
        if (self.rotation !== self.rotationCache) {
            self.rotationCache = self.rotation;
            self._sr = Math.sin(self.rotation);
            self._cr = Math.cos(self.rotation);
        }

        // 世界矩阵
        var a, b, c, d, tx, ty;
        var skewa, skewb, skewc, skewd, skewtx, skewty;
        var rota, rotb, rotc, rotd, rottx, rotty;
        var pta, ptb, ptc, ptd;

        // skew 矩阵
        skewa  = Math.cos(self._qc._skewY || 0);
        skewb  = Math.sin(self._qc._skewY || 0);
        skewc  = -Math.sin(self._qc._skewX || 0);
        skewd  = Math.cos(self._qc._skewX || 0);
        skewtx = self.position.x;
        skewty = self.position.y;

        // rotate 矩阵
        rota  = self._cr * self.scale.x;
        rotb  = self._sr * self.scale.x;
        rotc  = -self._sr * self.scale.y;
        rotd  = self._cr * self.scale.y;
        rottx = 0;
        rotty = 0;

        // skew * rotate
        a  = rota * skewa + rotb * skewc;
        b  = rota * skewb + rotb * skewd;
        c  = rotc * skewa + rotd * skewc;
        d  = rotc * skewb + rotd * skewd;
        tx = rottx * skewa + rotty * skewc + skewtx;
        ty = rottx * skewb + rotty * skewd + skewty;

        // 世界 * (skew * rotate) * [x, y, 1]
        var wt = self.worldTransform;
        var pt = parent.worldTransform;
        pta = pt.a;
        ptb = pt.b;
        ptc = pt.c;
        ptd = pt.d;
        wt.a  = a * pta + b * ptc;
        wt.b  = a * ptb + b * ptd;
        wt.c  = c * pta + d * ptc;
        wt.d  = c * ptb + d * ptd;
        wt.tx = tx * pta + ty * ptc + pt.tx;
        wt.ty = tx * ptb + ty * ptd + pt.ty;

        //  Custom callback?
        if (self.transformCallback)
        {
            wt.inUpdate = false;
            self.transformCallback.call(self.transformCallbackContext, wt, pt);
        }
    }
    else {
        self._isSubNeedCalcTransform = false;
        var wt = self.worldTransform;
        var pt = parent.worldTransform;

        //  Custom callback?
        if (self.transformCallback)
        {
            wt.inUpdate = false;
            self.transformCallback.call(self.transformCallbackContext, wt, pt);
        }
    }

    // 调度孩子
    if (self._cacheAsBitmap) return;
    for (var i = 0, j = self.children.length; i < j; i++)
    {
        self.children[i].updateTransform();
    }
};
