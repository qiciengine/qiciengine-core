/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 鼠标输入交互功能。
 * @class qc.Mouse
 * @param {qc.Input} input - 输入事件处理器
 * @param {DOM} generator -  事件的发生器，一般为DOM元素，默认为game.canvas
 * @internal
 */
var Mouse = qc.Mouse = function(input, generator) {

    /**
     * @property {qc.Input} input - 本地的交互事件处理器
     */
    this.input = input;

    /**
     * @property {qc.Game} game - 游戏对象
     */
    this.game = input.game;

    /**
     * @property {qc.Mouse~WheelEventProxy} _wheelEvent - 滚动事件的代理对象，用来统一多个浏览器之间的滚动事件
     * @private
     */
    this._wheelEvent = null;

    /**
     * @property {boolean} capture - 对于DOM的鼠标事件会调用event.preventDefault停止事件传递，否则事件会全部通知
     */
    this.capture = true;

    /**
     * @property {object} callbackContext - The context under which callbacks are called.
     */
    this.callbackContext = this.game;

    /**
     * @property {function} mouseDownCallback - A callback that can be fired when the mouse is pressed down.
     */
    this.mouseDownCallback = null;

    /**
     *
     * @property {Phaser.Signal} onMouseDown - 鼠标按下的事件
     * 通知参数：button, worldX, worldY
     */
    this.onMouseDown = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onMouseUp - 鼠标弹起的事件
     * 通知参数：button, worldX, worldY
     */
    this.onMouseUp = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onMouseMove - 鼠标在事件发生区域移动的事件
     * 通知参数：worldX, worldY
     */
    this.onMouseMove = new Phaser.Signal();

    /**
     *
     * @property {Phaser.Signal} onMousePressMove - 鼠标按下时移动的事件
     * 通知参数：button, worldX, worldY
     */
    this.onMousePressMove = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onMouseWheel - 鼠标滚轮滚动的事件
     * 通知参数：wheelDelta, wheelDeltaX, wheelDeltaY
     */
    this.onMouseWheel = new Phaser.Signal();

    /**
     * @property {[qc.Pointer]} _mouses - 鼠标事件缓存
     * @private
     */
    this._mouses = [];

    /**
     * @property {{number:boolean}} _mouseIds - 当前所有按下的鼠标Id
     * @private
     */
    this._mouseIds = {};

    /**
     * @property {number} _mouseDownNum - 记录当前按下的鼠标按键数量
     * @private
     */
    this._mouseDownNum = 0;

    /**
     * @property {boolean} _anyMouseDown - 当前帧是否有按键按下
     * @private
     */
    this._anyMouseDown = false;

    /**
     * @property {boolean} _checkEventHandledByTouch - 是否检测一个点事件是否已经被触摸事件捕获
     * 在android的某些浏览器上，触摸触发事件后仍然会触发鼠标事件
     * 需要在事件触发是向qc.Touch查询是否已经被捕获了
     * @private
     */
    this._checkEventHandledByTouch = (this.game.phaser.device.android && this.game.phaser.device.chrome === false);

    /**
     * @property {{deltaX: number, deltaY: number}} _wheelInfo - 滚动的事件
     * @private
     */
    this._wheelInfo = {
        deltaX: 0,      // x轴上的滚动距离
        deltaY: 0       // y轴上的滚动距离
    };

    // 初始化
    this._init(generator);

};
Mouse.prototype = {};
Mouse.prototype.constructor = Mouse;


Object.defineProperties(Mouse.prototype, {
    /**
     * @property {boolean} enabled - 鼠标交互开关，初始化时默认启动
     */
    enable: {
        get: function() { return this._enable; },
        set: function(value) { this._setEnable(value); }
    },

    /**
     * @property {DOM} generator -  鼠标事件的发生器，一般为HTML DOM对象
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
     * @property {{deltaX: number, deltaY: number}} mouseWheel - 返回鼠标两帧之间滚动的距离
     * @readonly
     */
    mouseWheel: {
        get: function() { return this._wheelInfo; }
    },

    /**
     * @property {number} mouseCount - 返回当前鼠标按下的数量
     * @readonly
     */
    mouseCount: {
        get: function() { return this._mouseDownNum; }
    },

    /**
     * @property {[number]} mouseIdx - 返回当前所有按下的鼠标Id
     * @readonly
     */
    mouseIds: {
        get: function() { return Object.keys(this._mouseIds); }
    }
});

