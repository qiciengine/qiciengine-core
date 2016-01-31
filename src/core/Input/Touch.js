/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 触摸输入交互功能。
 * @class qc.Touch
 * @param {qc.Input} input - 输入事件处理器
 * @param {DOM} generator -  事件的发生器，一般为DOM元素，默认为game.canvas
 * @internal
 */
var Touch = qc.Touch = function(input, generator) {

    /**
     * @property {qc.Input} input - 本地的交互事件处理器
     */
    this.input = input;

    /**
     * @property {qc.Game} game - 游戏对象
     */
    this.game = input.game;

    /**
     * @property {boolean} capture - 对于DOM的触摸事件会调用event.preventDefault停止事件传递，否则事件会全部通知
     */
    this.capture = true;

    /**
     * @property {Phaser.Signal} onTouchStart - 触摸开始的事件
     * 通知参数：id, worldX, worldY
     */
    this.onTouchStart = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onTouchEnd - 触摸结束的事件
     * 通知参数：id, worldX, worldY
     */
    this.onTouchEnd = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onTouchMove - 触摸移动的事件
     * 通知参数：worldX, worldY
     */
    this.onTouchMove = new Phaser.Signal();

    /**
     * @property {[id: qc.Pointer]} _touches - 触摸事件缓存
     * @private
     */
    this._touches = [];

    /**
     * @property {{number:boolean}} _touchIds - 当前所有触摸事件id
     * @private
     */
    this._touchIds = {};

    /**
     * @property {{{number}: {nubmer}}} _deviceIdMap - deviceId和id的对应表
     * @private
     */
    this._deviceIdMap = {};


    /**
     * @property {[{x:{number},y:{number},isDown:{boolean}]} _touchesStartPosition - 在android的某些浏览器上，触摸触发事件后仍然会触发鼠标事件
     * 每帧留下一份起始点存根，用来排除这类重复调用
     * 不直接屏蔽掉接收鼠标事件是为了兼容可以外接鼠标的android设备
     * @private
     */
    this._touchesStartPosition = [];

    /**
     * @property {number} _touchStartNum - 当前的触摸点数量
     * @private
     */
    this._touchStartNum = 0;

    /**
     * @property {boolean} _anyTouchStart - 当前帧是否有触摸事件触发
     * @private
     */
    this._anyTouchStart = false;

    // 初始化
    this._init(generator);

    /**
     * @property {object} callbackContext - The context under which callbacks are called.
     */
    this.callbackContext = this.game;

    /**
     * @property {function} touchStartCallback - A callback that can be fired on a touchStart event.
     */
    this.touchStartCallback = null;

    /**
     * @property {function} touchMoveCallback - A callback that can be fired on a touchMove event.
     */
    this.touchMoveCallback = null;

    /**
     * @property {function} touchEndCallback - A callback that can be fired on a touchEnd event.
     */
    this.touchEndCallback = null;

    /**
     * @property {function} touchEnterCallback - A callback that can be fired on a touchEnter event.
     */
    this.touchEnterCallback = null;

    /**
     * @property {function} touchLeaveCallback - A callback that can be fired on a touchLeave event.
     */
    this.touchLeaveCallback = null;

    /**
     * @property {function} touchCancelCallback - A callback that can be fired on a touchCancel event.
     */
    this.touchCancelCallback = null;
};
Touch.prototype = {};
Touch.prototype.constructor = Touch;


Object.defineProperties(Touch.prototype, {
    /**
     * @property {boolean} enabled - 触摸交互开关，初始化时默认启动
     */
    enable: {
        get: function() { return this._enable; },
        set: function(value) { this._setEnable(value); }
    },

    /**
     * @property {DOM} generator - 触摸事件的发生器，一般为HTML DOM对象
     * 当设置为空时，使用game.canvas作为事件发生器
     */
    generator: {
        get: function() { return this._generator || this.game.canvas.parentNode || this.game.canvas; },
        set: function(value) {
            // 监听对象没有修改，不进行操作
            if (value === this._generator)
                return;

            var oldState = this.enable;
            // 先注销掉之前的监听
            this.enable = false;

            // 替换发生器
            this._generator = value;

            if (oldState) {
                // 设置事件可用
                this.enable = true;
            }
        }
    },

    /**
     * @property {number} touchCount - 返回当前触摸点的数量
     * @readonly
     */
    touchCount: {
        get: function() { return this._touchStartNum; }
    },

    /**
     * @property {[number]} touchIds - 返回当前所有触摸事件Id
     * @readonly
     */
    touchIds: {
        get: function() { return Object.keys(this._touchIds); }
    }
});

