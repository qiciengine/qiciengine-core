/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 输入交互类，管理Game界面的键盘、鼠标和手指的操作事件。
 *
 * @class qc.Input
 * @param {Phaser.Input} phaser
 * @param {DOM} listenerDOM - 监听事件的DOM元素，默认为window
 * @constructor
 */
var Input = qc.Input = function(phaser) {
    var self = this;

    phaser._qc = self;

    // 替换destroy
    var oldDestroy = phaser.destroy;
    phaser.destroy = function() {
        self.destroy();
        oldDestroy.call(phaser);
    };

    // 替换update
    var oldUpdate = phaser.update;
    phaser.update = function() {
        self.update();
        oldUpdate.call(phaser);
    };

    /**
     * @property {Phaser.Input} phaser - phaser输入对象
     */
    self.phaser = phaser;

    /**
     * @property {qc.Game} game - game对象
     */
    self.game = phaser.game._qc;

    // 是否正在输入计数器
    self._inputting = 0;    

    /**
     * @property {qc.Point} cursorPosition - 当前光标在世界坐标系中的位置，只有鼠标移动会影响该值
     * 当isNaN(cursorPosition.x)或者isNaN(cursorPosition.y)时，光标信息无效
     */
    self.cursorPosition = new qc.Point(NaN, NaN);

    /**
     * @property {Phaser.Signal} onKeyDown - 按键按下的事件派发器，派发键盘，手柄等的按键事件
     * 派发参数：keyCode
     */
    self.onKeyDown = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onKeyUp - 按键弹起的事件派发器，派发键盘，手柄等的按键事件
     * 派发参数：keyCode
     */
    self.onKeyUp = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onKeyRepeat - 按键重复的事件派发器，派发键盘，手柄等的按键事件
     * 派发参数：keyCode
     */
    self.onKeyRepeat = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onCursorMove - 光标移动事件派发器
     * 派发参数：x, y
     */
    self.onCursorMove = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onWheel - 滚动事件派发
     * 派发参数：deltaX, deltaY
     */
    self.onWheel = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onPointerUp - 点事件派发，派发鼠标弹起，触摸结束等点事件
     * 派发参数：id, x, y
     */
    self.onPointerUp = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onPointerDown - 点事件派发，派发鼠标按下，触摸开始等点事件
     * 派发参数：id, x, y
     */
    self.onPointerDown = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onPointerMove - 点事件派发，派发鼠标按下后移动，触摸移动等点事件
     * 派发参数：id, x, y
     */
    self.onPointerMove = new Phaser.Signal();

    /**
     * @property {boolean} nativeMode - 是否直接使用浏览器事件，使用时，所有事件处理处于事件堆栈，否则将事件归集到游戏堆栈处理
     * 注意：javascript 为单线程处理，底层将所有处理当做任务添加到线程中进行处理
     */
    self.nativeMode = false;

    /**
     * @property {qc.Keyboard} keyboard - 键盘监控
     */
    self.keyboard = new qc.Keyboard(this);

    /**
     * @property {qc.Mouse} mouse - 鼠标监控
     */
    self.mouse = new qc.Mouse(this);

    /**
     * @property {qc.Touch} touch - 触摸监控
     */
    self.touch = new qc.Touch(this);

    /**
     * @property {qc.BaseInputModule} module - 事件处理整理模块
     */
    self.module = new qc.BaseInputModule(self.game, self);

    // 进行初始化
    self._init();
};
Input.prototype = {};
Input.prototype.constructor = Input;

