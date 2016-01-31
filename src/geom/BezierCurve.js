/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 曲线的关键帧
 * @class qc.Keyframe
 * @param {number} time - 时间点
 * @param {number} value - 值
 * @param {number | null} inTangent - 进入角度的 Tangent 值
 * @param {number | null} outTangent - 出发角度的 Tangent 值
 */
var Keyframe = qc.Keyframe = function(time, value, inTangent, outTangent){
    /**
     * @property {number} time - 帧所在时间点
     */
    this.time = time;
    /**
     * @property {number}
     */
    this.value = value;
    /**
     * @property {number} type - 当前关键帧的类型
     * @type {number}
     */
    this.type = Keyframe.FREE_SMOOTH;

    this.inTangent = isNaN(inTangent) ? 0 : inTangent;
    this.outTangent = isNaN(outTangent) ? 0 : outTangent;
};
Keyframe.prototype = {};
Keyframe.prototype.constructor = Keyframe;

Keyframe.prototype.clone = function() {
    var other = new Keyframe(this.time, this.value, this.inTangent, this.outTangent);
    other.type = this.type;
    return other;
};

/**
 * 自动
 * @constant
 * @type {number}
 */
Keyframe.AUTO = 0;
/**
 * 平滑
 * @constant
 * @type {number}
 */
Keyframe.FREE_SMOOTH = 1;
/**
 * 水平
 * @constant
 * @type {number}
 */
Keyframe.FLAT = 2;
/**
 * 破裂
 * @constant
 * @type {number}
 */
Keyframe.BROKEN = 3;
/**
 * 线性
 * @constant
 * @type {number}
 */
Keyframe.LINEAR = 4;

Keyframe.InfinityValue = Math.tan(Math.PI / 2);

Object.defineProperties(Keyframe.prototype, {
    /**
     * @property {number} inAngle - 进入角度
     */
    inAngle : {
        get : function() {
            return Math.atan(this.inTangent);
        },
        set : function(v) {
            this.inTangent = Math.tan(v * Math.PI / 180);
        }
    },
    /**
     * @property {number} outAngle - 离开角度
     */
    outAngle : {
        get : function() {
            return Math.atan(this.outTangent);
        },
        set : function(v) {
            this.outTangent = Math.tan(v * Math.PI / 180);
        }
    },

    /**
     * 曲线进入角度的 tangent 值
     * @type {number}
     */
    inTangent : {
        get : function() { return this._inTangent || 0; },
        set : function(v) {
            // 因为 Math.PI 的精度问题，如果设置值为Math.tan(Math.PI/2)则设置为Infinity
            this._inTangent = (Math.abs(v) === Keyframe.InfinityValue) ? ((v < 0 ? -1 : 1) * Infinity) : v;
        }
    },

    /**
     * 曲线出发角度的 tangent 值
     * @type {number}
     */
    outTangent : {
        get : function() { return this._outTangent || 0; },
        set : function(v) {
            // 因为 Math.PI 的精度问题，如果设置值为Math.tan(Math.PI/2)则设置为Infinity
            this._outTangent = (Math.abs(v) === Keyframe.InfinityValue) ? ((v < 0 ? -1 : 1) * Infinity) : v;
        }
    },

    /**
     * @property {boolean} isFlat - 是否是平坦的
     */
    isFlat : {
        get : function() {
            return this.inTangent === this.outTangent && this.outTangent === 0;
        }
    },

    /**
     * @property {boolean} isBroken - 进入角度和离开角度不是平滑的
     */
    isBroken : {
        get : function() {
            return this.inTangent !== this.outTangent;
        }
    }
});

/**
 * 动画曲线
 * 提供三次方贝兹曲线
 * @class qc.BezierCurve
 */
var BezierCurve = qc.BezierCurve = function(keys) {

    /**
     * 记录帧
     * @type {[qc.Keyframe]}
     * @private
     */
    this._keys = [];

    // 添加帧
    if (Array.isArray(keys)) {
        for (var idx in keys) {
            this.addKey(keys[idx]);
        }
    }
    else {
        for (var idx = 0; idx < arguments.length; ++idx) {
            this.addKey(arguments[idx]);
        }
    }
};

BezierCurve.prototype = {};
BezierCurve.prototype.constructor = BezierCurve;

