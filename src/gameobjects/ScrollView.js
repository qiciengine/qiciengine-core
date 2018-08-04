/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 滚动视图
 * 用于在一个指定的小区域内显示较大的内容
 * @class qc.ScrollView
 * @param {qc.Game} game - 游戏对象
 * @param {qc.Node | null} parent - 父亲节点
 * @constructor
 */
var ScrollView = qc.ScrollView = function(game, parent, uuid) {
    qc.UIImage.call(this, game, parent, uuid);

    // 初始化默认的名字
    this.name = 'ScrollView';

    /**
     * @property {boolean} canHorizontal - 是否响应水平滑动
     */
    this.canHorizontal = true;

    /**
     * @property {boolean} canVertical - 是否响应竖直滑动
     */
    this.canVertical = true;

    /**
     * @property {number} movementType - 边界限制类型
     */
    this.movementType = ScrollView.MOVEMENT_ELASTIC;

    /**
     * @property {number} elasticity - 当movementType === ScrollView.MOVEMENT_ELASTIC时生效，表示复位速度
     */
    this.elasticity = 1;

    /**
     * @property {boolean} inertia - 是否惯性滑动
     */
    this.inertia = true;

    /**
     * @property {number} decelerationRate - 惯性滑动的减速参数
     */
    this.decelerationRate = 0.03;

    /**
     * @property {number} scrollSensitivity - 响应滚动时的倍率
     */
    this.scrollSensitivity = 1;

    /**
     * @property {boolean} propagationScroll - 是否向上传递滚动事件
     * @type {boolean}
     */
    this.propagationScroll = false;

    /**
     * @property {Phaser.Signal} onValueChange - 偏移值发生变化时调用
     */
    this.onValueChange = new Phaser.Signal();

    /**
     * @property {qc.Rectangle | null} _contentRect - 内容区域在本节点坐标系下的位置
     * @private
     */
    this._contentRect = null;

    /**
     * @property {qc.Rectangle | null} _viewRect - 记录本视窗的大小
     * @private
     */
    this._viewRect = null;

    /**
     * @property {qc.Point | null} _preContentPosition - 上一次处理的显示内容的偏移值
     * @private
     */
    this._preContentPosition = null;

    /**
     * @property {qc.Rectangle | null} _preContentRect - 上一次处理的内容区域在本节点坐标系下的位置
     * @private
     */
    this._preContentRect = null;

    /**
     * @property {qc.Rectangle | null} _preViewRect - 上一次处理的本视窗的大小
     * @private
     */
    this._preViewRect = null;

    /**
     * @property {qc.Point] _velocity - 滚动的速率，每秒移动的距离
     * @private
     */
    this._velocity = new qc.Point(0, 0);

    /**
     * @property {boolean} _isDragging - 是否正在拖拽中
     * @private
     */
    this._isDragging = false;

    // 监听滚动事件和拖拽事件
    this.onWheel.add(this._doWheel, this);
    this.onDragStart.add(this._doDragStart, this);
    this.onDrag.add(this._doDrag, this);
    this.onDragEnd.add(this._doDragEnd, this);
};
ScrollView.prototype = Object.create(qc.UIImage.prototype);
ScrollView.prototype.constructor = ScrollView;

