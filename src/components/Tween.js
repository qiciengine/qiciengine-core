/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

var Tween = defineBehaviour('qc.Tween', qc.Behaviour, function() {
    /**
     * @property {qc.BezierCurve} _curve - 曲线
     * @private
     */
    this._curve = new qc.BezierCurve(new qc.Keyframe(0, 0, 1, 1), new qc.Keyframe(1, 1, 1, 1));
    /**
     * @property {boolean} _started - 是否已经开始
     * @private
     */
    this._started = false;
    /**
     * @property {number} _startTime - 开始时间
     * @private
     */
    this._startTime = 0;

    /**
     * @property {number} _amountPreDelta - 单位时间的进度值
     * @private
     */
    this._amountPerDelta = 1000;

    /**
     * @property {number} _factor - 取值因子
     * @private
     */
    this._factor = 0;

    /**
     * @property {string} duration - 持续时间
     */
    this.duration = 1;

    // 在编辑器模式下需要运行
    this.runInEditor = true;

    /**
     * @property {string} flag - 标记
     */
    this.flag =  '';

    /**
     * @property {boolean} playOnAwake - 载入时播放
     */
    this.playOnAwake = false;

    /**
     * @property {boolean} canRunInEditor - 是否在 Editor 下运行
     */
    this.canRunInEditor = false;
}, {
    _curve : qc.Serializer.GEOM,
    sampleMethod : qc.Serializer.NUMBER,
    style : qc.Serializer.NUMBER,
    delay : qc.Serializer.NUMBER,
    duration : qc.Serializer.NUMBER,
    tweenGroup : qc.Serializer.NUMBER,
    flag: qc.Serializer.STRING,
    playOnAwake: qc.Serializer.BOOLEAN
});

// 菜单上的隐藏
Tween.__hiddenInMenu = true;

Object.defineProperties(Tween.prototype, {
    /**
     * @property {qc.BezierCurve} curve - 曲线
     */
    curve : {
        get : function() {
            return this._curve;
        }
    },
    /**
     * @property {number} sampleMethod - 时间的采样方式, 默认为线性采样
     */
    sampleMethod : {
        get : function() { return this._sampleMethod || Tween.SAMPLE_LINEAR; },
        set : function(v) {
            if (this._sampleMethod === v) {
                return;
            }
            this._sampleMethod = v;
        }
    },
    /**
     * @property {number} style - 循环类型
     */
    style : {
        get : function() { return this._style || 0; },
        set : function(v) {
            if (this._style === v) return;
            this._style = v;
        }
    },
    /**
     * @property {number} delay - 开始的延时
     */
    delay : {
        get : function() { return (isNaN(this._delay) || this._delay < 0) ? 0 : this._delay; },
        set : function(v) {
            if (this._delay === v) return;
            this._delay = v;
        }
    },
    /**
     * @property {number} duration - 持续时间
     */
    duration : {
        get : function() { return (isNaN(this._duration) || this._duration < 0) ? 0 : this._duration; },
        set : function(v) {
            if (this._duration === v) return;
            this._duration = v;
            this._amountPerDelta = Math.abs(v > 0 ? 1 / (v * 1000) : 1000) * (this._amountPerDelta >= 0 ? 1 : -1 );
        }
    },
    /**
     * @property {number} tweenGroup - 组别
     */
    tweenGroup : {
        get : function() { return this._tweenGroup || 0; },
        set : function(v) {
            if (this._tweenGroup === v) return;
            this._tweenGroup = v;
        }
    },

    /**
     * @property {Phaser.Signal} onStart - 开始事件
     */
    onStart : {
        get: function() {
            if (!this._onStart) {
                this._onStart = new Phaser.Signal();
            }
            return this._onStart;
        }
    },

    /**
     * @property {Phaser.Signal} onFinished -  结束事件
     */
    onFinished : {
        get: function() {
            if (!this._onFinished) {
                this._onFinished = new Phaser.Signal();
            }
            return this._onFinished;
        }
    },

    /**
     * @property {Phaser.Signal} onLoopFinished - 循环一次事件
     */
    onLoopFinished : {
        get : function() {
            if (!this._onLoopFinished) {
                this._onLoopFinished = new Phaser.Signal();
            }
            return this._onLoopFinished;
        }
    },

    /**
     * @property {number} amountPerDelta - 单位时间的进度值
     * @readonly
     */
    amountPerDelta : {
        get : function() { return this._amountPerDelta; }
    },

    /**
     * @property {number} tweenFactor - tween 曲线的因子
     */
    tweenFactor : {
        get : function()  { return this._factor; },
        set : function(v) {
            this._factor = Phaser.Math.clamp(v, 0, 1);
        }
    },

    /**
     * @property {number} direction - 当前行进的方向
     */
    direction : {
        get : function() {
            return this.amountPerDelta <  0 ? Tween.DIR_REVERSE : Tween.DIR_FORWARD;
        }
    }
});

