/**
* @hack 替换pixi的DisplayObject，优化 updateTransform
*/

// 显示改变的各种状态
var DisplayChangeStatus = qc.DisplayChangeStatus = {
    OFFSET : 0x01,
    SCALE : 0x02,
    ROTATION : 0x04,
    SIZE : 0x08,
    TINT : 0x10,
    ALPHA : 0x20,
    SHOW : 0x40,
    HIDE : 0x80,
    TEXTURE : 0x100,
    ORDER : 0x200
};

DisplayChangeStatus.VISIBLE_MASK = DisplayChangeStatus.SHOW | DisplayChangeStatus.HIDE;
DisplayChangeStatus.INHERIT_MASK = DisplayChangeStatus.SIZE | DisplayChangeStatus.ORDER | DisplayChangeStatus.OFFSET | DisplayChangeStatus.SCALE | DisplayChangeStatus.ROTATION | DisplayChangeStatus.VISIBLE_MASK;
DisplayChangeStatus.RECALC_MASK = DisplayChangeStatus.ROTATION | DisplayChangeStatus.VISIBLE_MASK | DisplayChangeStatus.SIZE | DisplayChangeStatus.SCALE;
DisplayChangeStatus.REOFFSET_MASK = DisplayChangeStatus.OFFSET;

/**
 * 销毁时需要注册脏矩形区域
 */
var oldDestroy = PIXI.DisplayObject.prototype.destroy;
PIXI.DisplayObject.prototype.destroy = function() {
    this.maybeOutWorld();
    oldDestroy.call(this);
};

/**
 * 设置绘制代理，主要用于CacheAsBitmap等处理
 */
PIXI.DisplayObject.prototype.setDisplayProxy = function(proxy, skipChildren) {
    this._displayProxy = proxy;
    this._skipChildren = skipChildren;
};

/**
 * 得到绘制代理对象
 */
PIXI.DisplayObject.prototype.getDisplayProxy = function() {
    return this._displayProxy;
};

/**
 * 是否跳过子节点绘制
 */
PIXI.DisplayObject.prototype.isSkipChildrenRender = function() {
    return this._skipChildren;
};

/**
 * 可能被移出世界，并不在进入世界显示时
 */
PIXI.DisplayObject.prototype.maybeOutWorld = function() {
    if (this.game)
        this.game._qc && this.game._qc.dirtyRectangle.redirectDirty(this._currWorldBounds);
    else if (this.stage) {
        this.stage.game._qc && this.stage.game._qc.dirtyRectangle.redirectDirty(this._currWorldBounds);
    }
};

/**
 * 显示状态改变
 */
PIXI.DisplayObject.prototype.displayChanged = function(type) {
    if (type === 0 || type == null) {
        return;
    }
    var self = this;
    if (self._displayChangeStatus == null) {
        self._displayChangeStatus = DisplayChangeStatus.SHOW;
    }
    self._displayChangeStatus |= type;
    if (type & DisplayChangeStatus.HIDE) {
        // 隐藏时，刷新下所有子节点的位置等信息。
        this.displayObjectUpdateTransform();
        for (var i = 0, j = this.children.length; i < j; ++i) {
            this.children[i].updateTransform();
        }
    }
    else if (type & DisplayChangeStatus.SHOW) {
        self._displayChangeStatus &= ~DisplayChangeStatus.HIDE;
    }

    var parent = self;
    while ((parent = parent.parent) && !parent._subDisplayChanged) {
        parent._subDisplayChanged = true;
    }
};

/**
 * 快速计算显示对象的边界信息
 */