Object.defineProperties(Input.prototype, {

    /**
     * @property {number} wheelDeltaX - 本帧滚动的X轴距离
     * @readonly
     */
    wheelDeltaX: {
        get: function() { return this._wheelDeltaX; }
    },

    /**
     * @property {number} wheelDeltaY - 本帧滚动的Y轴距离
     * @readonly
     */
    wheelDeltaY: {
        get: function() { return this._wheelDeltaY; }
    },

    /**
     * @property {number} keyCount - 本帧按下的按键数量
     * @readonly
     */
    keyCount: {
        get: function() { return this.keyboard.keyCount; }
    },

    /**
     * @property {number} keyCodes - 本帧按下的按键键值
     * @readonly
     */
    keyCodes: {
        get: function() { return this.keyboard.keyCodes; }
    },

    /**
     * @property {number} mouseCount - 返回当前鼠标按下的数量
     * @readonly
     */
    mouseCount: {
        get: function() { return this.mouse.mouseCount; }
    },

    /**
     * @property {[number]} mouseIds - 返回当前所有按下的鼠标Id
     * @readonly
     */
    mouseIds: {
        get: function() { return this.mouse.mouseIds; }
    },

    /**
     * @property {number} touchCount - 返回当前触摸点的数量
     * @readonly
     */
    touchCount: {
        get: function() { return this.touch.touchCount; }
    },

    /**
     * @property {[number]} touchIds - 返回当前所有生效的触摸事件Id
     * @readonly
     */
    touchIds: {
        get: function() { return this.touch.touchIds; }
    },

    /**
     * @property {number} pointerCount - 返回当前所有点事件的数量
     * @readonly
     */
    pointerCount: {
        get: function() { return this.mouseCount + this.touchCount; }
    },

    /**
     * @property {[number]} pointers - 返回当前所有的点事件Id
     * @readonly
     */
    pointers: {
        get: function() { return this.mouseIds.concat(this.touchIds); }
    },

    /**
     * @property {boolean} enabled - 鼠标交互开关，默认启动
     */
    enable: {
        get: function() { return this._enable; },
        set: function(value) { this._setEnable(value); }
    },

    /**
     * @property {boolean} inputting - 判断当前是否处于编辑状态
     * @readonly
     */
    inputting: {
        get: function () { return this._inputting > 0; }
    }
});

/**
 * 执行初始化
 * @private
 */
Input.prototype._init = function() {
    var self = this;

    // 添加焦点失去监听
    self.phaser.game.onBlur.add(this._onBlur, this);

    // 添加键盘事件监听
    self.keyboard.onKeyUp.add(this.processKeyUp, this);
    self.keyboard.onKeyDown.add(this.processKeyDown, this);
    self.keyboard.onKeyRepeat.add(this.processKeyRepeat, this);

    // 添加鼠标事件监听
    self.mouse.onMouseDown.add(this.processPointerDown, this);
    self.mouse.onMouseUp.add(this.processPointerUp, this);
    self.mouse.onMousePressMove.add(this.processPointerMove, this);
    self.mouse.onMouseMove.add(this.processMouseMove, this);
    self.mouse.onMouseWheel.add(this.processMouseWheel, this);

    // 添加触摸事件监听
    self.touch.onTouchStart.add(this.processPointerDown, this);
    self.touch.onTouchEnd.add(this.processPointerUp, this);
    self.touch.onTouchMove.add(this.processPointerMove, this);

    self.enable = true;
};

/**
 * 销毁
 * @internal
 */
Input.prototype.destroy = function() {
    // 移除监听
    this.phaser.game.onBlur.remove(this._onBlur, this);
    this.keyboard.onKeyUp.remove(this.processKeyUp, this);
    this.keyboard.onKeyDown.remove(this.processKeyDown, this);
    this.keyboard.onKeyRepeat.remove(this.processKeyRepeat, this);

    this.mouse.onMouseDown.remove(this.processPointerDown, this);
    this.mouse.onMouseUp.remove(this.processPointerUp, this);
    this.mouse.onMousePressMove.remove(this.processPointerDown, this);
    this.mouse.onMouseMove.remove(this.processMouseMove, this);
    this.mouse.onMouseWheel.remove(this.processMouseWheel, this);

    this.touch.onTouchStart.remove(this.processPointerDown, this);
    this.touch.onTouchEnd.remove(this.processPointerUp, this);
    this.touch.onTouchMove.remove(this.processPointerMove, this);

    // 销毁模块
    if (this.module)
        this.module.destroy();

    // 销毁键盘
    if (this.keyboard)
        this.keyboard.destroy();

    // 销毁鼠标
    if (this.mouse)
        this.mouse.destroy();

    // 销毁触摸
    if (this.touch)
        this.touch.destroy();

    // 释放所有事件
    this.onKeyDown.removeAll();
    this.onKeyUp.removeAll();
    this.onKeyRepeat.removeAll();

    this.onCursorMove.removeAll();
    this.onWheel.removeAll();

    this.onPointerDown.removeAll();
    this.onPointerMove.removeAll();
    this.onPointerUp.removeAll();

    // 取消引用
    this.phaser = null;
    this.module = null;
    this.keyboard = null;
    this.mouse = null;
    this.touch = null;
};

