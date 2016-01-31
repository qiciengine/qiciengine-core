/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 以节点rectTransform为裁切路径的遮罩
 * @class qc.NodeMask
 */
var NodeMask = defineBehaviour('qc.NodeMask', qc.Behaviour, function() {
    /**
     * @property {Phaser.Graphics} _mask - 裁切用的graphics
     * @type {Phaser.Graphics}
     * @private
     */
    this._mask = this.gameObject.game.phaser.add.graphics(0, 0);
    if (this._mask.parent) {
        this._mask.parent.removeChild(this._mask);
    }
    // this.gameObject.phaser.addChild(this._mask);

    if (this.gameObject.onTextureChanged) {
        this.addListener(this.gameObject.onTextureChanged, this._doTextureChange, this);
    }

    if (this.gameObject.onTransformChanged) {
        this.addListener(this.gameObject.onTransformChanged, this._doTransformChanged, this);
    }

    // 默认启用
    this.onEnable();
    this.runInEditor = true;
},{
    checkInField : qc.Serializer.BOOLEAN,
    minAnchor : qc.Serializer.GEOM,
    maxAnchor : qc.Serializer.GEOM,
    minRotation : qc.Serializer.NUMBER,
    maxRotation : qc.Serializer.NUMBER,
    clipType : qc.Serializer.NUMBER,
    mode : qc.Serializer.NUMBER
});

// 菜单上的显示
NodeMask.__menu = 'UI/NodeMask';

Object.defineProperties(NodeMask.prototype, {
    /**
     * @property {boolean} checkInField - 是否检测子节点是否在范围内
     */
    checkInField : {
        get : function() { return !!this._checkInField; },
        set : function(value) {
            if (this._checkInField === value) {
                return;
            }
            this._checkInField = value;
            if (!value) {
                this._resetRenderAble(this.gameObject);
            }
        }
    },

    /**
     * @property {qc.Point} minAnchor
     * @readonly
     * 定位矩形左上角的坐标（相对于gameObject长宽的比例值）
     *  (0, 0) - 左上角
     *  (1, 1) - 右下角
     * 注：大小不能超过maxAnchor
     */
    minAnchor : {
        get : function() {
            return this._minAnchor || new qc.Point(0, 0);
        },
        set : function(v) {
            this.setMask(v);
        }
    },

    /**
     * @property {qc.Point} maxAnchor
     * @readonly
     * 定位矩形右下角的坐标（相对于gameObject长宽的比例值）
     *  (0, 0) - 左上角
     *  (1, 1) - 右下角
     * 注：大小不能小于minAnchor
     */
    maxAnchor : {
        get : function() {
            return this._maxAnchor || new qc.Point(1, 1);
        },
        set : function(v) {
            this.setMask(null, v);
        }
    },

    /**
     * @property {Number} minRotation - 起始的显示角度，x轴正向为0，顺时针旋转
     */
    minRotation : {
        get : function() { return typeof this._minRotation !== 'undefined' || this._minRotation === null ?
            this._minRotation : 0; },
        set : function(value) {
            this.setMask(null, null, value);
        }
    },

    /**
     * @property {Number} maxRotation - 结束的显示角度, 值必须大于等于minRotation，x轴正向为0，顺时针旋转
     */
    maxRotation : {
        get : function() { return typeof this._maxRotation !== 'undefined' || this._maxRotation === null ?
            this._maxRotation : 2 * Math.PI; },
        set : function(value) {
            this.setMask(null, null, null, value);
        }
    },

    /**
     * @property {number} clipType - 裁切方式，只在 WebGl 模式下生效，当前值固定为通过模板测试裁切
     */
    clipType : {
        get : function() { return NodeMask.CLIP_STENCIL; },
        set : function(v) {

        }
    },

    /**
     * @property {number} mode - 裁切模式
     */
    mode : {
        get : function() { return this._mode || NodeMask.MODE_DEFAULT; },
        set : function(v) {
            if (this._mode === v) {
                return;
            }
            this._mode = v;
            this._refresh();
        }
    },

    /**
     * @property {Phaser.Graphics} customGraphics - 自定义的裁切图形
     */
    customGraphics : {
        get : function() {
            if (!this._customGraphics) {
                this._customGraphics = this.game.phaser.add.graphics(0, 0);
                if (this._customGraphics.parent) {
                    this._customGraphics.parent.removeChild(this._customGraphics);
                }
            }
            return this._customGraphics;
        }
    },

    /**
     * @property {qc.Filter.FilterTexture} _maskFilter - 自定义的裁切Filter
     * @private
     */
    _maskFilter : {
        get : function() {
            if (!this.__maskFilter) {
                this.__maskFilter = new qc.Filter.AlphaMask(this.game);
                this.__maskFilter.otherTexture = new qc.Filter.FilterTexture(this.game);
                this.__maskFilter.otherTexture.texture = this.gameObject.texture;
                this.__maskFilter.otherTexture.frame = this.gameObject.frame;
            }
            return this.__maskFilter;
        }
    },

    /**
     * @property {qc.Filter.GraphicsTexture} _graphicsFilter - 自定义的图形裁切Filter
     * @private
     */
    _graphicsFilter : {
        get : function() {
            if (!this.__graphicsFilter) {
                this.__graphicsFilter = new qc.Filter.AlphaMask(this.game);
                this.__graphicsFilter.otherTexture = new qc.Filter.GraphicsTexture(this.game);
            }
            return this.__graphicsFilter;
        }
    }
});

