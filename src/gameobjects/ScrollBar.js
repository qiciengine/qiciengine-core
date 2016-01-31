/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 滚动条控件
 * 用于滚动ScrollView视图，和显示当前滚动偏移，该控制主要显示滚动条背景，需要设置滑块
 * @class qc.ScrollBar
 * @param {qc.Game} game - 游戏对象
 * @param {qc.Node | null} parent - 父亲节点
 * @constructor
 */
var ScrollBar = qc.ScrollBar = function(game, parent, uuid) {
    qc.UIImage.call(this, game, parent, uuid);

    /**
     * @property {string} name - 控件名字
     */
    this.name = 'ScrollBar';

    // 设置默认值
    this._setValue(0, false);

    // 监听滚动事件和拖拽事件
    this.onWheel.add(this._doWheel, this);
    this.onDown.add(this._doDown, this);
    this.onUp.add(this._doUp, this);
    this.onDragStart.add(this._doDragStart, this);
    this.onDrag.add(this._doDrag, this);
    this.onDragEnd.add(this._doDragEnd, this);
};
ScrollBar.prototype = Object.create(qc.UIImage.prototype);
ScrollBar.prototype.constructor = ScrollBar;

Object.defineProperties(ScrollBar.prototype, {
    /**
     * @property {string} class - 类名
     * @readonly
     * @internal
     */
    class : {
        get : function() { return 'qc.ScrollBar'; }
    },

    /**
     * @property {qc.Node} sliders - 滑块，滑块需要有一个指定rect的父节点，用来处理滑动
     */
    sliders : {
        get : function() {
            if (this._sliders && this._sliders._destroy) {
                this._sliders = null;
            }
            return this._sliders;
        },
        set : function(value) {
            this._sliders = value;
            this._updateSliders();
        }
    },

    /**
     * @property {Number} direction - 滚动条的滑动方向
     */
    direction : {
        get : function() {
            return this._direction || ScrollBar.LEFT_TO_RIGHT;
        },
        set : function (value) {
            this._setDirection(value, false);
        }
    },

    /**
     * @property {Number} value - 当前滑动的值,[0~1]
     */
    value : {
        get : function() {
            return this._value;
        },
        set : function(value) {
            this._setValue(value, true);
        }
    },

    /**
     * @property {Number} size - 滑块长度和滑块区域的比例,(0,1], 滑块最小5个像素
     */
    size : {
        get : function() {
            return this._size;
        },
        set : function(value) {
            if (!this.fixSlidersSize) {
                this._size = Phaser.Math.clamp(value, 0, 1);
                this._size = Math.max(5 / Math.max(this.height, this.width), this._size);
                this._updateSliders();
            }
        }
    },

    /**
     * @property {Number} numberOfStep - 滚动时，滑块从0到1的步数
     */
    numberOfStep : {
        get : function() { return this._numberOfStep; },
        set : function(value) { this._numberOfStep = value; }
    },

    /**
     * @property {Phaser.Signal} onValueChange - 当滑块值发生变化时的事件
     * @readonly
     */
    onValueChange : {
        get : function() {
            if (!this._onValueChange) {
                this._onValueChange = new Phaser.Signal();
            }
            return this._onValueChange;
        }
    },

    /**
     * @property {Number} stepSize - 滚动时每步改变的值
     */
    stepSize : {
        get : function() {
            return (this.numberOfStep > 1) ? 1.0 / (this.numberOfStep - 1) : 0.1;
        }
    },

    /**
     * @property {boolean} fixSlidersSize - 是否固定滑块大小
     */
    fixSlidersSize : {
        get : function() { return this._fixSlidersSize; },
        set : function(value) { this._fixSlidersSize = value; }
    },

    /**
     * @property {'x'|'y'} _axisPos - 当前滚动条移动方向的位置参数
     * @readonly
     * @private
     */
    _axisPos : {
        get : function() {
            return this.direction === ScrollBar.LEFT_TO_RIGHT || this.direction === ScrollBar.RIGHT_TO_LEFT ?
                'x' : 'y';
        }
    },

    /**
     * @property {'width'|'height'} _axisSize - 当前滚动条移动方向的大小参数
     * @readonly
     * @private
     */
    _axisSize : {
        get : function() {
            return this.direction === ScrollBar.LEFT_TO_RIGHT || this.direction === ScrollBar.RIGHT_TO_LEFT ?
                'width' : 'height';
        }
    },

    /**
     * @property {boolean} reverseValue - 是否是逆向移动
     * @readonly
     * @private
     */
    _reverseValue : {
        get : function() {
            return this.direction === ScrollBar.RIGHT_TO_LEFT || this.direction === ScrollBar.BOTTOM_TO_TOP;
        }
    },

    /**
     * @property {qc.Rectangle} _slidingRect - 滑动区域
     * @readonly
     * @private
     */
    _slidingRect : {
        get : function() {
            if (!this.sliders || !this.sliders.parent)
                return null;
            else
                return this.sliders.parent.rect;
        }
    }
});

