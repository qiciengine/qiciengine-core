/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 进度条控件
 * 用于显示进度，分为确定类型和不确定类型
 * 确定类型：基于值的填充模式，可以确定当前的进度值
 * 不确定类型：重复循环播放
 * 显示类型又分为水平进度条，竖直进度条和圆形进度条，
 * @class qc.ProgressBar
 * @param {qc.Game} game - 游戏对象
 * @param {qc.Node | null} parent - 父亲节点
 * @param {boolean} - 是否是反序列化创建
 * @constructor
 */
var ProgressBar = qc.ProgressBar = function(game, parent, uuid) {
    qc.UIImage.call(this, game, parent, uuid);

    /**
     * @property {string} name - 控件名字
     */
    this.name = 'ProgressBar';

    // 设置默认值
    this.style = ProgressBar.STYLE_HORIZONTAL;
    this.value = 0;
    this.minValue = 0;
    this.maxValue = 1;
    this.indeterminable = false;
    this.loopTime = 3000;
    this.numberOfStep = 0;
    this.fixedSize = -1;
    this._canSlideOut = true;
    this.clipSliders = false;
    this.showMode = ProgressBar.SHOW_PROCESSED;
    this.reverse = false;
};
ProgressBar.prototype = Object.create(qc.UIImage.prototype);
ProgressBar.prototype.constructor = ProgressBar;