/**
 * 启用
 */
NodeMask.prototype.onEnable = function() {
    this._refresh();
};

/**
 * 停用
 */
NodeMask.prototype.onDisable = function() {
    this._refresh();
};

/**
 * 销毁时
 */
NodeMask.prototype.onDestroy = function() {
    this.gameObject.phaser.mask = null;
    this.gameObject.phaser.softClip = null;
    this.gameObject.phaser.maskPixel = null;
    this.gameObject.phaser._graphicsFilter = null;
    if (!this.gameObject._destroy) {
        this._resetRenderAble(this.gameObject);
    }
};

/**
 * 当贴图变化时
 */
NodeMask.prototype._doTextureChange = function() {
    if (this.__maskFilter) {
        this.__maskFilter.otherTexture.texture = this.gameObject.texture;
        this.__maskFilter.otherTexture.frame = this.gameObject.frame;
    }
};

/**
 * 当节点的transform变化时
 */
NodeMask.prototype._doTransformChanged = function() {
    this.postUpdate();
};

NodeMask.prototype._isNeedUseClipReplaceStencil = function() {
    return !this.game.device.phaser.supportStencil && 
        this.game.phaser.renderType === Phaser.WEBGL && 
        this.clipType === NodeMask.CLIP_STENCIL;
};

/**
 * 刷新绘制对象的 mask 信息
 * @private
 */
NodeMask.prototype._refresh = function() {
    if (this._isNeedUseClipReplaceStencil()) {
        this.gameObject.phaser.softClip = null;
        this.gameObject.phaser.mask = null;
        this.gameObject.phaser.maskPixel = null;
        this._graphicsFilter.otherTexture.updateTexture();
        this.gameObject.phaser._graphicsFilter = this.enable ? 
            { target: this.gameObject.phaser, filterPasses: this._graphicsFilter.passes} :
            null;
    }
    else if (this.game.phaser.renderType !== Phaser.WEBGL ||
        this.clipType === NodeMask.CLIP_STENCIL) {
        this.gameObject.phaser.mask = this.enable && this.mode !== NodeMask.MODE_PIXEL ?
            (this.mode === NodeMask.MODE_GRAPHICS ? this.customGraphics : this._mask) : null;
        this.gameObject.phaser.maskPixel = this.enable && this.mode === NodeMask.MODE_PIXEL ?
            { target: this.gameObject.phaser, filterPasses:this._maskFilter.passes } : null;
        this.gameObject.phaser.softClip = null;
        if (!this.gameObject._destroy) {
            this._resetRenderAble(this.gameObject);
        }
        this.gameObject.phaser._clipTexture = null;
        this.gameObject.phaser._graphicsFilter = null;
    }
    else {
        this.gameObject.phaser.softClip = this.enable && this.mode !== NodeMask.MODE_PIXEL ? this._softClip : null;
        this.gameObject.phaser.maskPixel = this.enable && this.mode === NodeMask.MODE_PIXEL ?
            { target: this.gameObject.phaser, filterPasses:this._maskFilter.passes } : null;
        this.gameObject.phaser.mask = null;
        this.gameObject.phaser._clipTexture = null;
        this.gameObject.phaser._graphicsFilter = null;
    }
};

/**
 * postUpdate
 */
NodeMask.prototype.postUpdate = function() {
    // 启用状态下更新mask
    if (this.enable && this.mode === NodeMask.MODE_DEFAULT) {
        this._updateMask();

        if (this._checkInField) {
            // 计算子节点是否越界
            var children = this.gameObject.children;
            var worldBox = this.gameObject.getWorldBox();
            for (var i = 0; i < children.length; i++)
            {
                this._checkRenderable(worldBox, children[i]);
            }
        }
    }
};

/**
 * 设置裁切的变化信息
 * @param minAnchor {qc.Point} - 定位裁切矩形左上角的坐标
 * @param maxAnchor {qc.Point} - 定位裁切矩形右下角的坐标
 * @param minRotation {Number} - 起始的角度
 * @param maxRotation {Number} - 结束的角度
 */