Object.defineProperties(ScrollView.prototype, {

    /**
     * @property {string} class - 类名
     * @
     * @internalreadonly
     */
    class : {
        get : function() { return 'qc.ScrollView'; }
    },

    /**
     * @property {qc.Node} content - 需要滚动显示的内容
     */
    content : {
        get : function() {
            if (this._content && this._content._destroy) {
                this._content = null;
            }
            return this._content;
        },
        set : function(value) {
            this._content = value;
            this._updateBounds();
        }
    },

    /**
     * @property {qc.Node | null} horizontalScrollBar - 水平滚动条
     */
    horizontalScrollBar : {
        get : function() {
            if (this._horizontalScrollBar && this._horizontalScrollBar._destroy) {
                this._horizontalScrollBar = null;
            }
            return this._horizontalScrollBar;
        },
        set : function(value) {
            if (this._horizontalScrollBar) {
                this._horizontalScrollBar.onValueChange.remove(this._setHorizontalNormalizedPosition, this);
            }
            this._horizontalScrollBar = value;
            if (this._horizontalScrollBar) {
                this._horizontalScrollBar.onValueChange.add(this._setHorizontalNormalizedPosition, this);
            }
        }
    },

    /**
     * @property {qc.Node | null} verticalScrollBar - 竖直滚动条
     */
    verticalScrollBar : {
        get : function() {
            if (this._verticalScrollBar && this._verticalScrollBar._destroy) {
                this._verticalScrollBar = null;
            }
            return this._verticalScrollBar;
        },
        set : function(value) {
            if (this._verticalScrollBar) {
                this._verticalScrollBar.onValueChange.remove(this._setVerticalNormalizedPosition, this);
            }
            this._verticalScrollBar = value;
            if (this._verticalScrollBar) {
                this._verticalScrollBar.onValueChange.add(this._setVerticalNormalizedPosition, this);
            }
        }
    },

    /**
     * @property {number} horizontalNormalizedPosition - 水平方向上滚动的比例
     */
    horizontalNormalizedPosition : {
        get : function() {
            this._updateBounds();
            if (this._contentRect.width <= this._viewRect.width) {
                return (this._viewRect.x > this._contentRect.x) ? 1 : 0;
            }
            return (this._viewRect.x - this._contentRect.x) / (this._contentRect.width - this._viewRect.width);
        },
        set : function(value) {
            this.setNormalizedPosition(value, 0);
        }
    },

    /**
     * @property {number} verticalNormalizedPosition - 竖直方向上滚动的比例
     */
    verticalNormalizedPosition : {
        get : function() {
            this._updateBounds();
            if (this._contentRect.height <= this._viewRect.height) {
                return (this._viewRect.y > this._contentRect.y) ? 1 : 0;
            }
            return (this._viewRect.y - this._contentRect.y) / (this._contentRect.height - this._viewRect.height);
        },
        set : function(value) {
            this.setNormalizedPosition(value, 1);
        }
    }
});

/**
 * 需要序列化的字段和类型
 * @internal
 */
ScrollView.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.UIImage.prototype.getMeta.call(this);

    // 增加Button需要序列化的内容
    json.content = s.NODE;
    json.canHorizontal = s.BOOLEAN;
    json.canVertical = s.BOOLEAN;
    json.movementType = s.NUMBER;
    json.elasticity = s.NUMBER;
    json.inertia = s.BOOLEAN;
    json.decelerationRate = s.NUMBER;
    json.scrollSensitivity = s.NUMBER;
    json.horizontalScrollBar = s.NODE;
    json.verticalScrollBar = s.NODE;
    json.propagationScroll = s.BOOLEAN;
    return json;
};

/**
 * 析构
 */
ScrollView.prototype.onDestroy = function() {
    qc.UIImage.prototype.onDestroy.call(this);
    this.content = null;
    this.horizontalScrollBar = null;
    this.verticalScrollBar = null;
    this.phaser.mask = null;
};

/**
 * 更新
 */
ScrollView.prototype.update = function() {
    // this._updateBounds();
};

/**
 * 在所有节点更新完毕后调整滚动条位置
 */
ScrollView.prototype.postUpdate = function() {
    this._updateVelocity();
};

/**
 * 设置水平位置
 * @param value {Number}
 * @private
 */
ScrollView.prototype._setHorizontalNormalizedPosition = function(value) {
    this.setNormalizedPosition(value, 0);
};

/**
 * 设置竖直位置
 * @param value {Number}
 * @private
 */
ScrollView.prototype._setVerticalNormalizedPosition = function(value) {
    this.setNormalizedPosition(value, 1);
};

/**
 * 设置内容显示的位置
 * @param x {Number} - x轴坐标
 * @param y {Number} - y轴坐标
 * @private
 */
ScrollView.prototype._setContentPosition = function(x, y) {
    this.content.x = x;
    this.content.y = y;
};

/**
 * 计算移动指定距离后，显示区域对于视窗的越界偏移
 * @param deltaX {Number} - x轴上移动的距离
 * @param deltaY {Number} - y轴上移动的距离
 * @returns {qc.Point}
 */
ScrollView.prototype._calculateOffset = function(deltaX, deltaY) {
    var offset = new qc.Point(0, 0);
    // 无限制的情况下，没有越界处理
    if (this.movementType === ScrollView.MOVEMENT_UNRESTRICTED) {
        return offset;
    }
    var rect = this.rect;
    var contentRect = this._contentRect;
    var min = new qc.Point(contentRect.x, contentRect.y);
    var max = new qc.Point(contentRect.x + contentRect.width, contentRect.y + contentRect.height);
    if (this.canHorizontal) {
        min.x += deltaX;
        max.x += deltaX;
        if (min.x > rect.x) {
            offset.x = rect.x - min.x;
        }
        else if (max.x < rect.x + rect.width) {
            offset.x = rect.x + rect.width - max.x;
        }
    }

    if (this.canVertical) {
        min.y += deltaY;
        max.y += deltaY;
        if (min.y > rect.y) {
            offset.y = rect.y - min.y;
        }
        else if (max.y < rect.y + rect.height) {
            offset.y = rect.y + rect.height - max.y;
        }
    }

    return offset;
};

