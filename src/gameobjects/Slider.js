/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 滑动条控件，继承qc.ProgressBar
 * @class qc.Slider
 * @param {qc.Game} game - 游戏对象
 * @param {qc.Node | null} parent - 父亲节点
 * @constructor
 */
var Slider = qc.Slider = function(game, parent, uuid) {
    qc.ProgressBar.call(this, game, parent, uuid);

    /**
     * @property {string} name - 控件默认名字
     */
    this.name = 'Slider';

    this.canPursue = true;
    this._canSlideOut = false;

    // 监听滚动事件和拖拽事件
    this.onWheel.add(this._doWheel, this);
    this.onDown.add(this._doDown, this);
    this.onUp.add(this._doUp, this);
    this.onDragStart.add(this._doDragStart, this);
    this.onDrag.add(this._doDrag, this);
    this.onDragEnd.add(this._doDragEnd, this);

    var restore = uuid !== undefined;
    if (restore !== true) {
        // 初始状态为默认状态
        this.state = qc.UIState.NORMAL;
        // 挂载交互效果脚本
        var behaviour = this.addScript('qc.TransitionBehaviour');
        behaviour.target = this.sliders;
        behaviour.transition = qc.Transition.TEXTURE_SWAP;
    }
};
Slider.prototype = Object.create(qc.ProgressBar.prototype);
Slider.prototype.constructor = Slider;

Object.defineProperties(Slider.prototype, {
    /**
     * @property {number} state - 滑块的状态
     */
    state : {
        get : function()  { return this._state || qc.UIState.NORMAL; },
        set : function(v) {
            if (this.state === v) return;
            this._state = v;
            if (this._onStateChange) {
                this._onStateChange.dispatch();
            }
        }
    },

    /**
     * @property {qc.Node} sliders - 滑块，用来表示进度
     * @override
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

            // 改变交互对象目标
            var behaviour = this.getScript('qc.TransitionBehaviour');
            if (behaviour) {
                behaviour.target = value ? value : this;
            }

            this._updateSliders();
        }
    },

    /**
     * @property {qc.Signal} onStateChanged - 状态发生变化的事件
     */
    onStateChange : {
        get : function() {
            if (!this._onStateChange) {
                this._onStateChange = new qc.Signal();
            }
            return this._onStateChange;
        }
    },

    /**
     * @property {string} class - 类名
     * @readonly
     * @internal
     */
    class : {
        get: function () {
            return 'qc.Slider';
        }
    },

    /**
     * @property canPursue {boolean} - 是否允许滑块追赶点击位置
     */
    canPursue : {
        get : function() { return this._canPursue; },
        set : function(value) { this._canPursue = value; }
    },

    /**
     * 是否允许交互，默认为false，控制onDown/onUp/onClick等事件
     *
     * @property {boolean} interactive
     * @override
     */
    'interactive': {
        get: function() {
            return this._interactive;
        },
        set: function(v) {
            this._interactive = v;
            if (this._onInteractive) {
                this._onInteractive.dispatch();
            }
            this.state = this.interactive ? qc.UIState.NORMAL : qc.UIState.DISABLED;
        }
    }
});

/**
 * 获取需要被序列化的信息描述
 * @override
 * @internal
 */
Slider.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.ProgressBar.prototype.getMeta.call(this);
    json.canPursue = qc.Serializer.BOOLEAN;
    return json;
};


/**
 * 更新值
 */
Slider.prototype.update = function() {
    qc.ProgressBar.prototype.update.call(this);
    if (this._isMoveNotDragging && this._canPursue) {
        this._doPursued();
    }
};

/**
 * 设置当前的显示样式
 * @param style {Number} - 显示的样式
 * @private
 * @override
 */
Slider.prototype._setStyle = function(style) {
    qc.ProgressBar.prototype._setStyle.call(this, style);
    this.fixedSize = style === Slider.STYLE_CIRCLE ? 0 : -1;
};

/**
 * 计算点当前对应的值
 * @param {qc.Point} barPoint - 在滑块区域的位置
 * @param {qc.Point} isDrag -  是否是拖拽中
 * @return {Number}
 * @private
 */
Slider.prototype._calcPointValue = function(barPoint, isDrag) {
    var value = 0;
    var rect = this.rect;
    switch (this.style) {
    case Slider.STYLE_HORIZONTAL:
    case Slider.STYLE_VERTICAL:
        value = this.minValue + (barPoint[this._axisPos] - rect[this._axisPos]) * this.length / rect[this._axisSize];
        break;
    case Slider.STYLE_CIRCLE:
        var PI2 = 2 * Math.PI;
        var tmp = Math.atan2(barPoint.x - rect.centerX, rect.centerY - barPoint.y);
        if (tmp < 0) {
            tmp += PI2;
        }
        if (isDrag) {
            if (typeof this._tempDragAngle === 'undefined' || this._tempDragAngle === null) {
                this._tempDragAngle = tmp;
                this._recordDragAngle = tmp;
            }
            else {
                var diff = tmp - this._tempDragAngle;
                this._tempDragAngle = tmp;
                if (Math.abs(diff) > Math.PI) {
                    diff = Phaser.Math.sign(diff) * (PI2 - Math.abs(diff));
                }

                this._recordDragAngle += diff;
                tmp = this._recordDragAngle;
            }
        }
        value = this.minValue + (tmp - this.startRadian) * this.length / this.showRadian;
        break;
    }
    if (this.reverse) {
        value = this.maxValue - value + this.minValue;
    }
    return value;
};