NodeMask.prototype.setMask = function(minAnchor, maxAnchor, minRotation, maxRotation) {
    var min = minAnchor || this.minAnchor;
    var max = maxAnchor || this.maxAnchor;
    minRotation = typeof minRotation === 'undefined' || minRotation === null ? this.minRotation : minRotation;
    maxRotation = typeof maxRotation === 'undefined' || maxRotation === null ? this.maxRotation : maxRotation;
    if (min.x < 0) min.x = 0;
    if (min.y < 0) min.y = 0;
    if (min.x > 1) min.x = 1;
    if (min.y > 1) min.y = 1;
    if (max.x < 0) max.x = 0;
    if (max.y < 0) max.y = 0;
    if (max.x > 1) max.x = 1;
    if (max.y > 1) max.y = 1;
    if (min.x > max.x || min.y > max.y)
        throw new Error('Expected:min < max');
    if (maxRotation < minRotation)
        throw new Error('Expected:minRotation < maxRotation');

    if (min.x === this.minAnchor.x && min.y === this.minAnchor.y &&
        max.x === this.maxAnchor.x && max.y === this.maxAnchor.y &&
        minRotation === this.minRotation && maxRotation === this.maxRotation) {
        return;
    }

    this._minAnchor = min;
    this._maxAnchor = max;
    this._minRotation = minRotation;
    this._maxRotation = maxRotation;
    this._maskForceChange = true;
    this.gameObject.phaser.displayChanged(qc.DisplayChangeStatus.SIZE);
};

/**
 * 重置遮罩
 * @private
 */
NodeMask.prototype._updateMask = function() {
    var mask = this._mask;
    var worldTransform = this.gameObject.worldTransform;

    var rect = this.gameObject.rect;
    // 判定裁切信息是否有变化
    var transInfo = [rect.x, rect.y, rect.width, rect.height,
        worldTransform.a, worldTransform.b, worldTransform.c, worldTransform.d,
        worldTransform.tx, worldTransform.ty];
    if (!this._maskForceChange &&
        this._lastMaskRect &&
        this._lastMaskRect[0] === transInfo[0] &&
        this._lastMaskRect[1] === transInfo[1] &&
        this._lastMaskRect[2] === transInfo[2] &&
        this._lastMaskRect[3] === transInfo[3] &&
        this._lastMaskRect[4] === transInfo[4] &&
        this._lastMaskRect[5] === transInfo[5] &&
        this._lastMaskRect[6] === transInfo[6] &&
        this._lastMaskRect[7] === transInfo[7] &&
        this._lastMaskRect[8] === transInfo[8] &&
        this._lastMaskRect[9] === transInfo[9])
    {
        return;
    }
    this._maskForceChange = false;
    this._lastMaskRect = transInfo;

    var minAnchor = this.minAnchor;
    var maxAnchor = this.maxAnchor;
    var minRotation = this.minRotation;
    var maxRotation = this.maxRotation;

    var minX = rect.x + minAnchor.x * rect.width;
    var minY = rect.y + minAnchor.y * rect.height;
    var maxX = rect.x + maxAnchor.x * rect.width;
    var maxY = rect.y + maxAnchor.y * rect.height;

    // 负值的缩放会改变顶点间的顺序，需要进行调整
    var scale = this.gameObject.getWorldScale();
    var needReverse = scale.x * scale.y < 0;

    var centerX = (minX + maxX) / 2;
    var centerY = (minY + maxY) / 2;
    var vertexes = null;
    if (maxRotation - minRotation >= Math.PI * 2) {
        // 围绕一圈了
        vertexes = [
            new qc.Point(minX, minY), 
            new qc.Point(maxX, minY),
             new qc.Point(maxX, maxY), 
             new qc.Point(minX, maxY)];
    }
    else {
        var PI2 = 2 * Math.PI;
        var corner = Math.atan2(maxY - minY, maxX - minX);
        while (minRotation < -corner || minRotation > PI2 - corner) {
            var add = minRotation < 0 ? PI2 : -PI2;
            minRotation += add;
            maxRotation += add;
        }

        var startX, startY, startCorner;
        if (minRotation >= -corner && minRotation < corner) {
            startX = maxX;
            startY = centerY + (maxX - centerX) * Math.tan(minRotation);
            startCorner = 0;
        }
        else if (minRotation < Math.PI - corner) {
            startY = maxY;
            startX = centerX + (maxY - centerY) / Math.tan(minRotation);
            startCorner = 1;
        }
        else if (minRotation < Math.PI + corner) {
            startX = minX;
            startY = centerY + (centerX - minX) * Math.tan(Math.PI - minRotation);
            startCorner = 2;
        }
        else {
            startY = minY;
            startX = centerX + (centerY - minY) / Math.tan(PI2 - minRotation);
            startCorner = 3;
        }

        var endX, endY, endCorner = 0;
        while (maxRotation > PI2 - corner) {
            maxRotation -= PI2;
            endCorner += 4;
        }

        if (maxRotation >= -corner && maxRotation < corner) {
            endX = maxX;
            endY = centerY + (maxX - centerX) * Math.tan(maxRotation);
            endCorner += 0;
        }
        else if (maxRotation < Math.PI - corner) {
            endY = maxY;
            endX = centerX + (maxY - centerY) / Math.tan(maxRotation);
            endCorner += 1;
        }
        else if (maxRotation < Math.PI + corner) {
            endX = minX;
            endY = centerY + (centerX - minX) * Math.tan(Math.PI - maxRotation);
            endCorner += 2;
        }
        else {
            endY = minY;
            endX = centerX + (centerY - minY) / Math.tan(PI2 - maxRotation);
            endCorner += 3;
        }

        var corners = [new qc.Point(maxX, maxY), new qc.Point(minX, maxY),
            new qc.Point(minX, minY), new qc.Point(maxX, minY)];
        vertexes = [new qc.Point(centerX, centerY), new qc.Point(startX, startY)];
        while (startCorner < endCorner) {
            vertexes.push(corners[startCorner % 4]);
            startCorner ++;
        }
        vertexes.push(new qc.Point(endX, endY));
    }

    if (!this._isNeedUseClipReplaceStencil()) {
        for (var i = 0; i < vertexes.length; i++) {
            vertexes[i] = worldTransform.apply(vertexes[i]);
        }

        needReverse && vertexes.reverse();
    }

    this._softClip = vertexes;
    if (this._isNeedUseClipReplaceStencil()) {
        var bounds = this.gameObject.phaser.getBounds();
        var texture = this._graphicsFilter.otherTexture;
        texture.resize(bounds.width, bounds.height);
        texture.offset.x = -bounds.x;
        texture.offset.y = -bounds.y;
        var g = texture.graphics;
        g.clear();
        g.beginFill(0xffffff);
        g.drawPolygon(vertexes);
        g.worldTransform = this.gameObject.worldTransform;
        // if (!this._clipTexture) {
        //     this._clipTexture = new qc.RenderTexture(bounds.width, bounds.height, this.game.phaser.render, null, this.game.resolution);
        // }
        // else {
        //     this._clipTexture.resize(bounds.width, bounds.height, true);
        // }
        // mask.worldTransform = this.gameObject.worldTransform;
        // this._clipTexture.directRenderWebGL(mask, {x: -bounds.x, y: -bounds.y}, true);
    }
    else {
        mask.clear();
        mask.beginFill(0xffffff);
        mask.drawPolygon(vertexes);
    }
    this._refresh();

};