/**
 * 初始化
 * @param generator
 * @private
 */
Mouse.prototype._init = function(generator) {
    // 鼠标实际键值到游戏自定义键值的映射
    this._mouseKeyMap = {
        0: Mouse.BUTTON_LEFT,
        1: Mouse.BUTTON_MIDDLE,
        2: Mouse.BUTTON_RIGHT,
        3: Mouse.BUTTON_BACK,
        4: Mouse.BUTTON_FORWORD
    };
    this._mouseKeyMap[-1] = Mouse.NONE;

    // 设置监听事件接口
    this._onMouseDown = this.processMouseDown.bind(this);
    this._onMouseUp = this.processMouseUp.bind(this);
    this._onMouseOver = this.processMouseOver.bind(this);
    this._onMouseOut = this.processMouseOut.bind(this);
    this._onMouseUpGlobal = this.processMouseUpGlobal.bind(this);
    this._onMouseMove = this.processMouseMove.bind(this);
    this._onMouseWheel = this.processMouseWheel.bind(this);

    this.generator = generator;
    this.enable = true;
};

/**
 * 更新
 */
Mouse.prototype.update = function() {
    if (! this.enable)
        return;
    // 处理点击事件
    this._anyMouseDown = false;
    var i = this._mouses.length;
    var mouse;
    // 不处理Mouse.NONE
    while (i-- > 1) {
        mouse = this._mouses[i];
        if (!mouse)
            continue;

        while (mouse.nextEvent()) {
            // 按下事件
            if (mouse.isJustDown) {
                this._anyMouseDown = true;
                this._recordMouse(mouse.id, true);
                this.onMouseDown.dispatch(mouse.id, mouse.x, mouse.y);
            }
            mouse.update();
            if (mouse.isDown && (mouse.deltaX || mouse.deltaY)) {
                this.onMousePressMove.dispatch(mouse.id, mouse.x, mouse.y);
            }
            // 弹起事件
            if (mouse.isJustUp) {
                this._recordMouse(mouse.id, false);
                this.onMouseUp.dispatch(mouse.id, mouse.x, mouse.y);
            }
        }

    }

    // 处理移动事件
    mouse = this.getMouseById(Mouse.NONE);
    if (mouse)
    {
        while (mouse.nextEvent()) {
            mouse.update();
            if (mouse.deltaX || mouse.deltaY) {
                this.onMouseMove.dispatch(mouse.x, mouse.y);
            }
        }
    }

    // 处理滚动事件
    var tmpWheel = this._tempWheelInfo || (this._tempWheelInfo = {
            deltaX: 0,
            deltaY: 0
        });
    if (tmpWheel && (tmpWheel.deltaX || tmpWheel.deltaY)) {
        this._wheelInfo.deltaX = tmpWheel.deltaX || 0;
        this._wheelInfo.deltaY = tmpWheel.deltaY || 0;

        this.onMouseWheel.dispatch(this._wheelInfo.deltaX, this._wheelInfo.deltaY);
    }
    else {
        this._wheelInfo.deltaX = 0;
        this._wheelInfo.deltaY = 0;
    }
    tmpWheel.deltaX = 0;
    tmpWheel.deltaY = 0;
};

/**
 * 销毁
 * @internal
 */
Mouse.prototype.destroy = function() {
    this.enable = false;

    this._onMouseDown = null;
    this._onMouseUp = null;
    this._onMouseOver = null;
    this._onMouseOut = null;
    this._onMouseUpGlobal = null;
    this._onMouseMove = null;
    this._onMouseWheel = null;

    this.input = null;
    this.game = null;
    this.generator = null;
};

/**
 * 设置是否可以接受鼠标事件
 * @param value
 * @private
 */