/**
 * 处理回弹效果
 * @param position {qc.Point} - 当前位置
 * @param offset {qc.Point} - 需要处理的越界值
 * @param deltaTime {Number} - 上一帧到现在的时间
 * @param axisPos {'x' | 'y') - 滚动轴
 * @private
 */
ScrollView.prototype._calcVelocityEffect = function(position, offset, deltaTime, axisPos) {
    // 弹性处理
    if (this.movementType === ScrollView.MOVEMENT_ELASTIC && offset[axisPos] !== 0) {
        var lastOffset = this['_lastOffset_' + axisPos] || 0;
        if (Math.abs(lastOffset) < Math.abs(offset[axisPos])) {
            this['_lastOffset_' + axisPos] = offset[axisPos];
            this._currSmoothetTime = deltaTime;
        }
        else {
            this['_lastOffset_' + axisPos] = offset[axisPos];
            this._currSmoothetTime += deltaTime;
        }
        var smootherTime = this.elasticity <= 0 ? deltaTime : this.elasticity;
        var ret = this.game.math.smoothDamp(position[axisPos], position[axisPos] + offset[axisPos], this._velocity[axisPos], this.elasticity, Number.MAX_VALUE, deltaTime / 100);
        if (Math.abs(position[axisPos] + offset[axisPos] - ret[0]) < 0.0001) {
            position[axisPos] = position[axisPos] + offset[axisPos];
            this._velocity[axisPos] = 0;
        }
        else {
            position[axisPos] = ret[0];
            this._velocity[axisPos] = ret[1];
        }
        //position[axisPos] = position[axisPos] + offset[axisPos] * Phaser.Math.smoothstep(this._currSmoothetTime, 0, smootherTime * 1000);
        //this._velocity[axisPos] = 0;

    }
    else if (this.movementType === ScrollView.MOVEMENT_CLAMPED && offset[axisPos] !== 0) {
        position[axisPos] = position[axisPos] + offset[axisPos];
    }
    else if (this.inertia) {
        // 计算速度衰减
        var velocity = this._velocity[axisPos] * Math.pow(Math.abs(this.decelerationRate), deltaTime / 1000);
        if (Math.abs(velocity) < 1) {
            velocity = 0;
        }
        this._velocity[axisPos] = velocity;
        position[axisPos] = position[axisPos] + velocity * deltaTime / 1000;
    }
    else {
        this._velocity[axisPos] = 0;
    }
};

/**
 * 弹性形变
 * @param overStretching {Number} - 越界值，相当于力的大小
 * @param viewSize {Number} - 正常值
 * @return {Number} 产生的形变值
 * @private
 */
ScrollView.prototype._rubberDelta = function(overStretching, viewSize) {
    return (1 - (1 / ((Math.abs(overStretching) * 0.55 / viewSize) + 1))) * viewSize * this.game.math.sign(overStretching);
};

/**
 * 更新处理速度信息
 * @private
 */
ScrollView.prototype._updateVelocity = function() {
    if (!this.content) {
        return;
    }

    // this._updateBounds();
    var deltaTime = this.game.time.deltaTime;
    var offset = this._calculateOffset(0, 0);
    var position = new qc.Point(this.content.x, this.content.y);

    // 拖拽中，或者越界的偏移为0，或者回弹的速度为0时跳过
    if (!this._isDragging &&
        ((offset.x !== 0 || offset.y !== 0) ||
        (this._velocity.x !== 0 || this._velocity.y !== 0))) {
        this._updateBounds();

        this._calcVelocityEffect(position, offset, deltaTime, 'x');
        this._calcVelocityEffect(position, offset, deltaTime, 'y');

        if (this._velocity.x !== 0 ||
            this._velocity.y !== 0) {
            if (this.movementType === ScrollView.MOVEMENT_CLAMPED) {
                offset = this._calculateOffset(position.x - this.content.x, position.y - this.content.y);
                position.x += offset.x;
                position.y += offset.y;
            }
        }
        this._setContentPosition(position.x, position.y);
    }

    if (this._isDragging && this.inertia) {
        this._updateBounds();

        var vx = this.content.x - this._preContentPosition.x;
        var vy = this.content.y - this._preContentPosition.y;

        var l =  this.game.math.clamp(deltaTime / 1000, 0, 1);

        this._velocity.x = vx / l;
        this._velocity.y = vy / l;
    }

    if (!this._preViewRect || !qc.Rectangle.equals(this._viewRect, this._preViewRect) ||
        !this._preContentRect || !qc.Rectangle.equals(this._contentRect, this._preContentRect) ||
        !this._preContentPosition || !qc.Point.equals(this._preContentPosition, position)) {
        this._updateScrollBars(offset.x, offset.y);
        this.onValueChange.dispatch(new qc.Point(this.horizontalNormalizedPosition, this.verticalNormalizedPosition));
        this._updatePrevData();
    }
};

