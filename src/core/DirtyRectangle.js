/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 脏矩形管理
 */
var DirtyRectangle = qc.DirtyRectangle = function(game) {
    var self = this;
    /**
     * 全局脏矩形
     * @type {Array}
     */
    self._destroyRegion = [];

    self.game = game;
    self.game.world.getSelfWidth = function() {
        return this.width;
    };
    self.game.world.getSelfHeight = function() {
        return this.height;
    };

    self.game.scale.onSizeChange.add(self.onSizeChange, self);
    self.enable = false;
    self.showDirtyRegion = false;

    self.forceDirty = false;
};

DirtyRectangle.prototype = {};
DirtyRectangle.prototype.constructor = DirtyRectangle;

Object.defineProperties(DirtyRectangle.prototype, {
    /**
     * 是否生效
     * @type {boolean}
     */
    enable : {
        get : function() { return this._enable; },
        set : function(v) {
            if (v === this._enable)
                return;

            this._enable = v;
            this._recalcAll = v;
            if (!v) {
                this.releaseDirtyCanvas();
            }
        }
    },

    /**
     * 是否显示脏矩形更新区域
     * @type {boolean}
     */
    showDirtyRegion : {
        get : function() { return this._showDirtyRegion; },
        set : function(v) {
            if (v === this._showDirtyRegion)
                return;

            this._showDirtyRegion = v;
            if (!v) {
                this.releaseDirtyCanvas();
            }
        }
    }
});

/**
 * 向全局注册一个脏矩形区域
 */
DirtyRectangle.prototype.redirectDirty = function(bounds) {
    var self = this;
    self._enable && bounds && self._destroyRegion.push(bounds);
};

/**
 * 画布大小变化时
 * @return {[type]} [description]
 */
DirtyRectangle.prototype.onSizeChange = function() {
    var self = this;
    self.game.world.displayChanged(qc.DisplayChangeStatus.SIZE);
};

/**
 * 求两矩形的并集
 */
DirtyRectangle.prototype._unionRect = function(one, two) {
    var oneEndX = one.x + one.width,
        oneEndY = one.y + one.height,
        twoEndX = two.x + two.width,
        twoEndY = two.y + two.height,
        minStartX = one.x < two.x ? one.x : two.x,
        minStartY = one.y < two.y ? one.y : two.y,
        maxEndX = oneEndX < twoEndX ? twoEndX : oneEndX,
        maxEndY = oneEndY < twoEndY ? twoEndY : oneEndY,
        width = maxEndX - minStartX,
        height = maxEndY - minStartY;
    return {
        x : minStartX,
        y : minStartY,
        width : width,
        height : height,
        area : width * height
    };
};

/**
 * 求两矩形的交集
 */
DirtyRectangle.prototype._insersectionRect = function(one, two) {
    var oneEndX = one.x + one.width,
        oneEndY = one.y + one.height,
        twoEndX = two.x + two.width,
        twoEndY = two.y + two.height,
        maxStartX = one.x > two.x ? one.x : two.x,
        maxStartY = one.y > two.y ? one.y : two.y,
        minEndX = oneEndX > twoEndX ? twoEndX : oneEndX,
        minEndY = oneEndY > twoEndY ? twoEndY : oneEndY,
        width = minEndX - maxStartX,
        height = minEndY - maxStartY;
    if (width < 0 || height < 0) {
        return null;
    }
    var rect = {
        x : maxStartX,
        y : maxStartY,
        width : width,
        height : height,
        area : width * height
    };
    return rect;
};

/**
 * 整合脏矩形区域
 */
DirtyRectangle.prototype._mergeRect = function(dirtyList, factor) {
    var self = this;
    var len = dirtyList.length;
    if (len < 2) {
        return true;
    }
    var idx = -1;
    var merge = false;
    var union = null;
    var otherIdx = 0;
    while (!merge && ++idx < len) {
        var dest = dirtyList[idx];
        dest.clip && (dest = dest.clip);
        otherIdx = idx;
        while (!merge && ++otherIdx < len) {
            var src = dirtyList[otherIdx];
            src.clip && (src = src.clip);
            union = self._unionRect(dest, src);
            merge = union.area * 0.8 - dest.area - src.area < 0;
        }
    }

    if (merge && union) {
        dirtyList[idx] = union;
        dirtyList.splice(otherIdx, 1);
        return false;
    }
    return true;
};


/**
 * 收集节点下所有需要更新的区域
 */
DirtyRectangle.prototype.collectDirtyRegion = function(cliprect, node, array) {
    var self = this;
    array = array || [];
    if (!node)
        return array;
    var currCliprect = cliprect;
    if (node instanceof Phaser.Text) {
        if (node.dirty) {
            node.updateText();
            node.getWorldTransform();
            node.dirty = false;
        }
    }

    var skipChildren = node.isSkipChildrenRender && node.isSkipChildrenRender();
    var display = (node.getDisplayProxy && node.getDisplayProxy()) || node;
    if (display !== node) {
        display.displayChanged(node._displayChangeStatus);
    }
    if (display._updateBounds) {
        skipChildren |= display._updateBounds(self._recalcAll);
    }
    if (display._mask) {
        var maskCliprect = display._currWorldBounds;
        if (maskCliprect) {
            currCliprect = currCliprect ? self._insersectionRect(currCliprect, maskCliprect) : maskCliprect;
        }
    }
    if (display._dirtyBounds) {
        var currWorldBounds = display._currWorldBounds;
        if (currWorldBounds && currCliprect) {
            var clip = self._insersectionRect(currWorldBounds, currCliprect);
            if (!clip) {
                currWorldBounds = null;
            }
            else {
                display._currWorldBounds.clip = clip;
            }
        }
        if (display._lastWorldBounds) {
            var lastLen = display._lastWorldBounds.length;
            while (lastLen--) {
                var one = display._lastWorldBounds[lastLen];
                if (one) {
                    array.push(one);
                }
            }
        }
        display._lastWorldBounds = [];
        currWorldBounds && array.push(currWorldBounds);
        display._dirtyBounds = false;
    }

    if (display._displayChangeStatus === 0) {
        skipChildren |= !node._subDisplayChanged;
    }
    node._subDisplayChanged = false;

    if (self._recalcAll || !skipChildren) {
        var len = node.children.length;
        while (len--) {
            self.collectDirtyRegion(currCliprect, node.children[len], array);
        }
    }
    node._resetDisplayChangeStatus && node._resetDisplayChangeStatus();
    if (display !== node) {
        display._resetDisplayChangeStatus && display._resetDisplayChangeStatus();
    }
    return array;
};