PIXI.DisplayObject.prototype._fastCalcBounds = function(lastBounds, dirtyStatus) {
    var self = this,
        width = self.getSelfWidth && self.getSelfWidth(),
        height = self.getSelfHeight && self.getSelfHeight();

    // 隐藏，完全透明，宽或高为0时，当前区域为空
    if ((dirtyStatus & DisplayChangeStatus.HIDE) ||
        !self.worldAlpha ||
        !self.worldVisible ||
        !width ||
        !height)
        return null;
    var wt = self.worldTransform,
        a = wt.a,
        b = wt.b,
        c = wt.c,
        d = wt.d,
        tx = wt.tx,
        ty = wt.ty;

    // 没有历史记录或者需要重新计算，则完全重算
    if (!lastBounds || (dirtyStatus & DisplayChangeStatus.RECALC_MASK)) {
        var anchorX = self.anchor ? self.anchor.x : 0,
            anchorY = self.anchor ? self.anchor.y : 0;
        var sx = width * -anchorX,
            sy = height * -anchorY,
            ex = sx + width,
            ey = sy + height;
        var temp;
        if (width < 0) {
            temp = sx;
            sx = ex;
            ex = temp;
        }
        if (height < 0) {
            temp = sy;
            sy = ey;
            ey = temp;
        }
        var minX, maxX, minY, maxY;

        if (b === 0 && c === 0) {
            if (a < 0) {
                minX = a * ex + tx;
                maxX = a * sx + tx;
            }
            else {
                minX = a * sx + tx;
                maxX = a * ex + tx;
            }

            if (d < 0) {
                minY = d * ey + ty;
                maxY = d * sy + ty;
            }
            else {
                minY = d * sy + ty;
                maxY = d * ey + ty;
            }
        }
        else {
            var aminx, amaxx, bminx, bmaxx, cminy, cmaxy, dminy, dmaxy;
            if (a >= 0) {
                aminx = a * sx;
                amaxx = a * ex;
            }
            else {
                aminx = a * ex;
                amaxx = a * sx;
            }
            if (b >= 0) {
                bminx = b * sx;
                bmaxx = b * ex;
            }
            else {
                bminx = b * ex;
                bmaxx = b * sx;
            }
            if (c >= 0) {
                cminy = c * sy;
                cmaxy = c * ey;
            }
            else {
                cminy = c * ey;
                cmaxy = c * sy;
            }
            if (d >= 0) {
                dminy = d * sy;
                dmaxy = d * ey;
            }
            else {
                dminy = d * ey;
                dmaxy = d * sy;
            }

            minX = aminx + cminy + tx;
            maxX = amaxx + cmaxy + tx;
            minY = bminx + dminy + ty;
            maxY = bmaxx + dmaxy + ty;
        }
        return {
            x : minX,
            y : minY,
            width : maxX - minX,
            height : maxY - minY,
            tx : tx,
            ty : ty,
            area : (maxX - minX) * (maxY - minY)
        };
    }
    else if (dirtyStatus & DisplayChangeStatus.REOFFSET_MASK) {
        var offX = tx - lastBounds.tx,
            offY = ty - lastBounds.ty;
        return {
            x : lastBounds.x + tx - lastBounds.tx,
            y : lastBounds.y + ty - lastBounds.ty,
            width : lastBounds.width,
            height : lastBounds.height,
            tx : tx,
            ty : ty,
            area : lastBounds.area
        };
    }
    else {
        // tint变化或者alpha变化，范围矩形不变
        return {
            x : lastBounds.x,
            y : lastBounds.y,
            tx : lastBounds.tx,
            ty : lastBounds.ty,
            width : lastBounds.width,
            height : lastBounds.height,
            area : lastBounds.area
        };
    }
};

/**
 * 更新节点在世界中的范围
 * 在调用前，必须确保调用过updateTransform，以保证能获取到正确的worldTransform
 * 返回是否可以跳过当前节点子节点的计算
 */
PIXI.DisplayObject.prototype._updateBounds = function(force) {
    var self = this,
        wt = self.worldTransform,
        parent = self.parent;

    var parentStatus = parent ? parent._displayChangeStatus : 0;

    if (self._displayChangeStatus == null || force) {
        self._displayChangeStatus = DisplayChangeStatus.SHOW;
    }
    var dirtyStatus = self._displayChangeStatus;

    // 自身属性的变化，在变化时进行设置，这里主要是继承父节点的变化
    // 父节点的偏移，缩放，旋转和visible发生变化时，自己需要继承
    dirtyStatus = dirtyStatus | (parentStatus & DisplayChangeStatus.INHERIT_MASK);
    if (!self.worldVisible && !(dirtyStatus & DisplayChangeStatus.HIDE)){
        // 不可见且不是HIDE事件发生的帧则忽略后续计算
        return true;
    }

    if (dirtyStatus === 0)
        return false;

    // 将当前范围信息记入历史
    self._lastWorldBounds || (self._lastWorldBounds = []);
    var isFrameSamples = self._qc && self._qc.animationType === qc.Sprite.FRAME_SAMPLES;
    var record = self._currWorldBounds;
    self._currWorldBounds && self._lastWorldBounds.push(self._currWorldBounds);
    self._displayChangeStatus = dirtyStatus;
    if (isFrameSamples) {
        var bounds = self._qc.getSampledAnimationBounds();
        var p1 = self.worldTransform.apply(new qc.Point(bounds.x, bounds.y));
        var p2 = self.worldTransform.apply(new qc.Point(bounds.x + bounds.width, bounds.y));
        var p3 = self.worldTransform.apply(new qc.Point(bounds.x + bounds.width, bounds.y + bounds.height));
        var p4 = self.worldTransform.apply(new qc.Point(bounds.x, bounds.y + bounds.height));

        // 取极值
        var left = Math.min(p1.x, p2.x, p3.x, p4.x);
        var right = Math.max(p1.x, p2.x, p3.x, p4.x);
        var top = Math.min(p1.y, p2.y, p3.y, p4.y);
        var bottom = Math.max(p1.y, p2.y, p3.y, p4.y);
        self._currWorldBounds = {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
            area: (right - left) * (bottom - top)
        };
    }
    else {
        self._currWorldBounds = self._fastCalcBounds(self._lastWorldBounds[self._lastWorldBounds.length - 1], dirtyStatus);
    }
    self._dirtyBounds = record !== self._currWorldBounds;
    return false;
};