/**
 * 获取需要被序列化的信息描述
 * @override
 * @internal
 */
ScrollBar.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.UIImage.prototype.getMeta.call(this);

    json.sliders = s.NODE;
    json.value = s.NUMBER;
    json.size = s.NUMBER;
    json.numberOfStep = s.NUMBER;
    json.direction = s.NUMBER;
    json.fixSlidersSize = s.BOOLEAN;
    return json;
};

/**
 * 析构
 */
ScrollBar.prototype.onDestroy = function() {
    qc.UIImage.prototype.onDestroy.call(this);
    this.sliders = null;
};

/**
 * 设置滚动条方向
 * @param direction {Number} - 滚动条滚动方向
 * @param reLayout {boolean} - 是否重新布局，当滚动轴线变化时，宽高互换
 * @private
 */
ScrollBar.prototype._setDirection = function(direction, reLayout) {
    if (this._direction === direction)
        return;
    var oldAxis = this._axisPos;
    var oldReverse = this._reverseValue;
    this._direction = direction;

    if (reLayout && oldAxis != this._axisPos) {
        var oldWidth = this.width;
        this.width = this.height;
        this.height = oldWidth;
    }
    this._updateSliders();
};

/**
 * 设置当前的值
 * @param input {number} - 需要设置的值
 * @param sendCallBack {boolean} - 是否需要触发事件
 * @private
 */
ScrollBar.prototype._setValue = function(input, sendCallBack) {
    var currValue = this._value;
    this._value = Phaser.Math.clamp(input, 0, 1);

    if (currValue === this.value) {
        return;
    }

    // 更新滑块
    this._updateSliders();

    if (sendCallBack) {
        this.onValueChange.dispatch(this.value);
    }
};

/**
 * 更新完成后处理
 * @method postUpdate
 * @internal
 */
ScrollBar.prototype.postUpdate = function() {
    if (this._isMoveNotDragging) {
        this._doPursued();
    }
};

/**
 * 更新滑块的位置
 * @private
 */
ScrollBar.prototype._updateSliders = function() {
    if (!this._slidingRect) {
        return;
    }
    var minAnchor = new qc.Point(0, 0);
    var maxAnchor = new qc.Point(1, 1);
    var movement = this.value * (1 - this.size);
    var axisPos = this._axisPos;
    if (this._reverseValue) {
        minAnchor[axisPos] = 1 - movement - this.size;
        maxAnchor[axisPos] = 1 - movement;
    }
    else {
        minAnchor[axisPos] = movement;
        maxAnchor[axisPos] = movement + this.size;
    }
    this.sliders.setAnchor(minAnchor, maxAnchor, false);
};

/**
 * 获得滑块在ScrollBar上映射的边界信息
 * @return {qc.Rectangle}
 * @private
 */
ScrollBar.prototype._getSlidersRectInBar = function() {
    var minAnchor = this.sliders.minAnchor;
    var maxAnchor = this.sliders.maxAnchor;
    var slidingRect = this._slidingRect;

    // 先算出滑块在滑动区域上的虚拟滑块位置
    var l = slidingRect.width * minAnchor.x;
    var t = slidingRect.height * minAnchor.y;
    var w = slidingRect.width * (maxAnchor.x - minAnchor.x);
    var h = slidingRect.height * (maxAnchor.y - minAnchor.y);
    // 等比从滑动区域对应到ScrollBar上
    var zoomW = slidingRect.width / this.rect.width;
    var zoomH = slidingRect.height / this.rect.height;
    return new qc.Rectangle(
        this.rect.x + l * zoomW,
        this.rect.y + t * zoomH,
        w * zoomW,
        h * zoomH
    );
};

/**
 * 获得滑块坐标系中的点在ScrollBar上映射的边界信息
 * @param {qc.Point} point - 滑块坐标系中的点
 * @return {qc.point}
 * @private
 */
ScrollBar.prototype._getSlidersPointInBar = function(point) {
    var minAnchor = this.sliders.minAnchor;
    var maxAnchor = this.sliders.maxAnchor;
    var slidingRect = this._slidingRect;
    // 先算出滑块在滑动区域上的虚拟滑块位置
    var slidingZoomW = this.sliders.rect.width / slidingRect.width;
    var slidingZoomH = this.sliders.rect.height / slidingRect.height;

    var x = slidingRect.width * minAnchor.x + point.x * slidingZoomW;
    var y = slidingRect.height * minAnchor.y + point.y * slidingZoomH;

    // 等比从滑动区域对应到ScrollBar上
    var zoomW = slidingRect.width / this.rect.width;
    var zoomH = slidingRect.height / this.rect.height;
    return new qc.Point(
        this.rect.x + x * zoomW,
        this.rect.y + y * zoomH
    );
};

/**
 * 滑块追赶点击位置
 * @private
 */