/**
 * 设置指定方向上的滚动值
 * @param value {number} - 设置的值
 * @param axis {number} - 坐标轴，0：x轴，1：y轴
 */
ScrollView.prototype.setNormalizedPosition = function(value, axis) {
    this._updateBounds();
    if (!this.content || !this._contentRect) {
        return;
    }
    var lenProperty = axis ? 'height' : 'width';
    var posProperty = axis ? 'y' : 'x';
    var hiddenLength = this._contentRect[lenProperty] - this._viewRect[lenProperty];
    var contentMinPosition = this._viewRect[posProperty] - value * hiddenLength;
    var newLocalPosition = this.content[posProperty] + contentMinPosition - this._contentRect[posProperty];
    var localPosition = this.content[posProperty];
    // 滚动位置相差1个像素时开始处理
    if (Math.abs(localPosition - newLocalPosition) > 1) {
        this.content[posProperty] = newLocalPosition;
        // 设置滚动速率为0
        this._velocity[posProperty] = 0;
        this._updateBounds();
    }
};

/**
 * 更新记录的上一次信息
 * @private
 */
ScrollView.prototype._updatePrevData = function() {
    if (this.content) {
        this._preContentPosition = new qc.Point(this.content.x, this.content.y);
    }
    else {
        this._preContentPosition = new qc.Point(0, 0);
    }
    this._preContentRect = this._contentRect;
    this._preViewRect = this._viewRect;
};

/**
 * 更新滚动条的滚动信息
 * @param offX {number} - 在水平方向上的偏移
 * @param offY {number} - 在竖直方向上的偏移
 * @private
 */
ScrollView.prototype._updateScrollBars = function(offX, offY) {
    if (this.horizontalScrollBar) {
        if (this._contentRect.width > 0) {
            var barSize = (this._viewRect.width - Math.abs(offX)) / this._contentRect.width;
            this.horizontalScrollBar.size = Phaser.Math.clamp(barSize,0, 1);
        }
        else {
            this.horizontalScrollBar.size = 1;
        }
        this.horizontalScrollBar.value = this.horizontalNormalizedPosition;
    }

    if (this.verticalScrollBar) {
        if (this._contentRect.height > 0) {
            var barSize = (this._viewRect.height - Math.abs(offY)) / this._contentRect.height;
            this.verticalScrollBar.size = Phaser.Math.clamp(barSize, 0, 1);
        }
        else {
            this.verticalScrollBar.size = 1;
        }
        this.verticalScrollBar.value = this.verticalNormalizedPosition;
    }
};

/**
 * 更新区域信息
 * @private
 */
ScrollView.prototype._updateBounds = function() {
    this._viewRect = this.rect;
    this._updateContentBounds();
    if (!this.content)
        return;
    var viewRect = this.rect;

    // 如果内容区域下于显示区域，则模拟内容区域为显示区域大小
    var diffWidth = viewRect.width - this._contentRect.width;
    var diffHeight = viewRect.height - this._contentRect.height;
    if (diffWidth > 0) {
        this._contentRect.width = viewRect.width;
        this._contentRect.x -= diffWidth * this.content.pivotX;
    }
    if (diffHeight > 0) {
        this._contentRect.height = viewRect.height;
        this._contentRect.y -= diffHeight * this.content.pivotY;
    }
};

/**
 * 更新内容的区域信息
 * @private
 */
ScrollView.prototype._updateContentBounds = function() {
    if (!this.content) {
        this._contentRect = new qc.Rectangle(0, 0, 0, 0);
        return;
    }

    this._contentRect = qc.Bounds.getBox(this.content, qc.Bounds.USE_BOUNDS, false, 1, this);
};