PIXI.DisplayObject.prototype._resetDisplayChangeStatus = function() {
    var self = this;
    self._displayChangeStatus = 0;
};

/*
* Updates the object transform for rendering
*
* @method updateTransform
* @private
*/
PIXI.DisplayObject.prototype.updateTransform = function() {
    var parent = this.parent;
    if (!parent) {
        return;
    }

    // TODO: 考虑将此代码移除出去，没有必要每帧都来调度
    // multiply the alphas..
    this.worldAlpha = this.alpha * this.parent.worldAlpha;
    if (this._lastWorldAlpha !== this.worldAlpha) {
        this._lastWorldAlpha = this.worldAlpha;
        this.displayChanged(DisplayChangeStatus.ALPHA);
    }

    if (!this._isNotNeedCalcTransform || parent._isSubNeedCalcTransform) {
        this.game && this.game._calcTransformCount++;
        var pt = this.parent.worldTransform;
        var wt = this.worldTransform;

        // temporary matrix variables
        var a, b, c, d, tx, ty;
        wt.inUpdate = true;
        // so if rotation is between 0 then we can simplify the multiplication process..
        if (this.rotation % PIXI.PI_2) {
            // check to see if the rotation is the same as the previous render. This means we only need to use sin and cos when rotation actually changes
            if (this.rotation !== this.rotationCache) {
                this.rotationCache = this.rotation;
                this._sr = Math.sin(this.rotation);
                this._cr = Math.cos(this.rotation);
            }

            // get the matrix values of the displayobject based on its transform properties..
            a  =  this._cr * this.scale.x;
            b  =  this._sr * this.scale.x;
            c  = -this._sr * this.scale.y;
            d  =  this._cr * this.scale.y;
            tx =  this.position.x;
            ty =  this.position.y;

            // check for pivot.. not often used so geared towards that fact!
            if (this.pivot.x || this.pivot.y) {
                tx -= this.pivot.x * a + this.pivot.y * c;
                ty -= this.pivot.x * b + this.pivot.y * d;
            }

            // concat the parent matrix with the objects transform.
            wt.a  = a  * pt.a + b  * pt.c;
            wt.b  = a  * pt.b + b  * pt.d;
            wt.c  = c  * pt.a + d  * pt.c;
            wt.d  = c  * pt.b + d  * pt.d;
            wt.tx = tx * pt.a + ty * pt.c + pt.tx;
            wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        }
        else {
            // lets do the fast version as we know there is no rotation..
            a  = this.scale.x;
            d  = this.scale.y;

            tx = this.position.x - this.pivot.x * a;
            ty = this.position.y - this.pivot.y * d;

            wt.a  = a  * pt.a;
            wt.b  = a  * pt.b;
            wt.c  = d  * pt.c;
            wt.d  = d  * pt.d;
            wt.tx = tx * pt.a + ty * pt.c + pt.tx;
            wt.ty = tx * pt.b + ty * pt.d + pt.ty;
        }
        this._isNotNeedCalcTransform = true;
        this._isSubNeedCalcTransform = true;

        if (this.worldTransformChangedCallback) {
            this.worldTransformChangedCallback.call(this.worldTransformChangedContext);
        }

        //  Custom callback?
        if (this.transformCallback) {
            wt.inUpdate = false;
            this.transformCallback.call(this.transformCallbackContext, wt, pt);
        }

        if (this._onTransformChanged) {
            this._onTransformChanged.dispatch(wt, pt);
        }
    }
    else {
        this._isSubNeedCalcTransform = false;
        var wt = this.worldTransform;
        var pt = parent.worldTransform;

        //  Custom callback?
        if (this.transformCallback) {
            wt.inUpdate = false;
            this.transformCallback.call(this.transformCallbackContext, wt, pt);
        }
    }
};

/**
 * 替换updateTransform
 */
PIXI.DisplayObject.prototype.displayObjectUpdateTransform = PIXI.DisplayObject.prototype.updateTransform;

/**
 * 获取当前的worldTransform
 * @returns {PIXI.DisplayObject.worldTransform|*}
 */
PIXI.DisplayObject.prototype.getWorldTransform = function() {
    var isDirty = false;
    var parent = this;
    var lastDirtyNode = null;
    while (parent) {
        if (!parent._isNotNeedCalcTransform) {
            isDirty = true;
            lastDirtyNode = parent;
        }
        parent = parent.parent;
    }
    if (isDirty) {
        lastDirtyNode.updateTransform();
    }
    return this.worldTransform;
};