Mouse.prototype._setEnable = function(value) {
    // enabled状态为改变不做处理
    if (this._enable === value) {
        return;
    }
    if (this.game.phaser.device.android && this.game.phaser.device.chrome === false && this.game.phaser.device.touch) {
        // 安卓设备下，部分浏览器即使在touchStart中preventDefault也会触发鼠标事件，在这里进行屏蔽，不监听相关事件
        return;
    }
    this._enable = value;

    var generator = this.generator;
    var device = this.game.phaser.device;
    // 监控键盘事件
    if (value) {
        generator.addEventListener('mousedown', this._onMouseDown, false);
        generator.addEventListener('mouseup', this._onMouseUp, false);
        generator.addEventListener('mousemove', this._onMouseMove, false);

        if (!device.cocoonJS) {
            generator === window || window.addEventListener('mouseup', this._onMouseUpGlobal, false);
            generator.addEventListener('mouseout', this._onMouseOut, false);
            generator.addEventListener('mouseover', this._onMouseOver, false);
        }

        var wheelEvent = device.wheelEvent;
        if (wheelEvent) {
            generator.addEventListener(wheelEvent, this._onMouseWheel, false);

            if (wheelEvent === 'mousewheel') {
                this._wheelEvent = new WheelEventProxy(-1/40, 1);
            }
            else if (wheelEvent === 'DOMMouseScroll') {
                this._wheelEvent = new WheelEventProxy(1, 1);
            }
        }

        // 创建光标移动的事件
        this.getMouseById(Mouse.NONE);
    }
    else {
        generator.removeEventListener('mousedown', this._onMouseDown);
        generator.removeEventListener('mousemove', this._onMouseMove);
        generator.removeEventListener('mouseup', this._onMouseUp);
        generator.removeEventListener('mouseout', this._onMouseOut);
        generator.removeEventListener('mouseover', this._onMouseOver);

        var wheelEvent = device.wheelEvent;
        if (wheelEvent) {
            generator.removeEventListener(wheelEvent, this._onMouseWheel);
        }

        generator === window || window.removeEventListener('mouseup', this._onMouseUpGlobal);

        this._clearMouses();
    }
};

/**
 * 清理所有的事件混存
 * @private
 */
Mouse.prototype._clearMouses = function() {
    while (this._mouses.length > 0)
    {
        var mouse = this._mouses.pop();
        if (mouse)
            mouse.destroy();
    }
    this._mouseDownNum = 0;
    this._mouseIds = {};
};

/**
 * 当失去输入焦点时调用
 * @internal
 */
Mouse.prototype.lossFocus = function() {
    this._clearMouses();
    this.getMouseById(Mouse.NONE);
};

/**
 * 现在是否有鼠标处在按下状态
 * @returns {boolean}
 */
Mouse.prototype.isAnyMouse = function() {
    return this._mouseDownNum > 0;
};

/**
 * 当前帧是否有鼠标按下
 * @returns {boolean}
 */
Mouse.prototype.isAnyMouseDown = function() {
    return this._anyMouseDown;
};

/**
 * 指定鼠标是否按下
 * @param id {number} 鼠标id
 * @returns {boolean}
 */
Mouse.prototype.isMouseDown = function(id) {
    return !!this._mouseIds[id];
};

/**
 * 记录鼠标按键状态
 * @param id {number}
 * @param isDown {boolean} 是否按下
 * @private
 */
Mouse.prototype._recordMouse = function(id, isDown) {
    if (isDown) {
        this._mouseDownNum++;
        this._mouseIds[id] = true;
    }
    else {
        this._mouseDownNum--;
        delete this._mouseIds[id];
    }

};

/**
 * 通过Id获得点事件
 * @param id
 * @returns {qc.Pointer}
 */
Mouse.prototype.getMouseById = function(id) {
    var absID = Math.abs(id);
    if (!this._mouses[absID])
        this._mouses[absID] = new qc.Pointer(this.game, id);
    return this._mouses[absID];
};