/**
 * 初始化
 * @param generator
 * @private
 */
Touch.prototype._init = function(generator) {
    // 设置监听事件接口
    this._onTouchStart = this.processTouchStart.bind(this);
    this._onTouchCancel = this.processTouchCancel.bind(this);
    this._onTouchEnd = this.processTouchEnd.bind(this);
    this._onTouchEnter = this.processTouchEnter.bind(this);
    this._onTouchLeave = this.processTouchLeave.bind(this);
    this._onTouchMove = this.processTouchMove.bind(this);

    this.generator = generator;
    this.enable = true;
};

/**
 * 更新
 */
Touch.prototype.update = function() {
    if (! this.enable)
        return;
    this._touchesStartPosition.splice(0, this._touchesStartPosition.length);
    this._anyTouchStart = false;
    var i = this._touches.length;
    var touch;
    while (i--) {
        touch = this._touches[i];
        if (!touch)
            continue;

        while (touch.nextEvent()) {
            // 开始事件
            if (touch.isJustDown) {
                this._anyTouchStart = true;
                this._recordTouch(touch.id, true);
                this.onTouchStart.dispatch(touch.id, touch.x, touch.y);
            }

            touch.update();

            // 派发移动事件
            if (touch.isDown && (touch.deltaX || touch.deltaY)) {
                this.onTouchMove.dispatch(touch.id, touch.x, touch.y);
            }

            // 结束事件
            if (touch.isJustUp) {
                this._recordTouch(touch.id, false);
                this.onTouchEnd.dispatch(touch.id, touch.x, touch.y);
            }
            if (!touch.isDown) {
                this._removeTouch(touch.id);
            }
        }
    }
};

/**
 * 销毁
 * @internal
 */
Touch.prototype.destroy = function() {
    this.enable = false;

    this._onTouchStart = null;
    this._onTouchCancel = null;
    this._onTouchEnd = null;
    this._onTouchEnter = null;
    this._onTouchLeave = null;
    this._onTouchMove = null;

    this.input = null;
    this.game = null;
    this.generator = null;
};

/**
 * 检测一个点事件是否已经被触摸事件捕获
 * 在android的某些浏览器上，触摸触发事件后仍然会触发鼠标事件
 * 每帧留下一份起始点存根，用来排除这类重复调用
 * 不直接屏蔽掉接收鼠标事件是为了兼容可以外接鼠标的android设备
 * @param isDown {boolean} - 是否是按下事件
 * @param x {number} - 事件发生的x坐标
 * @param y {number} - 事件发生的y坐标
 */
Touch.prototype.checkEventHandled = function(isDown, x, y) {
    var i = this._touchesStartPosition.length;
    while (i--) {
        var position = this._touchesStartPosition[i];
        if (position.isDown === isDown &&
            position.x === x &&
            position.y === y)
            return true;
    }
    return false;
};

/**
 * 设置是否可以接受触摸事件
 * @param value
 * @private
 */
Touch.prototype._setEnable = function(value) {
    // enabled状态为改变不做处理
    if (this._enable === value) {
        return;
    }
    var generator = this.generator;
    var device = this.game.phaser.device;
    if (!device.touch) {
        this._enable = false;
        return;
    }

    this._enable = value;

    // 监控键盘事件
    if (value) {
        generator.addEventListener('touchstart', this._onTouchStart, false);
        generator.addEventListener('touchmove', this._onTouchMove, false);
        generator.addEventListener('touchend', this._onTouchEnd, false);
        generator.addEventListener('touchcancel', this._onTouchCancel, false);

        if (!device.cocoonJS) {
            generator.addEventListener('touchenter', this._onTouchEnter, false);
            generator.addEventListener('touchleave', this._onTouchLeave, false);
        }
    }
    else {
        generator.removeEventListener('touchstart', this._onTouchStart);
        generator.removeEventListener('touchmove', this._onTouchMove);
        generator.removeEventListener('touchend', this._onTouchEnd);
        generator.removeEventListener('touchcancel', this._onTouchCancel);
        generator.removeEventListener('touchenter', this._onTouchEnter);
        generator.removeEventListener('touchleave', this._onTouchLeave);

        this._clearTouches();
    }
};