Object.defineProperties(BezierCurve.prototype, {
    /**
     * @property {string}
     */
    class : {
        get : function() { return 'qc.BezierCurve'; }
    },

    /**
     * @property {[qc.Keyframe]} keys - 所有的帧,
     * @readonly
     */
    keys : {
        get : function() { return this._keys; },
        set : function(keys) {
            this._keys = [];

            for (var idx in keys) {
                this.addKey(keys[idx]);
            }
        }
    },

    /**
     * @property {number} length - 包含的帧数量
     */
    length : {
        get : function() { return this._keys.length; }
    },
    /**
     * @property {number} startTime - 曲线开始的时间
     */
    startTime : {
        get : function() {
            if (!this.keys || !this.keys.length)
                return 0;
            else
                return this.keys[0].time;
        }
    },
    /**
     * @property {number} endTime - 曲线结束的时间
     */
    endTime : {
        get : function() {
            if (!this.keys || !this.keys.length)
                return 0;
            else
                return this.keys[this.keys.length - 1].time;
        }
    },
    /**
     * @property {number} totalTime - 曲线经历的时间
     */
    totalTime : {
        get : function() {
            if (!this.keys || !this.keys.length)
                return 0;
            else
                return this.keys[this.keys.length - 1].time - this.keys[0].time;
        }
    },

    /**
     * @property {number} postWrapMode - 延续下去的类型
     */
    postWrapMode : {
        get : function() { return isNaN(this._postWrapMode) ? BezierCurve.WRAP_CLAMP : this._postWrapMode; },
        set : function (v) {
            this._postWrapMode = v;
        }
    },
    /**
     * @property {number} preWrapMode - 延续进来的类型
     */
    preWrapMode : {
        get : function() { return isNaN(this._preWrapMode) ? BezierCurve.WRAP_CLAMP : this._preWrapMode; },
        set : function(v) {
            this._preWrapMode = v;
        }
    }
});

/**
 * 序列化
 */
BezierCurve.prototype.toJson = function() {
    var jsonData = [];
    for (var idx = 0; idx < this._keys.length; ++idx) {
        jsonData.push([this._keys[idx].time, this._keys[idx].value,
            this._keys[idx].inTangent === Infinity ? 'Infinity' : this._keys[idx].inTangent,
            this._keys[idx].outTangent === Infinity ? 'Infinity' : this._keys[idx].outTangent]);
    }
    jsonData.push([this.preWrapMode, this.postWrapMode]);
    return jsonData;
};

/**
 * 反序列化
 */
BezierCurve.prototype.fromJson = function(v) {
    for (var idx = 0; idx < v.length; ++idx) {
        if (v[idx].length === 4) {
            this.addKey(v[idx][0], v[idx][1],
                v[idx][2] === 'Infinity' ? Infinity : v[idx][2],
                v[idx][3] === 'Infinity' ? Infinity : v[idx][3])
        }
    }

    if (v[v.length - 1].length === 2) {
        this.preWrapMode = v[v.length - 1][0];
        this.postWrapMode = v[v.length - 1][1];
    }
};

/**
 * 如果在外部修改了节点，需要调用 restore 进行处理
 */
BezierCurve.prototype.sort = function() {
    this._keys.sort(function(a, b){
        return a.time - b.time;
    });
};

/**
 * 添加一帧，如果已经存在相同时间点的帧，则替换
 * @param time {number} - 时间
 * @param value {number} - 值
 * @param inTangent {number} - 进入值
 * @param outTangent {number} - 触发值
 */
BezierCurve.prototype.addKey = function(time, value, inTangent, outTangent) {
    var needCalcTangent = !(time instanceof Keyframe) && (isNaN(inTangent) || isNaN(outTangent));
    var keyframe = time instanceof Keyframe ? time : new Keyframe(time, value, inTangent, outTangent);
    var idx = qc.Util.insertSortedList(this._keys, keyframe, this._keyframeLess);
    needCalcTangent && this.makeKeyframeAuto(idx);
    return idx;
};

/**
 * 删除一帧
 * @param index {number} - 位置
 */
BezierCurve.prototype.removeKey = function(index) {
    return this._keys ? this._keys.splice(index, 1) : null;
};

/**
 * 帧比较
 * @param one
 * @param two
 * @returns {boolean}
 * @private
 */
BezierCurve.prototype._keyframeLess = function(one, two) {
    return one.time < two.time;
};

/**
 * 计算值
 * @param t
 * @param v1
 * @param r
 * @param v2
 * @param u
 * @returns {*}
 * @private
 */