Object.defineProperties(ProgressBar.prototype, {
    /**
     * @property {string} class - 类名
     * @readonly
     * @internal
     */
    class : {
        get : function() { return 'qc.ProgressBar'; }
    },

    /**
     * @property {Number} style - 显示样式，STYLE_HORIZONTAL 水平进度条，STYLE_VERTICAL 竖直进度条，STYLE_CIRCLE 圆形进度条
     */
    style : {
        get : function() { return this._style; },
        set : function(value) {
            this._setStyle(value);
        }
    },

    /**
     * @property {qc.Node} sliders - 滑块，用来表示进度
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
     * @property {boolean} indeterminable - 是否是不确定类型，如果无法明确知道进度或者结束值，则使用不确定类型，进度条将循环播放
     * 对于水平进度条，不确定状态为一截滑块，在进度条中循环水平滑动
     * 对于竖直进度条，不确定状态为一截滑块，在进度条中循环竖直滑动
     * 对于圆形进度条，不确定状态下，滑块区域将进行循环旋转
     */
    indeterminable : {
        get : function() { return this._indeterminable; },
        set : function(value) {
            this._indeterminable = value;
        }
    },

    /**
     * @property {Number} minValue - 当前进度条的最小值
     */
    minValue : {
        get : function() { return (isNaN(this._minValue) || this._minValue === null) ? 0 : this._minValue; },
        set : function(value) { this.setMinMax(value); }
    },

    /**
     * @property {Number} maxValue - 当前进度条的最大值
     */
    maxValue : {
        get : function() { return (isNaN(this._maxValue) || this._maxValue === null) ? 1 : this._maxValue; },
        set : function(value) { this.setMinMax(null, value); }
    },

    /**
     * @property {Number} length - 当前进度条的长度，maxValue - minValue
     */
    length : {
        get : function() { return this.maxValue - this.minValue; }
    },

    /**
     * @property {Number} value - 显示用的进度值，将进度值转化为步进值的倍数
     * @readonly
     * @private
     */
    stepValue : {
        get : function() {
            var stepSize = this.stepSize;
            if (stepSize > 0) {
                return this.minValue + Math.round((this.value - this.minValue) / stepSize) * stepSize;
            }
            else {
                return this.value;
            }
        },
        set : function (value) {
            var stepSize = this.stepSize;
            if (stepSize > 0) {
                this._setValue(this.minValue + Math.round((value - this.minValue) / stepSize) * stepSize, true);
            }
            else {
                this._setValue(value);
            }
        }
    },

    /**
     * @property {Number} value - 当前实际进度值,[minValue, maxValue]
     */
    value : {
        get : function() { return this._value || 0; },
        set : function(value) {
            if (value !== this._value) {
                this._setValue(value, true);
            }
        }
    },

    /**
     * @property {Number} loopTime - 循环时间，仅当indeterminable为true时有效，单位毫秒
     */
    loopTime : {
        get : function() { return this._loopTime; },
        set : function(value) { this._loopTime = value; }
    },

    /**
     * @property {Number} numberOfStep - 在循环播放时，从0到max的步数，仅当indeterminable为true时有效, 小于等于0时，按实际值显示
     */
    numberOfStep : {
        get : function() { return this._numberOfStep; },
        set : function(value) { this._numberOfStep = value; }
    },

    /**
     * @property {Number} stepSize - 步进距离
     */
    stepSize : {
        get : function() {
            if (this.numberOfStep > 1) {
                return this.length / (this.numberOfStep - 1)
            }
            else if (this.style === ProgressBar.STYLE_CIRCLE) {
                return this.length / 360;
            }
            else if (this.style === ProgressBar.STYLE_HORIZONTAL) {
                return this.length / (this._slidingRect ? this._slidingRect.width : this.width);
            }
            else {
                return this.length / (this._slidingRect ? this._slidingRect.height : this.height);
            }
        }
    },

    /**
     * @property {Number} fixedSize - 循环播放时的固定大小，值为占进度条 区域的百分比，1为整个区域, < 0 时表示不限制大小
     */
    fixedSize : {
        get : function() { return this._fixedSize; },
        set : function(value) { 
            if (this._fixedSize === value) {
                return;
            }
            this._fixedSize = value; 
            // 更新
            this._updateSliders();
        }
    },

    /**
     * @property {Phaser.Signal} onValueChange - 当进度值发生变化时的事件
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
     * @property {boolean} clipSliders - 是否裁切滑块
     */
    clipSliders : {
        get : function() {
            if (!this.sliders) {
                return false;
            }
            var mask = this.sliders.getScript(qc.NodeMask);
            return mask && mask.enable;
        },
        set : function(value) {
            this._setClipSliders(value);
        }
    },

    /**
     * @property {Number} showMode - 显示模式，显示进度部分还是显示剩余部分
     */
    showMode : {
        get : function() { return this._showMode; },
        set : function(value) {
            this._setShowMode(value);
        }
    },

    /**
     * @property {boolean} reverse - 反向显示
     */
    reverse : {
        get : function() { return this._reverse; },
        set : function(value) {
            this._reverse = value;
            this._updateSliders();
        }
    },

    /**
     * @property {Number} startRadian - 开始的弧度，仅当style === STYLE_CIRCLE时有效
     */
    startRadian : {
        get : function() { return this._startRadian|| 0; },
        set : function(value) {
            this.setCircleScope(value);
        }
    },

    /**
     * @property {Number} endRadian -  结束的弧度，仅当style === STYLE_CIRCLE时有效，endRadian > startRadian && endRadian <= startRadian + Math.PI * 2
     */
    endRadian : {
        get : function() { return this._endRadian || Math.PI * 2; },
        set : function(value) {
            this.setCircleScope(null, value);
        }
    },

    /**
     * @property {Number} startAngle - 开始的角度，仅当style === STYLE_CIRCLE时有效
     */
    startAngle : {
        get : function() { return this.startRadian * 180 / Math.PI; },
        set : function(value) {
            this.setCircleAngle(value);
        }
    },

    /**
     * @property {Number} endAngle -  结束的角度，仅当style === STYLE_CIRCLE时有效，endRadian > startRadian && endRadian <= startRadian + Math.PI * 2
     */
    endAngle : {
        get : function() { return this.endRadian * 180 / Math.PI; },
        set : function(value) {
            this.setCircleAngle(null, value);
        }
    },

    /**
     * @property {Number} showRadian - 当前显示的弧度
     */
    showRadian : {
        get : function() { return this.endRadian - this.startRadian; }
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
    },

    /**
     * @property {'x'|'y'|'rotation'} _axisPos - 当前滚动条移动方向的位置参数
     * @readonly
     * @private
     */
    _axisPos : {
        get : function() {
            return this.style === ProgressBar.STYLE_CIRCLE ?
                'rotation' : (this.style === ProgressBar.STYLE_HORIZONTAL ? 'x' : 'y');
        }
    },

    /**
     * @property {'width'|'height'} _axisSize - 当前滚动条移动方向的大小参数
     * @readonly
     * @private
     */
    _axisSize : {
        get : function() {
            return this.style === ProgressBar.STYLE_CIRCLE ?
                'rotation' : (this.style === ProgressBar.STYLE_HORIZONTAL ? 'width' : 'height');
        }
    }
});

/**
 * 获取需要被序列化的信息描述
 * @override
 * @internal
 */
ProgressBar.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.UIImage.prototype.getMeta.call(this);
    json.style = qc.Serializer.NUMBER;
    json.sliders = qc.Serializer.NODE;
    json._minValue = qc.Serializer.NUMBER;
    json._maxValue = qc.Serializer.NUMBER;
    json.value = qc.Serializer.NUMBER;
    json._startRadian = qc.Serializer.NUMBER;
    json._endRadian = qc.Serializer.NUMBER;
    json.indeterminable = qc.Serializer.BOOLEAN;
    json.loopTime = qc.Serializer.NUMBER;
    json.numberOfStep = qc.Serializer.NUMBER;
    json.fixedSize = qc.Serializer.NUMBER;
    json.clipSliders = qc.Serializer.BOOLEAN;
    json.showMode = qc.Serializer.NUMBER;
    json.reverse = qc.Serializer.NUMBER;
    return json;
};