ScrollBar.prototype._doPursued = function() {
    var slidersRectInBar = this._getSlidersRectInBar();
    var axisPos = this._axisPos;
    var axisSize = this._axisSize;

    if (this._pursuedPoint >= slidersRectInBar[axisPos] &&
        this._pursuedPoint <= slidersRectInBar[axisPos] + slidersRectInBar[axisSize]) {
        this._isMoveNotDragging = false;
        this._offset = this._pursuedPoint - slidersRectInBar[axisPos] - slidersRectInBar[axisSize] / 2;
        this._pursuedPoint = 0;
        this._pursuedType = 0;
        return;
    }
    if ((this._pursuedPoint < slidersRectInBar[axisPos]) ^ this._reverseValue) {
        if (this._pursuedType !== 2) {
            this.value -= this.stepSize;
            this._pursuedType = 1;
        }
    }
    else {
        if (this._pursuedType !== 1) {
            this.value += this.stepSize;
            this._pursuedType = 2;
        }
    }
};

/**
 * 当按下时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.PointerEvent) - 点击事件
 * @private
 */
ScrollBar.prototype._doDown = function(node, event) {
    if (!this.sliders || event.source.eventId != qc.Mouse.BUTTON_LEFT) {
        return;
    }
    var globalPoint = new qc.Point(event.source.x, event.source.y);
    if (!this.sliders.rectContains(globalPoint)) {
        var barPoint = this.toLocal(globalPoint);
        this._isMoveNotDragging = true;
        this._pursuedPoint = barPoint[this._axisPos];
        this._pursuedType = 0;
    }
};

/**
 * 当弹起时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.PointerEvent) - 点击事件
 * @private
 */
ScrollBar.prototype._doUp = function(node, event) {
    this._isMoveNotDragging = false;
};

/**
 * 开始拖拽
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragStartEvent} - 开始拖拽事件
 * @private
 */
ScrollBar.prototype._doDragStart = function(node, event) {
    if (!this.sliders || event.source.eventId != qc.Mouse.BUTTON_LEFT) {
        return;
    }
    this._isMoveNotDragging = false;
    var globalPoint = new qc.Point(event.source.x, event.source.y);
    var barPoint = this.toLocal(globalPoint);
    var slidersRectInBar = this._getSlidersRectInBar();
    var axisPos = this._axisPos;
    var axisSize = this._axisSize;

    // 记录当前点击点距离虚拟滑块中心的位置
    this._offset = barPoint[axisPos] - slidersRectInBar[axisPos] - slidersRectInBar[axisSize] / 2;
};

/**
 * 处理拖拽结束
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEndEvent} - 拖拽结束事件
 * @private
 */
ScrollBar.prototype._doDragEnd = function(node, event) {
    this._isMoveNotDragging = false;
};

/**
 * 处理拖拽事件
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEvent} - 拖拽结束事件
 * @private
 */
ScrollBar.prototype._doDrag = function(node, event) {
    if (!this.sliders || event.source.eventId != qc.Mouse.BUTTON_LEFT) {
        return;
    }
    var globalPoint = new qc.Point(event.source.x, event.source.y);
    var barPoint = this.toLocal(globalPoint);
    var slidersRectInBar = this._getSlidersRectInBar();
    var axisPos = this._axisPos;
    var axisSize = this._axisSize;

    // 计算当前状态下虚拟滑块到边界的距离
    var distance = barPoint[axisPos] - this._offset - this.rect[axisPos] - slidersRectInBar[axisSize] / 2;
    var remainingSize = this.rect[axisSize] * (1 - this.size);
    switch(this.direction) {
        case ScrollBar.LEFT_TO_RIGHT:
        case ScrollBar.TOP_TO_BOTTOM:
            this._setValue(distance / remainingSize, true);
            break;
        case ScrollBar.RIGHT_TO_LEFT:
        case ScrollBar.BOTTOM_TO_TOP:
            this._setValue(1 - distance / remainingSize, true);
            break;
    }
};

/**
 * 滚动条滚动时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.WheelEvent} - 拖拽结束事件
 * @private
 */
ScrollBar.prototype._doWheel = function(node, event) {
    if (!this.sliders) {
        return;
    }

    var movement = event.source['delta' + this._axisPos.toUpperCase()];
    var value = this.value;
    value += (this._reverseValue ? -1 : 1) * Math.sign(movement) * this.stepSize;
    this._setValue(value, true);
};

/**
 * 水平方向滚动，左端为0，右端为1
 * @constant
 * @type {integer}
 */
ScrollBar.LEFT_TO_RIGHT = 0;

/**
 * 水平方向滚动，左端为1，右端为0
 * @constant
 * @type {integer}
 */
ScrollBar.RIGHT_TO_LEFT = 1;

/**
 * 竖直方向滚动，顶端为0，底端为1
 * @constant
 * @type {integer}
 */
ScrollBar.TOP_TO_BOTTOM = 2;

/**
 * 竖直方向滚动，顶端为1，底端为0
 * @constant
 * @type {integer}
 */
ScrollBar.BOTTOM_TO_TOP = 3;