BezierCurve.prototype._calc = function(t, v1, r, v2, u) {
    var v = Math.pow(1-t, 3) * v1 + 3 * Math.pow(1-t,2) * t * r + 3 * (1-t) * Math.pow(t, 2) * u + v2 * Math.pow(t, 3);
    //var v = Math.pow(1-t, 2) * v1 + 2 * (1-t) * t * r + v2 * Math.pow(t, 2);
    if (v === Infinity || isNaN(v) || Math.abs(v) >= 0x7fffffff)
        return t === 1 ? v2 : v1;
    return v;
};

/**
 * 利用导数计算斜率
 * @param t
 * @param v1
 * @param r
 * @param v2
 * @param u
 * @returns {number}
 * @private
 */
BezierCurve.prototype._calcDerivative = function(t, v1, r, v2, u) {
    var t1 = 1 - t;
    var v = - 3 * v1 * t1 * t1 + 3 * r * t1 * (1 - 3 * t) + 3 * u * t *(2 - 3 * t) + 3 * v2 * Math.pow(t, 2);
    if (v === Infinity || isNaN(v))
        return 0;
    return v;
};

/**
 * 计算指定时间点的值，控制点长度为阶段长度的1/3
 * @param time
 * @param loop
 */
BezierCurve.prototype.evaluate = function(time, loop) {
    var idx = 0, len = this._keys ? this._keys.length : 0;
    if (len === 0)
        return NaN;
    if (len === 1)
        return this._keys[0].value;
    var regionStart = this._keys[0].time;
    var end = this._keys[len - 1].time;
    var loopLen = end - regionStart;
    // 不在时间区间内
    if (regionStart > time) {
        if (loopLen === 0 || this.preWrapMode === BezierCurve.WRAP_CLAMP) {
            return this._keys[0].value;
        }
        else if (this.preWrapMode === BezierCurve.WRAP_LOOP) {
            var off = regionStart - time;
            off = off - Math.floor(off / loopLen) * loopLen;
            return this.evaluate(end - off, loop);
        }
        else if (this.preWrapMode === BezierCurve.WRAP_PINGPONG) {
            var off = regionStart - time;
            off = off - Math.floor(off / (2 * loopLen)) * 2 * loopLen;
            if (off <= loopLen) {
                return this.evaluate(regionStart + off, loop);
            }
            else {
                return this.evaluate(end - off + loopLen, loop);
            }
        }
    }

    if (time > end) {
        if (loopLen === 0 || this.postWrapMode === BezierCurve.WRAP_CLAMP) {
            return this._keys[len - 1].value;
        }
        else if (this.postWrapMode === BezierCurve.WRAP_LOOP) {
            var off = time - end;
            off = off - Math.floor(off / loopLen) * loopLen;
            return this.evaluate(regionStart + off, loop);
        }
        else if (this.postWrapMode === BezierCurve.WRAP_PINGPONG) {
            var off = time - end;
            off = off - Math.floor(off / (2 * loopLen)) * 2 * loopLen;
            if (off <= loopLen) {
                return this.evaluate(end - off, loop);
            }
            else {
                return this.evaluate(regionStart + off - loopLen, loop);
            }
        }
    }

    if (time === regionStart && loop && this.preWrapMode !== BezierCurve.WRAP_CLAMP) {
        time = end;
    }

    var regionEnd;
    while (++idx < len) {
        regionEnd = this._keys[idx].time;
        if (regionEnd === regionStart) {
            continue;
        }
        if (time <= regionEnd) {
            var tLen = regionEnd - regionStart;
            var yLen = this._keys[idx].value - this._keys[idx - 1].value;
            var currX = (time - regionStart) / tLen;
            //是否需要将 x 对应的 t 计算出来, 利用一元三次方程求解公式算出指定点的 x 值
            //var q = 0.125 - currX / 4;
            //var t1 = (q < 0 ? 1 : -1) * Math.pow(Math.abs(q), 1/3);
            // currX = t1 + 1/2;
            var calcValue = this._calc(currX, this._keys[idx - 1].value, this._keys[idx - 1].value + tLen * this._keys[idx - 1].outTangent / 3,
                this._keys[idx].value, this._keys[idx].value - tLen * this._keys[idx].inTangent / 3);
            return calcValue;
        }
        regionStart = this._keys[idx].time;
    }

    return NaN;
};

/**
 * 计算指定时间点切线的斜率
 * @param time
 */