/**
 * 析构
 */
ProgressBar.prototype.onDestroy = function() {
    qc.UIImage.prototype.onDestroy.call(this);
    this.sliders = null;
};

/**
 * 重置滑块信息
 * @private
 */
ProgressBar.prototype._resetSliders = function() {
    if (!this.sliders) {
        return;
    }
    this.sliders.rotation = 0;
    this.sliders.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1), false);
    var mask = this.sliders.getScript(qc.NodeMask);
    if (mask) {
        mask.setMask(new qc.Point(0, 0), new qc.Point(1, 1), 0, Math.PI * 2);
    }
};

/**
 * 设置当前的显示样式
 * @param style {Number} - 显示的样式
 * @private
 */
ProgressBar.prototype._setStyle = function(style) {
    if (this._style === style)
        return;

    this._style = style;
    this._resetSliders();
    this._updateSliders();
};

/**
 * 裁切模式
 * @param clip {boolean} - 是否对进度条滑块进行裁切
 * @private
 */
ProgressBar.prototype._setClipSliders = function(clip) {
    if (this.clipSliders === clip)
        return;

    if (this.sliders) {
        this._resetSliders();
        var mask = this.sliders.getScript(qc.NodeMask);
        if (!mask && clip) {
            mask = this.sliders.addScript('qc.NodeMask');
        }
        if (mask) {
            mask.enable = clip;
        }
    }

    this._updateSliders();
};

/**
 * 设置进度条的显示模式，
 * @param mode {Number} - 显示方式，滑块用来表示已经经过的部分还是表示未经过的部分
 * @private
 */
ProgressBar.prototype._setShowMode = function(mode) {
    if (this._showMode === mode) {
        return;
    }
    this._showMode = mode;
    if (this.sliders) {
        this._resetSliders();
    }
    this._updateSliders();
};

/**
 * 更新值
 */
ProgressBar.prototype.update = function() {
    if (this._indeterminable) {
        this._processIndeterminable();
    }
};

/**
 * 设置最大最小值
 * @param min {Number} - 最小值
 * @param max {Number} - 最大值
 */
ProgressBar.prototype.setMinMax = function(min, max) {
    min = typeof min === 'undefined' || min === null ? this.minValue : min;
    max = typeof max === 'undefined' || max === null ? this.maxValue : max;
    if (min >= max) {
        throw new Error('Expected:min < max');
    }
    this._minValue = min;
    this._maxValue = max;
    this._setValue(this.value, true);
};

/**
 * 设置旋转显示时的起始结束角度
 * @param start {Number} - 起始弧度
 * @param end {Number} - 结束弧度
 */
ProgressBar.prototype.setCircleScope = function(start, end) {
    start = typeof start === 'undefined' || start === null ? this.startRadian : start;
    end = typeof end === 'undefined' || end === null ? this.endRadian : end;
    if (start >= end || end > start + Math.PI * 2) {
        throw new Error('Expected:start < end and end <= 2*PI + start');
    }
    this._startRadian = start;
    this._endRadian = end;

    // 更新
    this._updateSliders();
};

/**
 * 设置旋转显示时的起始结束角度
 * @param start {Number} - 起始角度
 * @param end {Number} - 结束角度
 */
ProgressBar.prototype.setCircleAngle = function(start, end) {
    start = typeof start === 'undefined' || start === null ? this.startAngle : start;
    end = typeof end === 'undefined' || end === null ? this.endAngle : end;
    if (start >= end || end > start + 360) {
        throw new Error('Expected:start < end and end <= 360 + start');
    }
    this._startRadian = start * Math.PI / 180;
    this._endRadian = end * Math.PI / 180;

    // 更新
    this._updateSliders();
};

/**
 * 设置当前的进度值
 * @param value {Number} - 当前的进度值
 * @param notify {boolean} - 是否通知值改变
 * @private
 */
ProgressBar.prototype._setValue = function(value, notify) {
    var currValue = this.stepValue;
    this._value = Phaser.Math.clamp(value, this.minValue, this.maxValue);

    if (currValue !== this.stepValue) {
        // 更新
        this._updateSliders();
    }

    if (notify) {
        this.onValueChange.dispatch(this.value);
    }
};

/**
 * 不确定模式下的进度调整
 * @private
 */
ProgressBar.prototype._processIndeterminable = function() {
    this._loopValue = this._loopValue || this.value;
    this._loopValue += this.length * this.game.time.deltaTime / this.loopTime;
    if (this._loopValue > this.maxValue + this.stepSize) {
        this._loopValue = this.minValue;
    }
    this.value = this._loopValue;
};

/**
 * 更新滑块的信息
 * @private
 */