/**
 * 因为鼠标只有一个，更新位置时需要更新所有点的信息
 * @param x {number} - x轴坐标
 * @param y {number} - y轴坐标
 * @param type {number} - 0：move，1：enter，2：leave
 * @private
 */
Mouse.prototype._updateMousesPosition = function(x, y, type) {
    var i = this._mouses.length;
    var mouse;
    while (i--) {
        mouse = this._mouses[i];
        if (!mouse) continue;
        if (type === qc.Pointer.ENTER) {
            mouse.onEnter(x, y);
        }
        else if (type === qc.Pointer.LEAVE) {
            mouse.onLeave(x, y);
        }
        else {
            mouse.onMove(x, y);
        }
    }
};

/**
 * 将鼠标坐标转化为World坐标
 * @param source {DOM} 事件产生的DOM对象
 * @param x {number} x轴坐标
 * @param y {number} y轴坐标
 * @return {{x: number, y: number}} 在world中的位置
 * @private
 */
Mouse.prototype._toWorld = function(source, x, y) {
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
 * 处理鼠标的按下事件
 * @param event
 */
Mouse.prototype.processMouseDown = function(event) {
    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    if (this.mouseDownCallback)
    {
        this.mouseDownCallback.call(this.callbackContext, event);
    }

    var code = this._mouseKeyMap[event.button];

    // 不支持的键值
    if (code == undefined)
        return;
    var worldPoint = this._toWorld(this.generator, event.clientX, event.clientY);

    // 检测事件是否已经被触摸事件捕获
    if (this._checkEventHandledByTouch &&
        this.input.touch.checkEventHandled(true, worldPoint.x, worldPoint.y))
        return;

    var pointer = this.getMouseById(code);
    pointer.deviceId = event.button;

    pointer.onDown(worldPoint.x, worldPoint.y);

    // 更新修饰键状态
    this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 处理鼠标的弹起事件
 * @param event
 */
Mouse.prototype.processMouseUp = function(event) {
    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    var code = this._mouseKeyMap[event.button];

    // 不支持的键值
    if (code == undefined)
        return;
    var pointer = this.getMouseById(code);
    pointer.deviceId = event.button;
    pointer.onUp();

    // 更新修饰键状态
    this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 处理鼠标在区域外弹起的事件
 * @param event
 */
Mouse.prototype.processMouseUpGlobal = function(event) {
    //if (this.capture)
    //    event.preventDefault();

    var code = this._mouseKeyMap[event.button];

    // 不支持的键值
    if (code == undefined)
        return;

    var pointer = this.getMouseById(code);
    pointer.onUp();

    // 更新修饰键状态，Game被shutDown时input为空
    if (this.input && this.input.keyboard)
        this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 处理鼠标移出区域的事件
 * @param event
 */
Mouse.prototype.processMouseOut = function(event) {
    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    var code = this._mouseKeyMap[event.button];

    // 不支持的键值
    if (code == undefined)
        return;
    var worldPoint = this._toWorld(this.generator, event.clientX, event.clientY);
    this._updateMousesPosition(worldPoint.x, worldPoint.y, qc.Pointer.LEAVE);
    this.input.nativeMode && this.update();
};

/**
 * 处理鼠标进入区域的事件
 * @param event
 */
Mouse.prototype.processMouseOver = function(event) {
    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    var code = this._mouseKeyMap[event.button];

    // 不支持的键值
    if (code == undefined)
        return;
    var worldPoint = this._toWorld(this.generator, event.clientX, event.clientY);
    this._updateMousesPosition(worldPoint.x, worldPoint.y, qc.Pointer.ENTER);
    // 更新修饰键状态
    this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 鼠标在区域内移动的事件
 * @param event
 */
Mouse.prototype.processMouseMove = function(event) {
    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    var code = this._mouseKeyMap[event.button];

    // 不支持的键值
    if (code == undefined)
        return;


    var worldPoint = this._toWorld(this.generator, event.clientX, event.clientY);
    this._updateMousesPosition(worldPoint.x, worldPoint.y, qc.Pointer.MOVE);
    // 更新修饰键状态
    this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 鼠标滚轮滚动的事件
 * @param event
 */
Mouse.prototype.processMouseWheel = function(event) {

    if (this._wheelEvent) {
        event = this._wheelEvent.bindEvent(event);
    }

    if (!this.input.ignoreDomEvent(event) && this.capture)
        event.preventDefault();

    // 统一firefox的事件参数
    var wheelDelta = Phaser.Math.clamp(-event.deltaY, -1, 1);
    var wheelInfo = this._tempWheelInfo || (this._tempWheelInfo = {
            deltaX: 0,
            deltaY: 0
        });
    wheelInfo.deltaX += event.deltaX;
    wheelInfo.deltaY += event.deltaY;

    // 更新修饰键状态
    this.input.keyboard.setModifierKeysState(event);
    this.input.nativeMode && this.update();
};

/**
 * 没有按下鼠标
 * @constant
 * @type {number}
 */
Mouse.NONE = 0;

/**
 * 鼠标左键
 * @constant
 * @type {number}
 */
Mouse.BUTTON_LEFT = -1;

/**
 * 鼠标中键
 * @constant
 * @type {number}
 */
Mouse.BUTTON_MIDDLE = -2;

/**
 * 鼠标右键
 * @constant
 * @type {number}
 */
Mouse.BUTTON_RIGHT = -3;

/**
 * 鼠标的后退键
 * @constant
 * @type {number}
 */
Mouse.BUTTON_BACK = -4;

/**
 * 鼠标的前进键
 * @constant
 * @type {number}
 */
Mouse.BUTTON_FORWORD = -5;


/* jshint latedef:nofunc */
/**
 * 'wheelscroll' 和 'DOMMouseWheel' 滚动事件的协同处理类
 *
 * See https://developer.mozilla.org/en-US/docs/Web/Events/mousewheel for choosing a scale and delta mode.
 *
 * @method qc.Mouse#WheelEventProxy
 * @private
 * @param {number} scaleFactor - 作用于滚动值参数的缩放比例
 * @param {integer} deltaMode - 事件的类型.
 */
function WheelEventProxy (scaleFactor, deltaMode) {

    /**
     * @property {number} _scaleFactor - 作用于滚动值参数的缩放比例.
     * @private
     */
    this._scaleFactor = scaleFactor;

    /**
     * @property {number} _deltaMode - 滚动的模式.
     * @private
     */
    this._deltaMode = deltaMode;

    /**
     * @property {any} originalEvent - 原始事件
     * @private
     */
    this.originalEvent = null;
}

WheelEventProxy.prototype = {};
WheelEventProxy.prototype.constructor = WheelEventProxy;

WheelEventProxy.prototype.bindEvent = function (event) {

    if (!WheelEventProxy._stubsGenerated && event)
    {
        var makeBinder = function (name) {

            return function () {
                var v = this.originalEvent[name];
                return typeof v !== 'function' ? v : v.bind(this.originalEvent);
            };

        };

        for (var prop in event)
        {
            if (!(prop in WheelEventProxy.prototype))
            {
                Object.defineProperty(WheelEventProxy.prototype, prop, {
                    get: makeBinder(prop)
                });
            }
        }
        WheelEventProxy._stubsGenerated = true;
    }

    this.originalEvent = event;
    return this;

};

Object.defineProperties(WheelEventProxy.prototype, {
    /**
     * @property {string} 类型
     *
     */
    "type": { value: "wheel" },

    /**
     * @property {number} 滚动模式
     */
    "deltaMode": { get: function () { return this._deltaMode; } },

    /**
     * @property {number} 在Y轴上的滚动距离
     */
    "deltaY": {
        get: function () {
            return (this._scaleFactor * (this.originalEvent.wheelDelta || this.originalEvent.detail)) || 0;
        }
    },

    /**
     * @property {number} 在X轴上的滚动距离
     */
    "deltaX": {
        get: function () {
            return (this._scaleFactor * this.originalEvent.wheelDeltaX) || 0;
        }
    },

    /**
     * @property {number} 在Z轴上的滚动距离
     */
    "deltaZ": { value: 0 }
});