BezierCurve.prototype.evaluateDerivative = function(time) {
    var idx = 0, len = this._keys ? this._keys.length : 0;
    if (len === 0)
        return NaN;
    var regionStart = this._keys[0].time;
    // 不在时间区间内
    if (regionStart > time || time > this._keys[len - 1].time)
        return NaN;
    var regionEnd;
    while (++idx < len) {
        regionEnd = this._keys[idx].time;
        if (regionEnd === regionStart) {
            continue;
        }
        if (time < regionEnd) {
            var tLen = regionEnd - regionStart;
            //var yLen = (this._keys[idx].value - this._keys[idx - 1].value) / tLen;
            var currX = (time - regionStart) / tLen;
            //是否需要将 x 对应的 t 计算出来, 利用一元三次方程求解公式算出指定点的 x 值
            //var q = 0.125 - currX / 4;
            //var t1 = (q < 0 ? 1 : -1) * Math.pow(Math.abs(q), 1/3);
            // currX = t1 + 1/2;
            var derivative = this._calcDerivative(currX, this._keys[idx - 1].value, this._keys[idx - 1].value + tLen * this._keys[idx - 1].outTangent / 3,
                this._keys[idx].value, this._keys[idx].value - tLen * this._keys[idx].inTangent / 3);
            return derivative / tLen;
        }
        regionStart = this._keys[idx].time;
    }

    return NaN;
};

/**
 * 将指定关键帧的入角和出角设置为自动
 * @param idx
 */
BezierCurve.prototype.makeKeyframeAuto = function(idx) {
    var currFrame = idx >= 0 && idx < this._keys.length ? this.keys[idx] : null;
    var preFrame = idx > 0 && idx < this._keys.length ? this._keys[idx - 1] : null;
    var nextFrame = idx <= this._keys.length - 1 && idx >= 0 ? this._keys[idx + 1] : null;
    var count = 0;
    var angle = 0;
    if (!currFrame) {
        return;
    }
    if (preFrame) {
        count++;
        angle += Math.atan2(currFrame.value - preFrame.value, currFrame.time - preFrame.time);
    }
    if (nextFrame) {
        count++;
        angle += Math.atan2(nextFrame.value - currFrame.value, nextFrame.time - currFrame.time);
    }
    if (count > 0)
        currFrame.inTangent = currFrame.outTangent = Math.tan(angle / count);
};

/**
 * 将指定关键帧的入角和出角设置为平滑
 * @param idx
 */
BezierCurve.prototype.makeKeyframeSmooth = function(idx) {
    var currFrame = idx >= 0 && idx < this._keys.length ? this.keys[idx] : null;
    if (!currFrame) {
        return;
    }
    var angle = Math.atan(currFrame.inTangent) + Math.atan(currFrame.outTangent);
    currFrame.inTangent = currFrame.outTangent = Math.tan(angle / 2);
};

/**
 * 将指定关键帧的入角和出角设置为水平
 * @param idx
 */
BezierCurve.prototype.makeKeyframeFlat = function(idx) {
    var currFrame = idx >= 0 && idx < this._keys.length ? this.keys[idx] : null;
    if (!currFrame) {
        return;
    }
    currFrame.inTangent = currFrame.outTangent = 0;
};

/**
 * 将指定关键帧的入角和出角设置为线性斜率
 * @param idx
 */
BezierCurve.prototype.makeKeyframeLinear = function(idx) {
    var currFrame = idx >= 0 && idx < this._keys.length ? this.keys[idx] : null;
    var preFrame = idx > 0 && idx < this._keys.length ? this._keys[idx - 1] : null;
    var nextFrame = idx <= this._keys.length - 1 && idx >= 0 ? this._keys[idx + 1] : null;
    if (!currFrame) {
        return;
    }
    if (preFrame) {
        currFrame.inTangent = (currFrame.value - preFrame.value) / (currFrame.time - preFrame.time);
    }
    if (nextFrame) {
        currFrame.outTangent = (nextFrame.value - currFrame.value) / (nextFrame.time - currFrame.time);
    }
};

BezierCurve.prototype.clone = function() {
    var other = new BezierCurve([]);

    for (var idx in this._keys) {
        other.addKey(this._keys[idx].clone());
    }

    return other;
};

/**
 * 固定值拓展
 * @constant
 * @type {number}
 */
BezierCurve.WRAP_CLAMP = 0;
/**
 * 循环拓展
 * @constant
 * @type {number}
 */
BezierCurve.WRAP_LOOP = 1;
/**
 * 乒乓拓展
 * @constant
 * @type {number}
 */
BezierCurve.WRAP_PINGPONG = 2;