ProgressBar.prototype._updateSliders = function() {
    if (!this._slidingRect) {
        return;
    }

    var mask = this.sliders.getScript(qc.NodeMask);
    var value = (this.stepValue - this.minValue) / this.length;
    if (this.reverse) {
        value = 1 - value;
    }
    if (!this.clipSliders || !mask) {
        switch (this.style) {
        case ProgressBar.STYLE_HORIZONTAL:
        case ProgressBar.STYLE_VERTICAL:
            // 滑动时的实际区域为 1 + this.fixedSize
            var minAnchor = new qc.Point(0, 0);
            var maxAnchor = new qc.Point(1, 1);
            var axisPos = this._axisPos;
            if (this.fixedSize >= 0) {
                if (this._canSlideOut) {
                    value *= 1 + this.fixedSize;
                    // fixedSize模式下，没有SHOW_REMAINED模式
                    maxAnchor[axisPos] = Math.min(1, value);
                    minAnchor[axisPos] = Math.max(0, value - this.fixedSize - 0.00001);
                }
                else {
                    value *= 1 - this.fixedSize;
                    minAnchor[axisPos] = Math.max(0, value);
                    maxAnchor[axisPos] = Math.min(1, value + this.fixedSize + 0.00001);
                }
            }
            else {
                if (this.showMode === ProgressBar.SHOW_PROCESSED) {
                    maxAnchor[axisPos] = Math.max(0.00001, Math.min(1, value));
                }
                else {
                    minAnchor[axisPos] = Math.min(1 - 0.00001, value);
                }
            }
            this.sliders.setAnchor(minAnchor, maxAnchor, false);

            break;
        case ProgressBar.STYLE_CIRCLE:
            // 滚动
            // 滑动模式下，没有SHOW_REMAINED模式
            this.sliders.rotation = value * this.showRadian + this.startRadian;
            break;
        }
    }
    else {
        switch (this.style) {
        case ProgressBar.STYLE_HORIZONTAL:
        case ProgressBar.STYLE_VERTICAL:
            // 滑动
            var minAnchor = new qc.Point(0, 0);
            var maxAnchor = new qc.Point(1, 1);
            var axisPos = this._axisPos;
            if (this.fixedSize >= 0) {
                if (this._canSlideOut) {
                    value *= 1 + this.fixedSize;
                    // fixedSize模式下，没有SHOW_REMAINED模式
                    maxAnchor[axisPos] = Math.min(1, value);
                    minAnchor[axisPos] = Math.max(0, value - this.fixedSize - 0.00001);
                }
                else {
                    value *= 1 - this.fixedSize;
                    minAnchor[axisPos] = Math.max(0, value);
                    maxAnchor[axisPos] = Math.min(1, value + this.fixedSize + 0.00001);
                }
            }
            else {
                if (this.showMode === ProgressBar.SHOW_PROCESSED) {
                    maxAnchor[axisPos] = Math.min(1, value);
                }
                else {
                    minAnchor[axisPos] = Math.min(1, value);
                }
            }
            mask.setMask(minAnchor, maxAnchor);
            break;
        case ProgressBar.STYLE_CIRCLE:
            // 滚动
            if (this.fixedSize >= 0) {
                var minRotation = this.startRadian + (value - this.fixedSize) * this.showRadian ;
                var maxRotation = this.startRadian + value * this.showRadian;
                if (this.showMode === ProgressBar.SHOW_REMAINED && this.showRadian === Math.PI * 2) {
                    var tempMin = maxRotation;
                    maxRotation = minRotation + Math.PI * 2;
                    minRotation = tempMin;
                }
                mask.setMask(null, null, minRotation, maxRotation);
            }
            else {
                var minRotation = -Math.PI / 2 + this.startRadian;
                var maxRotation = -Math.PI / 2 + this.endRadian;
                if (this.showMode === ProgressBar.SHOW_PROCESSED) {
                    maxRotation = minRotation + value * this.showRadian;
                }
                else {
                    minRotation = minRotation + value * this.showRadian;
                }
                mask.setMask(null, null, minRotation, maxRotation);
            }
            break;
        }
    }
};

/**
 * 水平进度条
 * @constant
 * @type {number}
 */
ProgressBar.STYLE_HORIZONTAL = 0;

/**
 * 竖直进度条
 * @constant
 * @type {number}
 */
ProgressBar.STYLE_VERTICAL = 1;

/**
 * 圆形进度条
 * @constant
 * @type {number}
 */
ProgressBar.STYLE_CIRCLE = 2;

/**
 * 显示进行了的部分
 * @constant
 * @type {number}
 */
ProgressBar.SHOW_PROCESSED = 0;

/**
 * 显示剩余的部分
 * @constant
 * @type {number}
 */
ProgressBar.SHOW_REMAINED = 1;