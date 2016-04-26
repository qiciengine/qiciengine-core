/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * RectTransform部分的实现
 */
Object.defineProperties(Node.prototype, {
    /**
    * @property {number} x
    * 本地X坐标(相对于父亲节点)
    */
    x: {
        get: function () {
            return this.phaser.x;
        },
        set: function (v) {
            if (this.x === v) return;

            // 如果anchor在X方向不重合，需要重新计算下left和right
            if (this.minAnchor.x < this.maxAnchor.x) {
                this._left = this.left + (v - this.x);
                this._right = this.right - (v - this.x);
            }

            // 更新下anchorX的值
            this.phaser.x = v;
            this._calcAnchoredX();

            this.phaser.displayChanged(qc.DisplayChangeStatus.OFFSET);
            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} y
     * 本地Y坐标(相对于父亲节点)
     */
    y: {
        get: function() {
            return this.phaser.y;
        },
        set: function(v) {
            if (this.y === v) return;

            // 如果anchor在Y方向不重合，直接设置Y坐标是无效的
            if (this.minAnchor.y < this.maxAnchor.y) {
                this._top = this.top + (v - this.y);
                this._bottom = this.bottom - (v - this.y);
            }

            // 更新下anchorY的值
            this.phaser.y = v;
            this._calcAnchoredY();

            this.phaser.displayChanged(qc.DisplayChangeStatus.OFFSET);
            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} 相对于父亲anchor的X偏移量
     */
    anchoredX : {
        get : function() {
            if (this._anchoredX === undefined) {
                // 尚未设置过，根据X坐标来计算下
                this._calcAnchoredX();
            }
            return this._anchoredX;
        },
        set : function(v) {
            if (v === this.anchoredX) return;
            this._anchoredX = v;
            this._calcX();

            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} 相对于父亲anchor的Y偏移量
     */
    anchoredY : {
        get : function() {
            if (this._anchoredY === undefined) {
                // 尚未设置过，根据Y坐标来计算下
                this._calcAnchoredY();
            }
            return this._anchoredY;
        },
        set : function(v) {
            if (v === this.anchoredY) return;
            this._anchoredY = v;
            this._calcY();

            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} scaleX - 节点的在X轴上的缩放
     */
    'scaleX': {
        get: function () {
            return this.phaser.scale.x;
        },
        set: function (v) {
            if (v === this.scaleX)
                return;

            this.phaser.scale.x = v;
            this.phaser.displayChanged(qc.DisplayChangeStatus.SCALE);
            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} scaleY - 节点的在Y轴上的缩放
     */
    'scaleY': {
        get: function () {
            return this.phaser.scale.y;
        },
        set: function (v) {
            if (v === this.scaleY)
                return;

            this.phaser.scale.y = v;

            this.phaser.displayChanged(qc.DisplayChangeStatus.SCALE);
            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} pivotX - 节点自身的原点X位置
     * 0为左边，1为右边
     */
    pivotX : {
        get : function() {
            if (!this.phaser.anchor)
                this.phaser.anchor = new qc.Point(0, 0);
            return this.phaser.anchor.x;
        },
        set : function(v) {
            if (!this.phaser.anchor)
                this.phaser.anchor = new qc.Point(0, 0);
            if (this.phaser.anchor.x === v) return;

            this.phaser.anchor.x = v;
            this.phaser.displayChanged(qc.DisplayChangeStatus.ROTATION);
            this.relayout();
        }
    },

    /**
     * @property {number} pivotY - 节点自身的原点Y位置
     * 0为左边，1为右边
     */
    pivotY : {
        get : function() {
            if (!this.phaser.anchor)
                this.phaser.anchor = new qc.Point(0, 0);
            return this.phaser.anchor.y;
        },
        set : function(v) {
            if (!this.phaser.anchor)
                this.phaser.anchor = new qc.Point(0, 0);
            if (this.phaser.anchor.y === v) return;

            this.phaser.anchor.y = v;
            this.phaser.displayChanged(qc.DisplayChangeStatus.ROTATION);
            this.relayout();
        }
    },

    /**
     * @property {number} rotation - 旋转角度
     */
    'rotation': {
        get: function () {
            return this.phaser.rotation;
        },
        set: function (v) {
            if (this.phaser.rotation === v) {
                return;
            }
            this.phaser.rotation = v;
            this.phaser.displayChanged(qc.DisplayChangeStatus.ROTATION);
            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} skewX - x轴拉伸角度，为兼容 DragonBones添加
     */
    skewX : {
        get: function () {
            return this._skewX;
        },
        set: function (v) {
            if (this._skewX === v) {
                return;
            }
            this._skewX = v;
            this.phaser.displayChanged(qc.DisplayChangeStatus.ROTATION);
            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} skewY - y轴拉伸角度，为兼容 DragonBones添加
     */
    skewY : {
        get: function () {
            return this._skewY;
        },
        set: function (v) {
            if (this._skewY === v) {
                return;
            }
            this._skewY = v;
            this.phaser.displayChanged(qc.DisplayChangeStatus.ROTATION);
            // 需要更新变换矩阵
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} width - 节点的宽度
     */
    'width': {
        // 使用我自己的实现就可以了(如果是Node的话)
        // 如果是其他元素（如UIImage等）需要按照实际情况进行重载实现
        get: function () {
            return this._width = this._width || 0;
        },
        set: function (v) {
            if (this.game.math.fuzzyEqual(this._width, v, 0.001)) return;

            // 如果anchor在X方向不重合，需要重新计算下left和right
            if (this.minAnchor.x < this.maxAnchor.x) {
                var delta = v - this.width;
                var deltaLeft = delta * this.pivotX;
                var deltaRight = delta - deltaLeft;
                this._left -= deltaLeft;
                this._right -= deltaRight;
            }
            else
                this.setWidth(v);
            this.relayout();
        }
    },

    /**
     * @property {number} height - 节点的高度
     */
    'height': {
        // 使用我自己的实现就可以了(如果是Node的话)
        // 如果是其他元素（如UIImage等）需要按照实际情况进行重载实现
        get: function () {
            return this._height = this._height ? this._height : 0;
        },
        set: function (v) {
            if (this.game.math.fuzzyEqual(this._height, v, 0.001)) return;

            // 如果anchor在Y方向不重合，直接设置高度是无效的
            if (this.minAnchor.y < this.maxAnchor.y) {
                var delta = v - this.height;
                var deltaTop = delta * this.pivotY;
                var deltaBottom = delta - deltaTop;
                this._top -= deltaTop;
                this._bottom -= deltaBottom;
            }
            else
                this.setHeight(v);
            this.relayout();
        }
    },

    /**
     * @property {qc.Point} minAnchor
     * @readonly
     * 定位矩形左上角的坐标（相对于父亲长宽的比例值）
     *  (0, 0) - 左上角
     *  (1, 1) - 右下角
     * 注：大小不能超过maxAnchor
     */
    minAnchor : {
        get : function() {
            if (!this._minAnchor)
                this._minAnchor = new qc.Point(0, 0);
            return this._minAnchor;
        },
        set : function(v) {
            throw new Error('user function:setAnchor');
        }
    },

    /**
     * @property {qc.Point} maxAnchor
     * @readonly
     * 定位矩形右下角的坐标（相对于父亲长宽的比例值）
     *  (0, 0) - 左上角
     *  (1, 1) - 右下角
     * 注：大小不能小于minAnchor
     */
    maxAnchor : {
        get : function() {
            if (!this._maxAnchor)
                this._maxAnchor = new qc.Point(0, 0);
            return this._maxAnchor;
        },
        set : function(v) {
            throw new Error('use function:setAnchor');
        }
    },

    /**
     * @property {number} left
     * 离左边的距离，一般在编辑器里面设置
     * 注意：如果minAnchor.x = maxAnchor.x，此时不起效
     */
    left : {
        get : function() {
            if (this._left === undefined)
                this._left = 0;
            return this._left;
        },
        set : function(v) {
            if (this._left === v) return;
            this._left = v;
            this.relayout();
        }
    },

    /**
     * @property {number} right
     * 离右边的距离，一般在编辑器里面设置
     * 注意：如果minAnchor.x = maxAnchor.x，此时不起效
     */
    right : {
        get : function() {
            if (this._right === undefined)
                this._right = 0;
            return this._right;
        },
        set : function(v) {
            if (this._right === v) return;
            this._right = v;
            this.relayout();
        }
    },

    /**
     * @property {number} top
     * 离上边的距离，一般在编辑器里面设置
     * 注意：如果minAnchor.y = maxAnchor.y，此时不起效
     */
    top : {
        get : function() {
            if (this._top === undefined)
                this._top = 0;
            return this._top;
        },
        set : function(v) {
            if (this._top === v) return;
            this._top = v;
            this.relayout();
        }
    },

    /**
     * @property {number} bottom
     * 离下边的距离，一般在编辑器里面设置
     * 注意：如果minAnchor.y = maxAnchor.y，此时不起效
     */
    bottom : {
        get : function() {
            if (this._bottom === undefined)
                this._bottom = 0;
            return this._bottom;
        },
        set : function(v) {
            if (this._bottom === v) return;
            this._bottom = v;
            this.relayout();
        }
    },

    /**
     * @property {qc.Rectangle} rect - 矩形框(相对于父亲节点)
     * @protected
     * @readonly
     */
    rect : {
        get : function() {
            var w = this.width;
            var h = this.height;
            return new qc.Rectangle(-this.width * this.pivotX, -this.height * this.pivotY, w, h);
        }
    },

    /**
     * @property {qc.Matrix} worldTransform - 自身在世界的变形矩阵
     * @protected
     * @readonly
     */
    worldTransform : {
        get : function() {
            this.nodeUpdateTransform();
            return this.phaser.worldTransform;
        }
    },

    /**
     * @property {qc.Rectangle} localBounds - 节点自身的显示范围
     * @readonly
     */
    localBounds : {
        get : function() {
            return this.phaser.getLocalBounds();
        }
    },

    /**
     * @property {boolean} _isTransformDirty - 节点的变化矩阵是否需要重新计算
     */
    _isTransformDirty : {
        get : function() { return !this.phaser._isNotNeedCalcTransform; },
        set : function(v) {
            if (this.phaser._isNotNeedCalcTransform === !v) {
                return;
            }
            this.phaser._isNotNeedCalcTransform = !v;
        }
    },

    /**
     * @property {Phaser.Signal} onLayoutArgumentChanged - 节点布局属性变化，宽高、layoutElement 参数变化
     */
    onLayoutArgumentChanged : {
        get : function() {
            return this._onLayoutArgumentChanged || (this._onLayoutArgumentChanged = new Phaser.Signal());
        }
    },

    /**
     * @property {Phaser.Signal} onRelayout - 节点重布局结束
     */
    onRelayout : {
        get : function() {
            return this._onRelayout || (this._onRelayout = new Phaser.Signal());
        }
    },
    /**
     * @property {Phaser.Signal} onTransformChanged - 节点transform变化事件
     */
    onTransformChanged : {
        get : function() {
            return this.phaser._onTransformChanged || (this.phaser._onTransformChanged = new Phaser.Signal());
        }
    }
});

/**
 * 修改可伸缩参数
 * @param left {number} - 离左边的距离
 * @param right {number} - 离右边的距离
 * @param top {number} - 离上边的距离
 * @param bottom {number} - 离下边的距离
 */
Node.prototype.setStretch = function(left, right, top, bottom) {
    var changed = false;
    if (this.minAnchor.x >= this.maxAnchor.x) {
        if (this._anchoredX !== left) {
            this._anchoredX = left;
            changed = true;
        }
    }
    else {
        if (left !== undefined && this._left !== left) {
            this._left = left;
            changed = true;
        }
        if (right !== undefined && this._right !== right) {
            this._right = right;
            changed = true;
        }
    }

    if (this.minAnchor.y >= this.maxAnchor.y) {
        if (this._anchoredY !== top) {
            this._anchoredY = top;
            changed = true;
        }
    }
    else {
        if (top !== undefined && this._top !== top) {
            this._top = top;
            changed = true;
        }
        if (bottom !== undefined && this._bottom !== bottom) {
            this._bottom = bottom;
            changed = true;
        }
    }

    if (changed) {
        this.relayout();
    }
};

/**
 * 设置定位范围
 *
 * @param {qc.Point} min - 左上角的基准点，如果为undefined，则认为没有变化
 * @param {qc.Point} max - 右下角的基准点，如果为undefined，则认为没有变化
 * @param {boolean} keepRect - 是否保持rect不变，默认为true
 */
Node.prototype.setAnchor = function(min, max, keepRect) {
    keepRect = keepRect === undefined ? true : keepRect;
    min = min || this.minAnchor;
    max = max || this.maxAnchor;
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

    if (min.x === this.minAnchor.x && min.y === this.minAnchor.y &&
        max.x === this.maxAnchor.x && max.y === this.maxAnchor.y)
        // 没有啥变化，无视
        return;
    this._minAnchor = min;
    this._maxAnchor = max;
    if (keepRect) {
        this._calcAnchoredX();
        this._calcAnchoredY();
        this._calcMargin();
    }
    else {
        this.relayout();
    }
};

/**
 * 重排布下位置
 *
 * @method qc.Node.relayout
 */
Node.prototype.relayout = function() {
    // 先计算父亲的矩形范围
    var rect = this.parent.rect;

    // 处理x方向
    if (this.minAnchor.x < this.maxAnchor.x) {
        // 根据left和right计算其大小以及x的坐标
        var l = rect.x + rect.width * this.minAnchor.x + this.left;
        var r = rect.x + rect.width * this.maxAnchor.x - this.right;

        // 设置其宽度
        // 注意：这里应该非常单纯的设置phaser元素的大小，由于this.width可能会被重载，
        //   同时this.width是不运行在当前模式下设置值的（无效），因此调用了额外封装的setWidth接口
        var w = r - l;
        this.setWidth(w);

        // 图片的中心应该刚好在（l, r)的中心点
        this.phaser.x = l + w * this.pivotX;
        this._calcAnchoredX();
    }
    else {
        // 根据anchorX的值计算其坐标
        this.phaser.x = rect.x + rect.width * this.minAnchor.x + this.anchoredX;
    }

    // 处理y方向
    if (this.minAnchor.y < this.maxAnchor.y) {
        // 根据top和bottom计算其大小以及y的坐标
        var t = rect.y + rect.height * this.minAnchor.y + this.top;
        var b = rect.y + rect.height * this.maxAnchor.y - this.bottom;

        // 设置其高度
        // 注意：这里应该非常单纯的设置phaser元素的大小，由于this.height可能会被重载，
        //   同时this.height是不运行在当前模式下设置值的（无效），因此调用了额外封装的setHeight接口
        var h = b - t;
        this.setHeight(h);

        // 图片的中心应该刚好在（t, b)的中心点
        this.phaser.y = t + h * this.pivotY;
        this._calcAnchoredY();
    }
    else {
        // 根据anchorY的值计算其坐标
        this.phaser.y = rect.y + rect.height * this.minAnchor.y + this.anchoredY;
    }

    // 需要更新变换矩阵
    this._isTransformDirty = true;

    // 所有的孩子也要进行重排
    var children = this.children;
    for (var i = 0; i < children.length; i++) {
        children[i].relayout();
    }
    // 强制计算下新的四个角信息
    this._calcWorldCorners(true);
    this._dispatchLayoutArgumentChanged('size');

    // 缓存当前的矩形信息
    this._lastRectInfo = new qc.Rectangle(-this.width * this.pivotX, -this.height * this.pivotY, this.width, this.height);
    // 重排完毕，需要派发事件
    if (this._onRelayout)
        this._onRelayout.dispatch();
};

/**
 * 设置节点的宽度，可能会被重载，这接口不会引起重排
 * @protected
 */
Node.prototype.setWidth = function(w) {
    this._width = w;
    this.phaser.displayChanged(qc.DisplayChangeStatus.SIZE);
};

/**
 * 设置节点的高度，可能会被重载，这接口不会引起重排
 * @protected
 */
Node.prototype.setHeight = function(h) {
    this._height = h;
    this.phaser.displayChanged(qc.DisplayChangeStatus.SIZE);
};

/**
 * 设置Node节点默认的大小和位置等信息
 * @private
 */
Node.prototype._defaultTransform = function() {
    // 对于world节点，忽略掉
    if (!this.parent || this.parent === this.game.stage) return;

    // 默认大小为100
    this.x = 0;
    this.y = 0;
    this.width = 100;
    this.height = 100;
};

/**
 * 重新计算四周边距
 * @private
 */
Node.prototype._calcMargin = function() {
    var rect = this.parent.rect;

    if (this.minAnchor.x >= this.maxAnchor.x) {
        this._left = this._right = 0;
    }
    else {
        var nodeX = this.x - this.pivotX * this.width;
        var minX = rect.x + rect.width * this.minAnchor.x;
        this._left = nodeX - minX;

        var maxX = rect.x + rect.width * this.maxAnchor.x;
        this._right = maxX - (nodeX + this.width);
    }

    if (this.minAnchor.y >= this.maxAnchor.y) {
        this._top = this._bottom = 0;
    }
    else {
        var nodeY = this.y - this.pivotY * this.height;
        var minY = rect.y + rect.height * this.minAnchor.y;
        this._top = nodeY - minY;

        var maxY = rect.y + rect.height * this.maxAnchor.y;
        this._bottom = maxY - (nodeY + this.height);
    }
};

/**
 * 计算anchorX
 * @private
 */
Node.prototype._calcAnchoredX = function() {
    var rect = this.parent.rect;
    this._anchoredX = this.x - (rect.width * this.minAnchor.x + rect.x);
};

/**
 * 计算anchorY
 * @private
 */
Node.prototype._calcAnchoredY = function() {
    var rect = this.parent.rect;
    this._anchoredY = this.y - (rect.height * this.minAnchor.y + rect.y);
};

/**
 * 计算X
 * @private
 */
Node.prototype._calcX = function() {
    var rect = this.parent.rect;
    this.x = this._anchoredX + (rect.width * this.minAnchor.x + rect.x);
};

/**
 * 计算Y
 * @private
 */
Node.prototype._calcY = function() {
    var rect = this.parent.rect;
    this.y = this._anchoredY + (rect.height * this.minAnchor.y + rect.y);
};

/**
 * 全局坐标转换成本地坐标
 * @param globalPoint 要进行转换的全局坐标
 * @returns {Point} 转换后的本地坐标
 */
Node.prototype.toLocal = function(globalPoint) {
    return this.worldTransform.applyInverse(globalPoint);
};

/**
 * 本地坐标转换成全局坐标
 * @param localPoint 要进行转换的本地坐标
 * @returns {Point} 转换后的全局坐标
 */
Node.prototype.toGlobal = function(localPoint) {
    return this.worldTransform.apply(localPoint);
};

/**
 * 更新自身的变换矩阵
 * @protected
 * @return 矩阵是否变化了
 */
Node.prototype.nodeUpdateTransform = function() {
    var hasChange = false;
    // 如果存在父节点则更新父节点的变换矩阵
    if (this.parent && this.parent.nodeUpdateTransform)
    {
        hasChange = this.parent.nodeUpdateTransform();
    }
    if (!this._isTransformDirty)
        // 自身的变化矩阵无需变化
        return hasChange;
    // 父节点更新 updateTransform后，会将所有的子节点都进行刷新
    if (!hasChange) {
        this.phaser.updateTransform();
    }
    //this._isTransformDirty = false;
    return true;
};

/**
 * 获取节点在全局坐标系中的位置
 * @returns {Point} 在全局坐标系中的位置
 */
Node.prototype.getWorldPosition = function() {
    var matrix = this.worldTransform;
    return new qc.Point(matrix.tx, matrix.ty);
};

/**
 * 获取节点在全局坐标系中的缩放
 * @returns {point} 在全局坐标系中的缩放
 */
Node.prototype.getWorldScale = function() {
    var matrix = this.worldTransform;
    var skewY = Math.atan2(matrix.b, matrix.a);
    var skewX = Math.atan2(-matrix.c, matrix.d);
    // 当斜率一致，但skew值不同时，需要特俗处理
    if (matrix.b / matrix.a === -matrix.c / matrix.d && skewX !== skewY) {
        skewY = Math.atan(matrix.b / matrix.a);
        skewX = Math.atan(-matrix.c / matrix.d);
    }
    var scaleX = skewY === Math.PI || skewY === 0  || (matrix.b === 0 && matrix.a !== 0) ? matrix.a / Math.cos(skewY) : matrix.b / Math.sin(skewY);
    var scaleY = skewX === Math.PI || skewX === 0  || (matrix.c === 0 && matrix.d !== 0) ? matrix.d / Math.cos(skewX) : -matrix.c / Math.sin(skewX);
    return new qc.Point(scaleX, scaleY);
};

/**
 * 获取节点在全局坐标系中的斜拉偏移，如果x,y轴的斜拉角度一致，退化为Rotation参数，返回{x=0, y=0}
 * 注意：Rotation和Skew只能有一个存在有效值
 * @returns {point} 在全局坐标系中的斜拉偏移
 */
Node.prototype.getWorldSkew = function() {
    var matrix = this.worldTransform;

    if (matrix.b / matrix.a === -matrix.c / matrix.d)
        // x,y轴斜拉的角度一致
        return new qc.Point(0, 0);

    return new qc.Point(Math.atan2(-matrix.c, matrix.d),
                        Math.atan2(matrix.b, matrix.a));
};

/**
 * 获取节点在全局坐标系中的旋转wor
 * 注意：Rotation和Skew只能有一个存在有效值
 * @returns {point} 在全局坐标系中的旋转
 */
Node.prototype.getWorldRotation = function() {
    var matrix = this.worldTransform;

    if (matrix.b / matrix.a !== -matrix.c / matrix.d)
        // 现在是斜拉变形
        return 0;

    return Math.atan2(matrix.b, matrix.a);
};

/**
 * 设置当前节点相对于World的变换信息
 * @parem target {Node} 需要设置的坐标系节点
 * @param x {number} 在世界坐标系中距离原点在x轴上的偏移位置
 * @param y {number} 在世界坐标系中距离原点在y轴上的偏移位置
 * @param scaleX {number} 在世界坐标系中距离原点在x轴上的缩放比例
 * @param scaleY {number} 在世界坐标系中距离原点在y轴上的缩放比例
 * @param rotation {number} 在世界坐标系中旋转的弧度值
 */
Node.prototype.setTransformToWorld = function(x, y, scaleX, scaleY, rotation) {
    this.setTransformTo(this.game.world, x, y, scaleX, scaleY, rotation);
};

/**
 * 设置当前节点相对于target的变换信息
 * @parem target {Node} 需要设置的坐标系节点
 * @param x {number} 在世界坐标系中距离原点在x轴上的偏移位置
 * @param y {number} 在世界坐标系中距离原点在y轴上的偏移位置
 * @param scaleX {number} 在世界坐标系中距离原点在x轴上的缩放比例
 * @param scaleY {number} 在世界坐标系中距离原点在y轴上的缩放比例
 * @param rotation {number} 在世界坐标系中旋转的弧度值
 */
Node.prototype.setTransformTo = function(target, x, y, scaleX, scaleY, rotation) {
    x = x || 0;
    y = y || 0;
    scaleX = scaleX || 1;
    scaleY = scaleY || 1;
    rotation = rotation || 0;

    var skewX = 0;
    var skewY = 0;
    if (arguments.length > 6 && typeof arguments[6] === 'number')
        skewX = arguments[6];
    if (arguments.length > 7 && typeof arguments[7] === 'number')
        skewY = arguments[7];

    var cosSkewX = Math.cos(skewX);
    var sinSkewX = Math.sin(skewX);
    var cosSkewY = Math.cos(skewY);
    var sinSkewY = Math.sin(skewY);

    var cosRot = Math.cos(rotation);
    var sinRot = Math.sin(rotation);

    // 形变的最终变换矩阵结果
    var a = (cosRot * cosSkewY - sinRot * sinSkewX) * scaleX;
    var b = (cosRot * sinSkewY + sinRot * cosSkewX) * scaleX;
    var c = (-sinRot * cosSkewY - cosRot * sinSkewX) * scaleY;
    var d = (-sinRot * sinSkewY + cosRot * cosSkewX) * scaleY;
    var tx = x;
    var ty = y;

    this.setTransformToWithMatrix(target, a, b, c, d, tx, ty);
};

/**
 * 设置当前节点相对于target的变换矩阵信息
 * @param target {Node} 需要设置的坐标系节点
 * @param a {number}
 * @param b {number}
 * @param c {number}
 * @param d {number}
 * @param tx {number}
 * @param ty {number}
 */
Node.prototype.setTransformToWithMatrix = function(target, a, b, c, d, tx, ty) {
    var worldMatrix = [a, b, 0, c, d, 0, tx, ty, 1];
    if (target)
    {
        var targetTrans = target ? (target.worldTransform || new qc.Matrix()) : new qc.Matrix();
        var targetMatrix = targetTrans.toArray(true);
        this.game.math.multiply(worldMatrix, targetMatrix, worldMatrix);
    }

    // 获得父节点的transform
    var parentTrans = this.parent ? (this.parent.worldTransform || new qc.Matrix()) : new qc.Matrix();
    var parentMatrix = parentTrans.toArray(true);
    var out = [];

    // 计算出相对父节点的偏移
    this.game.math.invert(out, parentMatrix);
    this.game.math.multiply(out, out, worldMatrix);

    var a = out[0];
    var b = out[1];
    var c = out[3];
    var d = out[4];

    this.x = out[6];
    this.y = out[7];
    if (b / a !== -c / d)
    {
        // 取斜拉变形
        var skewY = Math.atan2(b, a);
        var skewX = Math.atan2(-c, d);
        this.rotation = skewY;
        //this.rotation = 0;

        this.scaleX = skewY === 0 || (b === 0 && a !== 0)  ? a / Math.cos(skewY) : b / Math.sin(skewY);
        this.scaleY = skewX === 0  ||(c === 0 && d !== 0) ? d / Math.cos(skewX) : -c / Math.sin(skewX);
        //throw new Error('Node不支持Skew形变, skewX = ' + skewX + ',skewY = ' + skewY);
    }
    else {
        // 取旋转变形
        //this.skewX = this.skewY = 0;
        var rotation = Math.atan2(b, a);
        this.rotation = rotation;
        this.scaleX = rotation === 0 || (b === 0 && a !== 0) ? a / Math.cos(rotation) : b / Math.sin(rotation);
        this.scaleY = rotation === 0 || (c === 0 && d !== 0) ? d / Math.cos(rotation) : -c / Math.sin(rotation);
    }

    // 重新计算anchoredX、anchoredY和margin参数
    this._calcAnchoredX();
    this._calcAnchoredY();
    this._calcMargin();
};

/**
 * 为了不将RectTransform的代码逻辑污染到该文件以外，重载Node的addChildAt函数，
 * 后续处理调用孩子relayout布局，以及设置_isTransformDirty脏标志
 */
var oldAddChildAt = Node.prototype.addChildAt;
Node.prototype.addChildAt = function(child, index) {
    // 调用原始实现
    oldAddChildAt.call(this, child, index);
    // 如果不是switchParent函数触发，则需要进行relayout
    if (!child._isSwitchParent) {
        child.relayout();
    }
    child._isTransformDirty = true;
};

/**
 * 切换父节点为指定节点，并保证本节点在世界坐标系中的状态不变
 * @param parent 要切换到的父亲节点
 * @param index 所在父亲节点的孩子位置索引，为空代表插入到最后
 */
Node.prototype.switchParent = function(parent, index) {
    // 目标父节点不允许是自身或者自身的子节点
    if (parent === this || parent.isDescendantOf(this))
        return;

    var worldTransBak = this.worldTransform;
    var a = worldTransBak.a;
    var b = worldTransBak.b;
    var c = worldTransBak.c;
    var d = worldTransBak.d;
    var tx = worldTransBak.tx;
    var ty = worldTransBak.ty;

    // 设置标志避免在设置父子关系的addChildAt函数中进行relayout，
    // 我们已经通过矩阵运算保持节点状态不变了，如果进行relayout会导致状态再次变化
    this._isSwitchParent = true;
    this.parent = parent;
    delete this._isSwitchParent;

    // 设置会原来index位置
    if (index !== null) {
        this.parent.setChildIndex(this, index);
    }

    this.setTransformToWithMatrix(null, a, b, c, d, tx, ty);
};

/**
 * 计算世界坐标下的顶点信息
 * @param {boolean} forceUpdate - 是否强制更新
 * @private
 */
Node.prototype._calcWorldCorners = function(forceUpdate) {
    // 只有强制刷新和矩阵变化时才重新计算点信息
    if (forceUpdate || this.nodeUpdateTransform()) {
        var rect = this.rect;
        var leftTop = new qc.Point(rect.x, rect.y);
        var rightTop = new qc.Point(rect.x + rect.width, rect.y);
        var rightBottom = new qc.Point(rect.x + rect.width, rect.y + rect.height);
        var leftBottom = new qc.Point(rect.x, rect.y + rect.height);

        var worldTransform = this.phaser.worldTransform;

        this._worldLeftTop = worldTransform.apply(leftTop);
        this._worldRightTop = worldTransform.apply(rightTop);
        this._worldRightBottom = worldTransform.apply(rightBottom);
        this._worldLeftBottom = worldTransform.apply(leftBottom);

        var worldMinX = Math.min(this._worldLeftTop.x, this._worldRightTop.x, this._worldRightBottom.x, this._worldLeftBottom.x);
        var worldMaxX = Math.max(this._worldLeftTop.x, this._worldRightTop.x, this._worldRightBottom.x, this._worldLeftBottom.x);
        var worldMinY = Math.min(this._worldLeftTop.y, this._worldRightTop.y, this._worldRightBottom.y, this._worldLeftBottom.y);
        var worldMaxY = Math.max(this._worldLeftTop.y, this._worldRightTop.y, this._worldRightBottom.y, this._worldLeftBottom.y);
        this._worldBox = new qc.Rectangle(worldMinX, worldMinY, worldMaxX - worldMinX, worldMaxY - worldMinY);
    }
};

/**
 * 获取节点在世界坐标中的四个角
 * @return {[qc.Point]}
 */
Node.prototype.getWorldCorners = function() {
    this._calcWorldCorners();
    return [this._worldLeftTop, this._worldRightTop, this._worldRightBottom, this._worldLeftBottom];
};

/**
 * 获取节点在指定节点坐标中的四个角
 * @param {qc.Node} target - 目标节点
 * @return {[qc.Point]}
 */
Node.prototype.getCornersIn = function(target) {
    var targetTransform = target && target.phaser.worldTransform;
    this._calcWorldCorners();
    return !targetTransform ?
            [this._worldLeftTop, this._worldRightTop, this._worldRightBottom, this._worldLeftBottom] :
            [targetTransform.applyInverse(this._worldLeftTop),
            targetTransform.applyInverse(this._worldRightTop),
            targetTransform.applyInverse(this._worldRightBottom),
            targetTransform.applyInverse(this._worldLeftBottom)];
};

/**
 * 获取节点在世界坐标的包围盒
 * @return {qc.Rectangle}
 */
Node.prototype.getWorldBox = function() {
    this._calcWorldCorners();
    return this._worldBox;
};

/**
 * 获取节点在指定节点坐标系中的包围盒
 * @param {qc.Node} target - 目标节点
 * @return {qc.Rectangle}
 */
Node.prototype.getBoxIn = function(target) {
    var corners = this.getCornersIn(target);
    var maxPos = new qc.Point(-Number.MAX_VALUE, -Number.MAX_VALUE);
    var minPos = new qc.Point(Number.MAX_VALUE, Number.MAX_VALUE);
    for (var i = 0; i < 4; i++) {
        var one = corners[i];
        maxPos.x = Math.max(maxPos.x, one.x);
        maxPos.y = Math.max(maxPos.y, one.y);
        minPos.x = Math.min(minPos.x, one.x);
        minPos.y = Math.min(minPos.y, one.y);
    }
    return new qc.Rectangle(minPos.x, minPos.y, maxPos.x - minPos.x, maxPos.y - minPos.y);
};

/**
 * 判断世界坐标中的某个点是否在矩形框的范围内
 * @param globalPoint
 * @returns {boolean}
 */
Node.prototype.rectContains = function(globalPoint) {
    var point = this.toLocal(globalPoint);
    return this.rect.contains(point.x, point.y);
};

/**
 * 通知影响布局参数的改变
 * @private
 */
Node.prototype._dispatchLayoutArgumentChanged = function(type) {
    if (this._onLayoutArgumentChanged) {
        this._onLayoutArgumentChanged.dispatch(type);
    }
};