/**
 * 检测子节点是否可以绘制
 * @param showBox {qc.Rectangle} - 显示区域
 * @param node {qc.Node} - 节点
 * @private
 */
NodeMask.prototype._checkRenderable = function(showBox, node) {
    var worldBox = node.getWorldBox();
    if (!qc.Rectangle.intersects(showBox, worldBox)) {
        node.renderable = false;
    }
    else {
        node.renderable = true;
    }

    var children = node.children;
    for (var i = 0; i < children.length; i++)
    {
        this._checkRenderable(showBox, children[i]);
    }
};

/**
 * 重置节点为可绘制的
 * @param node {qc.Node} - 节点
 * @private
 */
NodeMask.prototype._resetRenderAble = function(node) {
    if (!node)
        return;
    node.renderable = true;

    var children = node.children;
    for (var i = 0; i < children.length; i++)
    {
        this._resetRenderAble(children[i]);
    }
};

/**
 * 默认裁切源，以当前节点的显示矩形进行裁切
 * @constant
 * @type {number}
 */
NodeMask.MODE_DEFAULT = 0;

/**
 * 以当前节点的显示内容进行裁切
 * @constant
 * @type {number}
 */
NodeMask.MODE_PIXEL = 1;

/**
 * 以自定义的图形进行裁切
 * @constant
 * @type {number}
 */
NodeMask.MODE_GRAPHICS = 2;

/**
 * 使用模拟方式进行裁切
 * 注意：当前实现中软裁切，计算量比较大，性能消耗严重，并对部分自定义renderWebGL的节点支持有问题，暂时进行屏蔽
 * @constant
 * @type {number}
 */
//NodeMask.CLIP_SOFT = 0;
/**
 * 使用WebGl 模本测试进行裁切
 * @constant
 * @type {number}
 */
NodeMask.CLIP_STENCIL = 1;