/**
 * 更新需要绘制的区域
 */
DirtyRectangle.prototype.updateDirtyRegion = function(context, resolution, stage) {
    var self = this;
    var duringStart = Date.now();
    if (stage._displayChangeStatus == null) {
        stage._displayChangeStatus = -1;
    }
    var dirtyRegion = self._currDirtyRegion = self.collectDirtyRegion(null, stage);
    if (self._destroyRegion) {
        Array.prototype.push.apply(dirtyRegion, self._destroyRegion);
        self._destroyRegion = [];
    }

    if (self._recalcAll || self.forceDirty) {
        self._recalcAll = false;
        self._currDirtyRegion = dirtyRegion = [
            { x: 0, y: 0, width: self.game.width, height: self.game.height }
        ];
        self.forceDirty = false;
    }
    else {
        // 合并脏矩形
        while (!self._mergeRect(dirtyRegion)) {}
    }

    var len = dirtyRegion.length;
    if (!len) {
        return false;
    }
    context.save();
    self._saveContext = true;
    context.beginPath();
    while (len--) {
        var region = dirtyRegion[len];
        if (!region || region.clip === 0)
            continue;
        if (region.clip)
            region = region.clip;

        context.rect(
            (region.x * resolution - 1) | 0,
            (region.y * resolution - 1) | 0,
            (region.width * resolution + 3) | 0,
            (region.height * resolution + 3) | 0);
    }
    context.clip();

    stage._displayChangeStatus = 0;
    return true;
};

/**
 * 重置画布状态
 */
DirtyRectangle.prototype.restore = function(context) {
    var self = this;
    if (self._saveContext) {
        context.restore();
        self._saveContext = false;
    }
};

/**
 * 检查绘制脏矩形区域的画布
 */
DirtyRectangle.prototype.checkShowDirtyCanvas = function() {
    var self = this;
    var gameCanvas = self.game.canvas;
    var canvas = self._dirtyCanvas;
    if (!gameCanvas)
        return false;
    if (!canvas) {
        canvas = self._dirtyCanvas = document.createElement('canvas');
        self._dirtyContext = self._dirtyCanvas.getContext('2d');
        gameCanvas.parentNode.insertBefore(self._dirtyCanvas, gameCanvas);
        canvas.style.left = canvas.style.top = '0px';
        canvas.style.position = 'absolute';
    }
    if (canvas.style.width !== gameCanvas.style.width ||
        canvas.style.height !== gameCanvas.style.height ||
        canvas.width !== gameCanvas.width ||
        canvas.height !== gameCanvas.height) {
        canvas.width = gameCanvas.width;
        canvas.height = gameCanvas.height;
        canvas.style.width = gameCanvas.style.width;
        canvas.style.height = gameCanvas.style.height;
    }
    return true;
};

/**
 * 释放绘制DirtyRegion的资源
 */
DirtyRectangle.prototype.releaseDirtyCanvas = function() {
    var self = this,
        canvas = self._dirtyCanvas;
    if (!canvas)
        return;
    this.dirtyContext = null;
    this._dirtyCanvas = null;
    if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
    }
};

/**
 * 显示脏矩形的更新区域
 */
DirtyRectangle.prototype.showDirtyRectangle = function(context, resolution) {
    if (!this._showDirtyRegion) {
        return;
    }
    var self = this;
    if (!self.checkShowDirtyCanvas())
        return;
    var canvas = self._dirtyCanvas;
    var dirtyContext = self._dirtyContext;
    dirtyContext.clearRect(0, 0, canvas.width, canvas.height);
    dirtyContext.beginPath();
    var dirtyRegion = this._currDirtyRegion;
    var len = dirtyRegion.length;
    var alpha = 0.9;
    if (len === 0 && this._lastShowAlpha > 0) {
        dirtyRegion = this._lastShowRegion;
        alpha = this._lastShowAlpha - 0.05;
        len = dirtyRegion.length;
    }
    else {
        this._lastShowRegion = dirtyRegion;
    }
    this._lastShowAlpha = alpha;
    while (len--) {
        var region = dirtyRegion[len];
        if (!region)
            continue;
        if(region.clip) {
            dirtyContext.rect(region.clip.x * resolution, region.clip.y * resolution, region.clip.width * resolution, region.clip.height * resolution);
        }
        else {
            dirtyContext.rect(region.x* resolution, region.y* resolution, region.width* resolution, region.height* resolution);
        }
    }
    dirtyContext.lineWidth = 3;
    dirtyContext.strokeStyle = 'rgba(255,255,0, ' + this._lastShowAlpha + ')';
    dirtyContext.stroke();
};