/**
 * 设置是否可以接受事件
 * @param value
 * @private
 */
Input.prototype._setEnable = function(value) {
    // enabled状态为改变不做处理
    if (this._enable === value) {
        return;
    }

    this._enable = value;

    if (this.touch)
        this.touch.enable = value;

    if (this.mouse)
        this.mouse.enable = value;

    if (this.keyboard)
        this.keyboard.enable = value;
};

/**
 * 更新当前输入的事件
 * @internal
 */
Input.prototype.update = function() {
    // 滚动距离每帧清0
    this._wheelDeltaX = 0;
    this._wheelDeltaY = 0;
    //if (!this.nativeMode) {
    this.keyboard.update();
    this.touch.update();
    this.mouse.update();
    //}
    this.module.update();
};

/**
 * 当游戏失去焦点时，处理各个模块的清理操作
 * @private
 */
Input.prototype._onBlur = function() {
    // 模块最优先处理，因为处理时可能需要获取设备的状态
    this.module.lossFocus();

    this.keyboard.lossFocus();
    this.mouse.lossFocus();
    this.touch.lossFocus();

};

/**
 * 处理按键按下的事件通知
 * @param keyCode {number} - 按键的键值
 * @param charCode {number} - 对应字符的ASCII值
 */
Input.prototype.processKeyDown = function(keyCode, charCode) {
    this.onKeyDown.dispatch(keyCode, charCode);
};

/**
 * 处理按键弹起的事件通知
 * @param keyCode {number} - 按键的键值
 * @param charCode {number} - 对应字符的ASCII值
 */
Input.prototype.processKeyUp = function(keyCode, charCode) {
    this.onKeyUp.dispatch(keyCode, charCode);
};

/**
 * 处理按键重复的事件通知
 * @param keyCode {number} - 按键的键值
 * @param charCode {number} - 对应字符的ASCII值
 */
Input.prototype.processKeyRepeat = function(keyCode, charCode) {
    this.onKeyRepeat.dispatch(keyCode, charCode);
};

/**
 * 按键是否按下
 * @param keyCode {number} - 按键的键值
 * @return {boolean}
 */
Input.prototype.isKeyDown = function(keyCode) {
    return this.keyboard.isKeyDown(keyCode);
};

/**
 * 当前帧是否有按键按下
 * @returns {Function}
 */
Input.prototype.isAnyKeyDown = function() {
    return this.keyboard.isAnyKeyDown();
};

/**
 * 是否有按键处于按下状态
 * @returns {Function}
 */
Input.prototype.isAnyKey = function() {
    return this.keyboard.isAnyKey();
};

/**
 * 功能键alt是否按下
 * @return {boolean}
 */
Input.prototype.isAltDown = function() {
    return this.isKeyDown(qc.Keyboard.ALT);
};

/**
 * 功能键constrol是否按下
 * @return {boolean}
 */
Input.prototype.isControlDown = function() {
    return this.isKeyDown(qc.Keyboard.CONTROL);
};

/**
 * 功能键shift是否按下
 * @return {boolean}
 */
Input.prototype.isShiftDown = function() {
    return this.isKeyDown(qc.Keyboard.SHIFT);
};

/**
 * 功能键win徽标键或者mac Command键是否按下
 * @return {boolean}
 */
Input.prototype.isMetaDown = function() {
    return this.isKeyDown(qc.Keyboard.META) ||
        this.isKeyDown(qc.Keyboard.META_RWIN) ||
        this.isKeyDown(qc.Keyboard.META_RMAC);
};

/**
 * 是否存在光标
 * @return {boolean}
 */
Input.prototype.hasCursor = function() {
    return !isNaN(this.cursorPosition.x) &&
            !isNaN(this.cursorPosition.y);
};

/**
 * 判断一个设备Id是否是鼠标
 * @param id {number} - 设备Id
 * @return {boolean}
 */
Input.prototype.isMouse = function(id) {
    return id < 0 && id >= qc.Mouse.BUTTON_FORWORD;
};

/**
 * 是否有鼠标按下中
 * @return {boolean}
 */
Input.prototype.isAnyMouse = function() {
    return this.mouse.isAnyMouse();
};

/**
 * 当前帧是否有鼠标按下
 * @return {boolean}
 */
Input.prototype.isAnyMouseDown = function() {
    return this.mouse.isAnyMouseDown();
};