/**
 * 清理所有的事件混存
 * @private
 */
Touch.prototype._clearTouches = function() {
    var touch;
    while (this._touches.length > 0)
    {
        touch = this._touches.pop();
        if (touch)
            touch.destroy();
    }
    this._deviceIdMap = {};
    this._touchStartNum = 0;
    this._touchIds = {};
};

/**
 * 当失去输入焦点时调用
 * @internal
 */
Touch.prototype.lossFocus = function() {
    this._clearTouches();
};

/**
 * 现在是否有触摸处在开始状态
 * @returns {boolean}
 */
Touch.prototype.isAnyTouch = function() {
    return this._touchStartNum > 0;
};

/**
 * 当前帧是否有触摸事件开始
 * @returns {boolean}
 */
Touch.prototype.isAnyTouchStart = function() {
    return this._anyTouchStart;
};

/**
 * 指定id的触摸事件是否开始
 * @param id
 * @returns {boolean}
 */
Touch.prototype.isTouchStart = function(id) {
    return !!this._touchIds[id];
};

/**
 * 记录触摸事件状态
 * @param id {number}
 * @param isStart {boolean} 是否开始
 * @private
 */
Touch.prototype._recordTouch = function(id, isStart) {
    if (isStart) {
        this._touchStartNum++;
        this._touchIds[id] = true;
    }
    else {
        this._touchStartNum--;
        delete this._touchIds[id];
    }

};

/**
 * 通过Id获得点事件
 * @param id
 * @returns {qc.Pointer}
 */
Touch.prototype.getTouchById = function(id) {
    return this._touches[id];
};

/**
 * 返回触摸列表中第一个无效的触摸点
 * @returns {qc.Pointer}
 * @private
 */
Touch.prototype._getFirstInvalidTouch = function() {
    var idx = -1;
    var len = this._touches.length + 1;
    while (++idx < len) {
        var touch = this._touches[idx];
        if (!touch) {
            break;
        }
        if (!touch.isDown && !touch.hasEvent()) {
            // 没有事件等待处理，并且不是按下状态则可以复用
            return touch;
        }
    }
    var pointer = new qc.Pointer(this.game, idx);
    this._touches[idx] = pointer;
    return pointer;
};

/**
 * 移除一个触摸点
 * @param id
 * @private
 */
Touch.prototype._removeTouch = function(id) {
    var pointer = this._touches[id];
    if (pointer) {
        delete this._deviceIdMap[pointer.deviceId];
    }
};

/**
 * 通过设备id获取触摸点
 * @param deviceId {number} 设备Id
 * @param create {boolean} 是否创建触摸点
 * @returns {qc.Pointer}
 */
Touch.prototype.getTouchByDeviceId = function(deviceId, create) {
    if (this._deviceIdMap[deviceId] === undefined) {
        if (create) {
            var pointer = this._getFirstInvalidTouch();
            pointer.deviceId = deviceId;
            this._deviceIdMap[deviceId] = pointer.id;
            return pointer;
        }
        return null;
    }
    return this.getTouchById(this._deviceIdMap[deviceId]);
};

/**
 * 将坐标转化为World坐标
 * @param source {DOM} 事件产生的DOM对象
 * @param x {number} x轴坐标
 * @param y {number} y轴坐标
 * @return {{x: number, y: number}} 在world中的位置
 * @private
 */
Touch.prototype._toWorld = function(source, x, y) {
    var canvas = this.game.canvas;
    var scaleFactor = this.game.phaser.scale.scaleFactor;
    var canvasBound = canvas.ownerDocument === (this.generator.ownerDocument || this.generator.document) ?
        canvas.getBoundingClientRect() :
        ((this.generator.getBoundingClientRect && this.generator.getBoundingClientRect()) || { left: 0, top: 0 });
    return {
        x: (x - canvasBound.left) * scaleFactor.x,
        y: (y - canvasBound.top) * scaleFactor.y
    };
};

/**
 * 根据事件中的touches信息更新已有信息
 * @param touches {[DOM.touch]}
 * @private
 */