/**
 * 组件初始化处理
 */
Tween.prototype.awake = function() {
    var self = this;
    self.enable = false;

    if (self.playOnAwake) {
        self.resetToBeginning();
        self.playForward();
    }
};

/**
 * 线性采样
 * @param factor
 * @returns {*}
 */
Tween.prototype._lineSample = function(factor) {
    return factor;
};

/**
 * 开始变形
 */
Tween.prototype.start = function() {
    this.update();
};

/**
 * update
 */
Tween.prototype.update = function() {
    if (!this.enable) {
        return;
    }

    if (this.gameObject && this.game.device.editor && !this.canRunInEditor) {
        return;
    }

    var delta = this.game.time.deltaTime;
    var time = this.game.time.scaledTime;
    if (!this._started) {
        this._started = true;
        this._dispatchStart = false;
        this._startTime = time + this.delay * 1000;
    }

    // 未到开始时间，则不进行处理
    if (time < this._startTime) {
        return;
    }
    else if (time === this._startTime) {
        // 刚刚开始，则间隔时间为0
        delta = 0;
    }
    else if (time - this._startTime < delta)
        // 表示有延时情况下第一次开始
        delta = time - this._startTime;

    if (!this._dispatchStart) {
        this._dispatchStart = true;
        if (this._onStart) {
            this._onStart.dispatch(this);
        }
    }

    this._factor += this.amountPerDelta * delta;

    // 处理循环的因子处理
    if (this.style === Tween.STYLE_LOOP) {
        if (this._factor > 1) {
            this._factor -= Math.floor(this._factor);
            if (this._onLoopFinished) {
                this._onLoopFinished.dispatch(this);
            }
        }
    }
    else if (this.style === Tween.STYLE_PINGPONG) {
        if (this._factor > 1) {
            this._factor = 1 - (this._factor - Math.floor(this._factor));
            this._amountPerDelta = -this._amountPerDelta;
            if (this._onLoopFinished) {
                this._onLoopFinished.dispatch(this);
            }
        }
        else if (this._factor < 0) {
            this._factor = -this._factor;
            this._factor -= Math.floor(this._factor);
            this._amountPerDelta = -this._amountPerDelta;
            if (this._onLoopFinished) {
                this._onLoopFinished.dispatch(this);
            }
        }
    }

    if ((this.style === Tween.STYLE_ONCE) && (this.duration === 0 || this._factor > 1 || this._factor < 0)) {
        // 单次播放完成
        this._factor = Phaser.Math.clamp(this._factor, 0, 1);
        this.sample(this._factor, true);

        if (this._onFinished) {
            this._onFinished.dispatch(this);
        }

        if (this.duration === 0 || (this._factor === 1 && this._amountPerDelta > 0 || this._factor === 0 && this._amountPerDelta < 0)) {
            this.enable = false;
        }
    }
    else {
        this.sample(this._factor, false);
    }
};

/**
 * 设置为不可用
 */
Tween.prototype.onDisable = function() {
    this._started = false;
    this.canRunInEditor = false;
};

/**
 * 进行采样
 * @param factor
 */
Tween.prototype.sample = function(factor, isFinished) {
    var val = Phaser.Math.clamp(factor, 0 , 1);
    switch (this.sampleMethod) {
        case Tween.SAMPLE_LINEAR:
            val = this._lineSample(val);
            break;
    }
    this.onUpdate(this.curve.evaluate(val), isFinished);
};


/**
 * 对同组Tween进行操作
 * @param func {function} - 需要进行的操作
 * @private
 */
Tween.prototype._funcGroup = function(func) {
    var self = this;
    if (self.tweenGroup === 0) {
        func(self);
        return;
    }
    Tween._funcGroup(self.gameObject, self.tweenGroup, func);
};