/**
 * 指定鼠标是否按下
 * @param id {number} - 鼠标id
 * @returns {boolean}
 */
Input.prototype.isMouseDown = function(id) {
    return this.mouse.isMouseDown(id);
};

/**
 * 是否有触摸执行中
 * @returns {boolean}
 */
Input.prototype.isAnyTouch = function() {
    return this.touch.isAnyTouch();
};

/**
 * 当前帧是否有触摸开始
 * @return {boolean}
 */
Input.prototype.isAnyTouchStart = function() {
    return this.touch.isAnyTouchStart();
};

/**
 * 指定id的触摸事件是否开始
 * @param id {number} - 设备Id
 * @returns {boolean}
 */
Input.prototype.isTouchStart = function(id) {
    return this.touch.isTouchStart(id);
};

/**
 * 是否有触摸、鼠标等点事件执行中
 * @returns {boolean}
 */
Input.prototype.isAnyPointer = function() {
    return this.touch.isAnyTouch() || this.mouse.isAnyMouse();
};

/**
 * 当前帧是否有触摸、鼠标等点事件开始
 * @return {boolean}
 */
Input.prototype.isAnyPointerStart = function() {
    return this.touch.isAnyTouchStart() || this.mouse.isAnyMouseDown();
};

/**
 * 指定id的点事件是否开始
 * @param id {number} - 设备Id
 * @returns {boolean}
 */
Input.prototype.isPointerStart = function(id) {
    return this.isMouse(id) ? this.isMouseDown(id) : this.isTouchStart(id);
};

/**
 * 通过id查找已经存在的点
 * @param id {number} - 设备Id
 * @return {qc.Pointer}
 * @private
 */
Input.prototype.getPointer = function(id) {
    if (id < 0 && id >= qc.Mouse.BUTTON_FORWORD)
        return this.mouse.getMouseById(id);
    return this.touch.getTouchById(id);
};

/**
 * 鼠标移动事件的处理
 * @param x {number} - 移动到的世界x轴坐标
 * @param y {number} - 移动到的事件y轴坐标
 */
Input.prototype.processMouseMove = function(x, y) {
    this.cursorPosition.x = x;
    this.cursorPosition.y = y;

    this.onCursorMove.dispatch(x, y);
};

/**
 * 处理鼠标的滚动事件
 * @param deltaX {number} - 在x轴上滚动的距离
 * @param deltaY {number} - 在x轴上滚动的距离
 */
Input.prototype.processMouseWheel = function(deltaX, deltaY) {
    this._wheelDeltaX = deltaX;
    this._wheelDeltaY = deltaY;

    this.onWheel.dispatch(deltaX, deltaY);
};

/**
 * 处理鼠标按下，触摸开始等事件
 * @param id {number} - 设备编号
 * @param x {number} - 事件发生时的x轴坐标
 * @param y {number} - 事件发生时的y轴坐标
 */
Input.prototype.processPointerDown = function(id, x, y) {
    this.onPointerDown.dispatch(id, x, y);
};

/**
 * 处理鼠标弹起，触摸结束等事件
 * @param id {number} - 设备编号
 * @param x {number} - 事件发生时的x轴坐标
 * @param y {number} - 事件发生时的y轴坐标
 */
Input.prototype.processPointerUp = function(id, x, y) {
    this.onPointerUp.dispatch(id, x, y);
};

/**
 * 处理鼠标按下移动，触摸移动等事件
 * @param id {number} - 设备编号
 * @param x {number} - 事件发生时的x轴坐标
 * @param y {number} - 事件发生时的y轴坐标
 */
Input.prototype.processPointerMove = function(id, x, y) {
    this.onPointerMove.dispatch(id, x, y);
};

/**
 * 是否需要忽略dom上触发的事件
 */
Input.prototype.ignoreDomEvent = function(event) {
    var self = this;
    var domNode = self.findDomNodeWithEvent(event);
    return domNode && domNode.interactive && domNode.hitArea;
};

/**
 * 按事件查找对应的dom节点
 */
Input.prototype.findDomNodeWithEvent = function(event) {
    var self = this;
    var target = event.target;
    if (!target ||
        target === self.game.world.frontDomRoot ||
        target === self.game.world.backDomRoot ||
        target === self.game.canvas.parentNode) {
        return null;
    }
    while (target && !target._qc) {
        target = target.parentNode;
    }

    if (!target) {
        return null;
    }

    return target._qc;
};