/**
 * 滚动条滚动时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.WheelEvent} - 拖拽结束事件
 * @private
 */
ScrollView.prototype._doWheel = function(node, event) {
    if (!this.content) {
        return;
    }

    this._updateBounds();

    var delta = new qc.Point(event.source.deltaX, event.source.deltaY);
    if (!this.canVertical) {
        delta.y = 0;
    }
    if (!this.canHorizontal) {
        delta.x = 0;
    }

    var deltaX = delta.x * this.scrollSensitivity;
    var deltaY = delta.y * this.scrollSensitivity;
    this.doScroll(deltaX, deltaY, false);
};

/**
 * 开始拖拽
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragStartEvent} - 开始拖拽事件
 * @private
 */
ScrollView.prototype._doDragStart = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }

    this._updateBounds();
    // 记录当前点击时内容的显示位置
    this._contentStartPosition = new qc.Point(this.content.x, this.content.y);
    this._pointerStartCursor = this.toLocal(new qc.Point(event.source.startX, event.source.startY));
    this._isDragging = true;
};

/**
 * 处理拖拽结束
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEndEvent} - 拖拽结束事件
 * @private
 */
ScrollView.prototype._doDragEnd = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }
    this._isDragging = false;
};

/**
 * 处理拖拽事件
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEvent} - 拖拽结束事件
 * @private
 */
ScrollView.prototype._doDrag = function(node, event) {
    if (event.source.eventId !== qc.Mouse.BUTTON_LEFT) {
        return;
    }

    this._updateBounds();
    var cursor = this.toLocal(new qc.Point(event.source.x, event.source.y));
    if (!this._pointerStartCursor)
        return;

    var deltaX = this.canHorizontal ? (cursor.x - this._pointerStartCursor.x) : 0;
    var deltaY = this.canVertical ? (cursor.y - this._pointerStartCursor.y) : 0;
    this.doScroll(this._contentStartPosition.x + deltaX - this.content.x,
        this._contentStartPosition.y + deltaY - this.content.y,
        true);
};

/**
 * 处理滚动事件
 * @param deltaX {number} - x轴偏移
 * @param deltaY {number} - x轴偏移
 * @param isDrag {boolean} - 是否是拖拽
 */
ScrollView.prototype.doScroll = function(deltaX, deltaY, isDrag) {
    var position = new qc.Point(this.content.x, this.content.y);
    position.x += deltaX;
    position.y += deltaY;
    var offset = this._calculateOffset(deltaX, deltaY);
    position.x += offset.x;
    position.y += offset.y;
    if (this.movementType === ScrollView.MOVEMENT_CLAMPED && this.propagationScroll) {
        var parentScroll = this.parent;
        while (!(parentScroll instanceof ScrollView) && parentScroll !== this.game.world) {
            parentScroll = parentScroll.parent;
        }
        if (parentScroll instanceof ScrollView) {
            parentScroll.doScroll(-offset.x, -offset.y, isDrag);
        }
    }
    else if (this.movementType === ScrollView.MOVEMENT_ELASTIC) {
        if (isDrag) {
            if (offset.x !== 0) {
                position.x = position.x - this._rubberDelta(offset.x, this._viewRect.width);
            }
            if (offset.y !== 0) {
                position.y = position.y - this._rubberDelta(offset.y, this._viewRect.height);
            }
        }
        else {
            position.x -= offset.x;
            position.y -= offset.y;
            if (Math.abs(offset.x) > this._viewRect.width) {
                position.x += offset.x - this.game.math.sign(offset.x) * this._viewRect.width;
            }
            if (Math.abs(offset.y) > this._viewRect.height) {
                position.y += offset.y - this.game.math.sign(offset.y) * this._viewRect.height;
            }
        }
    }
    this._setContentPosition(position.x, position.y);
    if (!isDrag) {
        this._updateBounds();
    }
};

/**
 * 滚动区域无限制
 * @constant
 * @type {number}
 */
ScrollView.MOVEMENT_UNRESTRICTED = 0;

/**
 * 滚动区域有限制，但可以超越边界，之后被拖回
 * @constant
 * @type {number}
 */
ScrollView.MOVEMENT_ELASTIC = 1;

/**
 * 滚动区域有限制，无法超过边界
 * @constant
 * @type {number}
 */
ScrollView.MOVEMENT_CLAMPED = 2;