/**
 * 重置当前状态为初始状态
 * @param reverse {boolean} - 是否反向播放的开始
 */
Tween.prototype.reset = function(reverse) {
    if (!this._started) {
        reverse ?
        this.setEndToCurrValue() :
        this.setStartToCurrValue();
    }
};

/**
 * 重置本组Tween当前状态为初始状态
 * @param reverse {boolean} - 是否反向播放的开始
 */
Tween.prototype.resetGroup = function(reverse) {
    var func = function(tween) {
        tween.reset(reverse);
    };
    this._funcGroup(func);
};

/**
 * 正向播放
 */
Tween.prototype.playForward = function(reset) {
    if (reset) this.resetToBeginning();
    this.play(false);
};

/**
 * 正向播放本组 Tween
 */
Tween.prototype.playGroupForward = function(reset) {
    var func = function(tween) {
        tween.playForward(reset);
    };
    this._funcGroup(func);
};

/**
 * 逆向播放
 */
Tween.prototype.playReverse = function(reset) {
    if (reset) this.resetToBeginning(true);
    this.play(true);
};

/**
 * 逆向播放本组 Tween
 */
Tween.prototype.playGroupReverse = function(reset) {
    var func = function(tween) {
        tween.playReverse(reset);
    };
    this._funcGroup(func);
};

/**
 * 停止播放
 */
Tween.prototype.stop = function() {
    this.enable = false;
    this.canRunInEditor = false;
};

/**
 * 停止同组Tween播放
 */
Tween.prototype.stopGroup = function() {
    var func = function(tween) {
        tween.stop();
    };
    this._funcGroup(func);
};


/**
 * 播放
 * @param reverse {boolean} - 是否反向播放
 */
Tween.prototype.play = function(reverse) {
    this._amountPerDelta = Math.abs(this.amountPerDelta) * (reverse ? -1 : 1);
    this.enable = true;
    this.canRunInEditor = true;
    this.update();
};

/**
 * 播放同组Tween
 * @param reverse {boolean} - 是否反向播放
 */
Tween.prototype.playGroup = function(reverse) {
    var func = function(tween) {
        tween.play(reverse);
    };
    this._funcGroup(func);
};

/**
 * 重置为开始状态
 * @param reverse {boolean} - 是否反向播放的开始
 */
Tween.prototype.resetToBeginning = function(reverse) {
    this._started = false;
    this._amountPerDelta = Math.abs(this.amountPerDelta) * (reverse ? -1 : 1);
    this._factor = (this.amountPerDelta < 0) ? 1 : 0;
    this.sample(this._factor, false);
    reverse ? this.setEndToCurrValue() : this.setStartToCurrValue();
};

/**
 * 将同组的Tween重置为开始状态
 * @param reverse {boolean} - 是否反向播放的开始
 */
Tween.prototype.resetGroupToBeginning = function(reverse) {
    var func = function(tween) {
        tween.resetToBeginning(reverse);
    };
    this._funcGroup(func);
};

/**
 * 运行时反向
 */
Tween.prototype.toggle = function() {
    if (this._factor > 0) {
        this._amountPerDelta = -this.amountPerDelta;
    }
    else {
        this._amountPerDelta = Math.abs(this.amountPerDelta);
    }
    this.enable = true;
};

/**
 * 处理对应的形变逻辑
 * @param factor {number} - 形变的因子
 * @param isFinished {boolean} - 是否已经结束
 */
Tween.prototype.onUpdate = function(factor, isFinished) {

};

/**
 * 将开始状态设成当前状态
 */
Tween.prototype.setStartToCurrValue = function() {

};

/**
 * 将结束状态设成当前状态
 */
Tween.prototype.setEndToCurrValue = function() {

};

/**
 * 将当前状态设为开始状态
 */
Tween.prototype.setCurrToStartValue = function() {

};

/**
 * 将当前状态设置为结束状态
 */
Tween.prototype.setCurrToEndValue = function() {

};

/**
 * 开始一个Tween形变
 * @param tweenType {string} - 一个形变类型
 * @param node {qc.Node} - 节点
 * @param duration {number} - 经历的时间
 */