Touch.prototype._updateTouchWithTouches = function(touches) {
    // 处理已有点信息
    var i = touches.length;
    var existsTouch = {};
    while (i--) {
        var touch = touches[i];
        existsTouch[touch.identifier] = true;
        var worldPoint = this._toWorld(this.generator, touch.clientX, touch.clientY);
        var pointer = this.getTouchByDeviceId(touch.identifier);
        if (pointer) {
            // 已有的触摸点，处理更新位置
            pointer.deviceId = touch.identifier;
            pointer.onMove(worldPoint.x, worldPoint.y);
        }
    }

    // 处理遗失的点信息
    var i = this._touches.length;
    while (i--) {
        var touch = this._touches[i];
        // 无效的点，存在的点，和正在处理弹起的点 为正常
        if (!touch ||
            existsTouch[touch.deviceId])
            continue;
        touch.onCancel(false);
    }
};

/**
 * 处理触摸的开始事件
 * @param event
 */
Touch.prototype.processTouchStart = function(event) {
    if (this.touchStartCallback)
    {
        this.touchStartCallback.call(this.callbackContext, event);
    }

    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    // 处理事件触发的触摸点
    var i = event.changedTouches.length;
    while (i--) {
        var touch = event.changedTouches[i];
        if (!touch)
            continue;

        var pointer = this.getTouchByDeviceId(touch.identifier, true);
        var worldPoint = this._toWorld(this.generator, touch.clientX, touch.clientY);

        // 记下点击事件
        this._touchesStartPosition.push({
            isDown: true,
            x: worldPoint.x,
            y: worldPoint.y
        });

        pointer.onDown(worldPoint.x, worldPoint.y);
    }

    // 更新已有点信息
    this._updateTouchWithTouches(event.touches);

    // 更新修饰键状态
    this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 处理触摸的结束事件
 * @param event
 */
Touch.prototype.processTouchEnd = function(event) {
    if (this.touchEndCallback)
    {
        this.touchEndCallback.call(this.callbackContext, event);
    }

    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    // 处理事件触发的触摸点
    var i = event.changedTouches.length;
    while (i--) {
        var touch = event.changedTouches[i];
        if (!touch)
            continue;

        var pointer = this.getTouchByDeviceId(touch.identifier);
        if (!pointer) {
            continue;
        }
        var worldPoint = this._toWorld(this.generator, touch.clientX, touch.clientY);

        // 记下点击事件
        this._touchesStartPosition.push({
            isDown: false,
            x: worldPoint.x,
            y: worldPoint.y
        });

        pointer.onUp(worldPoint.x, worldPoint.y);
    }

    // 更新已有点信息
    this._updateTouchWithTouches(event.touches);

    // 更新修饰键状态
    this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 处理触摸的取消事件
 * @param event
 */
Touch.prototype.processTouchCancel = function(event) {
    if (this.touchCancelCallback)
    {
        this.touchCancelCallback.call(this.callbackContext, event);
    }

    // 取消当做结束处理
    this.processTouchEnd(event, true);
};

/**
 * 处理触摸移出区域的事件
 * @param event
 */
Touch.prototype.processTouchLeave = function(event) {
    if (this.touchLeaveCallback)
    {
        this.touchLeaveCallback.call(this.callbackContext, event);
    }
    // 移动处理
    this.processTouchMove(event, true);
};

/**
 * 处理触摸进入区域的事件
 * @param event
 */
Touch.prototype.processTouchEnter = function(event) {
    if (this.touchEnterCallback)
    {
        this.touchEnterCallback.call(this.callbackContext, event);
    }

    // 移动处理
    this.processTouchMove(event, true);
};

/**
 * 触摸点在区域内移动的事件
 * @param event
 */
Touch.prototype.processTouchMove = function(event, skipCallback) {
    if (!skipCallback && this.touchMoveCallback)
    {
        this.touchMoveCallback.call(this.callbackContext, event);
    }

    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    // 处理事件触发的触摸点
    var i = event.changedTouches.length;
    while (i--) {
        var touch = event.changedTouches[i];
        if (!touch)
            continue;

        var pointer = this.getTouchByDeviceId(touch.identifier);
        if (!pointer)
            continue;

        var worldPoint = this._toWorld(this.generator, touch.clientX, touch.clientY);
        pointer.onMove(worldPoint.x, worldPoint.y);
    }

    // 更新已有点信息
    this._updateTouchWithTouches(event.touches);
    // 更新修饰键状态
    this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 主触摸事件Id
 * @type {number}
 * @constant
 */
Touch.MAIN = 0;