/**
 * 滚动条滚动时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.WheelEvent} - 拖拽结束事件
 * @private
 */
Slider.prototype._doWheel = function(node, event) {
    if (!this.sliders) {
        return;
    }

    var movement = Math.abs(event.source.deltaX) >= Math.abs(event.source.deltaY) ?
        event.source.deltaX : event.source.deltaY;
    var value = this.value;
    value += (this.reverse ? -1 : 1) * Math.sign(movement) * this.stepSize;
    this.value = value;
};

/**
 * 当按下时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.PointerEvent) - 点击事件
 * @private
 */
Slider.prototype._doDown = function(node, event) {
    if (!this.sliders || event.source.eventId != qc.Mouse.BUTTON_LEFT) {
        return;
    }
    this.state = qc.UIState.PRESSED;
    // 记录记录的拖拽角度信息
    this._tempDragAngle = null;
    this._recordDragAngle = null;

    var globalPoint = new qc.Point(event.source.x, event.source.y);
    if (!this.sliders.rectContains(globalPoint) || this.fixedSize < 0) {
        var barPoint = this.toLocal(globalPoint);
        this._isMoveNotDragging = true;
        this._pursuedPoint = this._calcPointValue(barPoint);
        this._pursuedType = 0;
    }
};

/**
 * 当弹起时
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.PointerEvent) - 点击事件
 * @private
 */
Slider.prototype._doUp = function(node, event) {
    this._isMoveNotDragging = false;
    if (this.state === qc.UIState.PRESSED) {
        this.state = qc.UIState.NORMAL;
    }
};

/**
 * 开始拖拽
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragStartEvent} - 开始拖拽事件
 * @private
 */
Slider.prototype._doDragStart = function(node, event) {
    if (!this.sliders || event.source.eventId != qc.Mouse.BUTTON_LEFT) {
        return;
    }

    this.state = qc.UIState.PRESSED;
    this._isMoveNotDragging = false;
    var globalPoint = new qc.Point(event.source.x, event.source.y);
    var barPoint = this.toLocal(globalPoint);
    // 记录当前点击点距离虚拟滑块中心的位置
    this._offset = this._calcPointValue(barPoint, true) - this.value;
};

/**
 * 处理拖拽结束
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEndEvent} - 拖拽结束事件
 * @private
 */
Slider.prototype._doDragEnd = function(node, event) {
    this._isMoveNotDragging = false;
    this._tempDragAngle = null;
    this._recordDragAngle = null;
    if (this.state === qc.UIState.PRESSED) {
        this.state = qc.UIState.NORMAL;
    }
};

/**
 * 处理拖拽事件
 * @param node {qc.Node} - 事件发生的节点
 * @param event {qc.DragEvent} - 拖拽结束事件
 * @private
 */
Slider.prototype._doDrag = function(node, event) {
    if (!this.sliders || event.source.eventId != qc.Mouse.BUTTON_LEFT) {
        return;
    }
    var globalPoint = new qc.Point(event.source.x, event.source.y);
    var barPoint = this.toLocal(globalPoint);
    var nowValue = this._calcPointValue(barPoint, true) - this._offset;
    this._setValue(nowValue, true);
};

/**
 * 滑块追赶点击位置
 * @private
 */
Slider.prototype._doPursued = function() {
    var stepSize = this.stepSize;
    var loop = Math.max(1, Math.ceil(this.length / 10 / stepSize));
    while (loop--) {
        if (this._pursuedPoint >= this.value &&
            this._pursuedPoint <= this.value + stepSize) {
            this._isMoveNotDragging = false;
            this._offset = this._pursuedPoint - this.value;
            this._pursuedPoint = 0;
            this._pursuedType = 0;
            return;
        }

        if ((this._pursuedPoint < this.value) ^ this.reverse) {
            if (this._pursuedType !== 2) {
                this.value -= stepSize;
                this._pursuedType = 1;
            }
        }
        else {
            if (this._pursuedType !== 1) {
                this.value += stepSize;
                this._pursuedType = 2;
            }
        }
    }
};

/**
 * 水平进度条
 * @constant
 * @type {number}
 */
Slider.STYLE_HORIZONTAL = qc.ProgressBar.STYLE_HORIZONTAL;

/**
 * 竖直进度条
 * @constant
 * @type {number}
 */
Slider.STYLE_VERTICAL = qc.ProgressBar.STYLE_VERTICAL;

/**
 * 圆形进度条
 * @constant
 * @type {number}
 */
Slider.STYLE_CIRCLE = qc.ProgressBar.STYLE_CIRCLE;

/**
 * 显示进行了的部分
 * @constant
 * @type {number}
 */
Slider.SHOW_PROCESSED = qc.ProgressBar.SHOW_PROCESSED;

/**
 * 显示剩余的部分
 * @constant
 * @type {number}
 */
Slider.SHOW_REMAINED = qc.ProgressBar.SHOW_REMAINED;