Tween.begin = function(tweenType, node, duration) {
    var tween = node.getScript(tweenType, false);
    if (tween && tween.tweenGroup != 0) {
        tween = null;
        var tweenList = node.getScripts(tweenType, false);
        for (var idx = 0; idx < tweenList.length; ++idx) {
            if (tweenList[idx] && tweenList[idx].tweenGroup === 0) {
                tween = tweenList[idx];
                break;
            }
        }
    }
    if (!tween) {
        tween = node.addScript(tweenType);
        if (!tween) {
            return;
        }
    }

    if (!(tween instanceof Tween)) {
        return;
    }

    tween._started = false;
    tween.duration = duration;
    tween._factor = 0;
    tween._amountPerDelta = Math.abs(tween.amountPerDelta);
    tween.style = Tween.STYLE_ONCE;
    tween._curve = new qc.BezierCurve(new qc.Keyframe(0, 0, 1, 1), new qc.Keyframe(1, 1, 1, 1));
    tween.enable = true;
    return tween;
};

/**
 * 对指定Tween组进行操作
 * @param node {qc.Node} - 需要操作的节点
 * @param groupId {number} - 组 Id
 * @param func {function} - 需要进行的操作
 * @private
 */
Tween._funcGroup = function(node, groupId , func) {
    var tweenList = node.getScripts ? node.getScripts('qc.Tween') : [];
    var tLen = tweenList.length;
    while (tLen-- > 0) {
        if (tweenList[tLen].tweenGroup === groupId) {
            func(tweenList[tLen]);
        }
    }

    var children = node.children;
    if (!children)
        return;
    var len = children.length;
    while (len-- > 0) {
        var sub = children[len];
        Tween._funcGroup(sub, groupId, func);
    }
};

/**
 * 重置本组Tween当前状态为初始状态
 * @param node {qc.Node} - 需要播放动画的节点
 * @param groupId {number} - 需要播放的组Id
 * @param reverse {boolean} - 是否反向播放的开始
 */
Tween.resetGroup = function(node, groupId, reverse) {
    var func = function(tween) {
        tween.reset(reverse);
    };
    Tween._funcGroup(node, groupId, func);
};

/**
 * 正向播放本组Tween
 * @param node {qc.Node} - 需要播放动画的节点
 * @param groupId {number} - 需要播放的组Id
 */
Tween.playGroupForward = function(node, groupId) {
    var func = function(tween) {
        tween.playForward();
    };
    Tween._funcGroup(node, groupId, func);
};

/**
 * 逆向播放本组 Tween
 * @param node {qc.Node} - 需要播放动画的节点
 * @param groupId {number} - 需要播放的组Id
 */
Tween.playGroupReverse = function(node, groupId) {
    var func = function(tween) {
        tween.playReverse();
    };
    Tween._funcGroup(node, groupId, func);
};

/**
 * 停止同组Tween播放
 * @param node {qc.Node} - 需要播放动画的节点
 * @param groupId {number} - 需要播放的组Id
 */
Tween.stopGroup = function(node, groupId) {
    var func = function(tween) {
        tween.stop();
    };
    Tween._funcGroup(node, groupId, func);
};

/**
 * 播放同组Tween
 * @param node {qc.Node} - 需要播放动画的节点
 * @param groupId {number} - 需要播放的组Id
 * @param reverse {boolean} - 是否反向播放
 */
Tween.playGroup = function(node, groupId, reverse) {
    var func = function(tween) {
        tween.play(reverse);
    };
    Tween._funcGroup(node, groupId, func);
};

/**
 * 将同组的Tween重置为开始状态
 * @param reverse {boolean} - 是否反向播放的开始
 */
Tween.resetGroupToBeginning = function(node, groupId, reverse) {
    var func = function(tween) {
        tween.resetToBeginning(reverse);
    };
    Tween._funcGroup(node, groupId, func);
};

/**
 * 单次执行
 * @constant
 * @type {number}
 */
Tween.STYLE_ONCE = 0;
/**
 * 循环执行
 * @constant
 * @type {number}
 */
Tween.STYLE_LOOP = 1;
/**
 * 往返执行
 * @constant
 * @type {number}
 */
Tween.STYLE_PINGPONG = 2;
/**
 * 前进
 * @constant
 * @type {number}
 */
Tween.DIR_FORWARD = 0;
/**
 * 反转
 * @constant
 * @type {number}
 */
Tween.DIR_REVERSE = 1;

/**
 * 线性时间采样
 * @constant
 * @type {number}
 */
Tween.SAMPLE_LINEAR = 0;
