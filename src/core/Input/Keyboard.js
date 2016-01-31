/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
/**
 * 键盘输入交互功能。
 *
 * @class qc.Keyboard
 * @param {qc.Input} input - 输入事件处理器
 * @param {DOM} generator -  事件的发生器，一般为DOM元素，默认为window
 * @internal
 */
var Keyboard = qc.Keyboard = function(input, generator) {

    /**
     * @property {qc.Input} input -  本地的交互事件处理器
     */
    this.input = input;

    /**
     * @property {qc.Game} game - 游戏对象
     */
    this.game = input.game;

    /**
     * @property {number} repeatInterval - 按键重复的间隔时间，单位毫秒(ms)
     */
    this.repeatInterval = 100;

    /**
     * @property {Phaser.Signal} onKeyDown - 按键按下时的事件
     * 通知参数：keyCode, charCode
     */
    this.onKeyDown = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onKeyUp - 按键弹起时的事件
     * 通知参数：keyCode, charCode
     */
    this.onKeyUp = new Phaser.Signal();

    /**
     * @property {Phaser.Signal} onKeyRepeat - 按键重复时的事件
     * 通知参数：keyCode, charCode
     */
    this.onKeyRepeat = new Phaser.Signal();

    /**
     * @property [qc.Key] _keys - 缓存当前按下的key
     * @private
     */
    this._keys = [];

    /**
     * @property {{number: boolean}} _keyCodes - 缓存当前按下的keyCode
     * @private
     */
    this._keyCodes = {};

    /**
     * @property {[qc.Key]} _capture - 按键事件是否被中止派发
     * @private
     */
    this._capture = {};

    /**
     * @property {number} _keyDownNum - 当前按下的按键数
     * @private
     */
    this._keyDownNum = 0;

    /**
     * @property {boolean} _anyKeyDown - 当前帧内是否有按键按下
     * @private
     */
    this._anyKeyDown = false;

    // 进行初始化
    this._init(generator);
};
Keyboard.prototype = {};
Keyboard.prototype.constructor = Keyboard;

Object.defineProperties(Keyboard.prototype, {

    /**
     * @property {boolean} enabled - 键盘交互开关，初始化时默认启动
     */
    enable: {
        get: function() { return this._enable; },
        set: function(value) { this._setEnable(value); }
    },

    /**
     *
     * @property {DOM} generator - 键盘事件的发生器，一般为HTML DOM对象
     * 当设置为空时，使用window作为事件发生器
     */
    generator: {
        get: function() { return this._generator || window; },
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
     * @property {number} gainFocusType - 键盘事件发生器获取焦点的类型，当发生器不是window时生效
     */
    gainFocusType: {
        get: function() { return this._gainFocusType; },
        set: function(value) { this._gainFocusType = value; }
    },

    /**
     * @property {number} keyCount - 返回当前按下的按键数量
     * @readonly
     */
    keyCount: {
        get: function() { return this._keyDownNum; }
    },

    /**
     * @property {[number]} keyCodes - 返回当前所有按下的键值
     * @readonly
     */
    keyCodes: {
        get: function() { return Object.keys(this._keyCodes); }
    }
});

/**
 * 初始化
 * @param generator
 * @private
 */
Keyboard.prototype._init = function(generator) {
    // 键盘交互事件回调
    this._onKeyDown = this._processKeyDown.bind(this);
    this._onKeyUp = this._processKeyUp.bind(this);
    this._onBlur = this.lossFocus.bind(this);

    // 焦点获取涉及到的鼠标触摸事件
    this._onMouseOver = this._onOver.bind(this);
    this._onMouseClick = this._onClick.bind(this);

    // 设置事件发生器
    this.generator = generator;
    this.gainFocusType = Keyboard.GAINFOCUS_CLICK;
    this.enable = true;

    // window PC 的 alt down 会使游戏失去焦点，导致后续的按键事件无法触发
    // 此处将 alt 事件捕获
    if (this.game.device.phaser.windows && this.game.device.phaser.desktop)
        this.addKeyCapture(Keyboard.ALT);
};

/**
 * 销毁
 * @internal
 */
Keyboard.prototype.destroy = function() {
    this.enable = false;

    this.input = null;
    this.generator = null;

    this._onKeyDown = null;
    this._onKeyUp = null;
    this._onBlur = null;
    this._onMouseOver = null;
    this._onMouseClick = null;
};

/**
 * 更新当前输入的事件
 * @internal
 */
Keyboard.prototype.update = function() {
    if (!this.enable)
        return;

    this._anyKeyDown = false;

    var i = this._keys.length;
    var key;
    while (i--) {
        key = this._keys[i];
        if (!key)
            continue;
        while (key.nextEvent()) {
            // 先检测按下
            if (key.isJustDown) {
                this._anyKeyDown = true;
                this._recordKey(key.keyCode, true);
                this.onKeyDown.dispatch(key.keyCode);
            }

            // 检测弹起
            if (key.isJustUp) {
                this._recordKey(key.keyCode, false);
                this.onKeyUp.dispatch(key.keyCode);
            }

            // 检测重复事件
            if (key.checkRepeat(this.repeatInterval))
                this.onKeyRepeat.dispatch(key._keycode);
        }
    }
};

/**
 * 判定键值是否按下
 * @param keyCode 指定键值
 * @return {boolean} 如果按下返回true，否则返回false
 */
Keyboard.prototype.isKeyDown = function(keyCode) {
    return this._keys[keyCode] && this._keys[keyCode].isDown;
};

/**
 * 判定是否有任何按键处于按下状态
 * @return {boolean}
 */
Keyboard.prototype.isAnyKey = function() {
    return this._keyDownNum > 0;
};

/**
 * 判定是否有任何按键在当前帧按下
 * @return {number}
 */
Keyboard.prototype.isAnyKeyDown = function() {
    return this._anyKeyDown;
};

/**
 * 记录按键状态
 * @param keyCode {number}
 * @param isDown {boolean} 是否按下
 * @private
 */
Keyboard.prototype._recordKey = function(keyCode, isDown) {
    if (isDown) {
        this._keyDownNum++;
        this._keyCodes[keyCode] = true;
    }
    else {
        this._keyDownNum--;
        delete this._keyCodes[keyCode];
    }

};

/**
 * 设置是否可以接受键盘事件
 * @param value
 * @private
 */
Keyboard.prototype._setEnable = function(value) {
    // enabled状态为改变不做处理
    if (this._enable === value) {
        return;
    }
    this._enable = value;

    var generator = this.generator;

    // 监控键盘事件
    if (value) {
        generator.addEventListener('keydown', this._onKeyDown, false);
        generator.addEventListener('keyup', this._onKeyUp, false);
        generator.addEventListener('blur', this._onBlur, false);
        this._addFocusAbility(generator, true);
    }
    else {
        generator.removeEventListener('keydown', this._onKeyDown);
        generator.removeEventListener('keyup', this._onKeyUp);
        generator.removeEventListener('blur', this._onBlur);
        this._removeFocusAbility(generator);
        this._clearKeys();
    }
};

/**
 * 为dom设置获取键盘焦点的能力
 * @param dom {DOM} 需要获取键盘焦点能力的DOM对象
 * @param gainFocus {boolean} 是否马上获取焦点
 * @private
 */
Keyboard.prototype._addFocusAbility = function(dom, gainFocus) {
    // window为顶层window不需要
    if (dom === window && (!window.parent || window.parent === window))
        return;

    // 如果不是window对象，则添加一个tabindex的DOM，使其可以获得焦点
    dom.tabIndex = dom.tabIndex || -1;

    var self = this;
    dom.addEventListener('mouseover', self._onMouseOver, false);
    dom.addEventListener('click', self._onMouseClick, false);
    this.input.onPointerDown.add(self._onMouseClick, self);
    if (gainFocus)
    {
        setTimeout(function() {
            self.gainFocus();
        }, 1);
    }
};

/**
 * 移除dom设置的键盘焦点获取能力
 * @param dom {DOM} 需要释放获取键盘焦点能力的对象
 * @private
 */
Keyboard.prototype._removeFocusAbility = function(dom) {
    // windows不需要
    if (dom === window && (!window.parent || window.parent === window))
        return;

    dom.removeEventListener('mouseover', this._onMouseOver);
    dom.removeEventListener('click', this._onMouseClick);
    this.input.onPointerDown.remove(this._onMouseClick, this);
};

/**
 * 准备按键
 * @param keyCode
 * @private
 */
Keyboard.prototype._prepareKey = function(keyCode) {
    if (!this._keys[keyCode])
        this._keys[keyCode] = new qc.Key(this.game, keyCode);
}

/**
 * 设置修饰键状态
 * @param event {DOM.event} 点击事件
 * @param eventKey {number} 事件的原始键值
 */
Keyboard.prototype.setModifierKeysState = function(event, eventKey) {
    // 事件不存在修饰键值
    if (event.altKey === undefined)
        return;

    this._setKeyCodeState(Keyboard.ALT, event.altKey, eventKey);
    this._setKeyCodeState(Keyboard.SHIFT, event.shiftKey, eventKey);
    this._setKeyCodeState(Keyboard.CONTROL, event.ctrlKey, eventKey);
    if (eventKey != Keyboard.META &&
        eventKey != Keyboard.META_RWIN &&
        eventKey != Keyboard.META_RMAC)
    {
        this._setKeyCodeState(Keyboard.META, event.metaKey, eventKey);
    }
};

/**
 * 强制设置按键状态，不触发keydown或者keyup
 * @param keyCode {number} - 要设置的键值
 * @param isDown {boolean} - 是否按下
 * @private
 */
Keyboard.prototype._setKeyCodeState = function(keyCode, isDown, eventKey) {
    // 当强制设置的键值于事件发生的键值一致时，不进行处理
    if (keyCode === eventKey)
        return;
    this._prepareKey(keyCode);
    if (this._keys[keyCode].setState(isDown))
        this._recordKey(keyCode, isDown);
};

/**
 * 当按键按下时
 * @param event
 * @private
 */
Keyboard.prototype._processKeyDown = function(event) {
    this._prepareKey(event.keyCode);
    if (this._capture[event.keyCode]) {
        event.preventDefault();
    }
    // 记录键值，如果按键已经是按下状态，则不触发keydown事件
    this._keys[event.keyCode].onDown();

    this._keys[event.keyCode].currCharCode = event.charCode;

    // 当在失去焦点时按下功能键，缓存中没有功能键的状态
    // 补上功能键的状态，但不触发KeyDown
    this.setModifierKeysState(event, event.keyCode);

    this.input.nativeMode && this.update();
};

/**
 * 当按键弹起时
 * @param event
 * @private
 */
Keyboard.prototype._processKeyUp = function(event) {
    this._prepareKey(event.keyCode);
    if (this._capture[event.keyCode]) {
        event.preventDefault();
    }
    // 记录键值，如果按键已经是弹起状态，则不触发keyUp事件
    this._keys[event.keyCode].onUp();

    // 当在失去焦点时按下功能键，缓存中没有功能键的状态
    // 补上功能键的状态，但不触发KeyUp
    this.setModifierKeysState(event, event.keyCode);
    this.input.nativeMode && this.update();
};

/**
 * 当鼠标经过发生器时
 * @param event
 * @private
 */
Keyboard.prototype._onOver = function(event) {
    if (this.gainFocusType === Keyboard.GAINFOCUS_OVER)
        this.gainFocus();
};

/**
 * 当发生点击事件时
 * @param event
 * @private
 */
Keyboard.prototype._onClick = function(event) {
    if (this.gainFocusType === Keyboard.GAINFOCUS_CLICK)
        this.gainFocus();
};

/**
 * 得到当前窗口的输入焦点
 * @internal
 */
Keyboard.prototype.gainFocus = function(ignore) {
    // 仅当DOM不是window时可以获得焦点
    if (this.generator !== window || (window.parent && window.parent !== window))
    {
        this.generator.focus();
    }
    // TODO: 如果位置发生变化是否需要将位置还原

};

/**
 * 清理所有的事件混存
 * @private
 */
Keyboard.prototype._clearKeys = function() {
    while (this._keys.length > 0)
    {
        var key = this._keys.pop();
        if (key)
            key.destroy();
    }
    this._keyDownNum = 0;
    this._keyCodes = {};
};

/**
 * 当失去输入焦点时调用，用来释放缓存的按键信息
 * @internal
 */
Keyboard.prototype.lossFocus = function() {
    this._clearKeys();
};

/**
 * 默认处理键盘事件时，不会设置事件中止，按键事件将继续传递下去，
 * 一些特殊的功能键可能被浏览器上层捕获，比如 up，down，left，right会引起其他特殊的效果
 * 如果需要中止事件，则调用该方法设置需要中止的按键事件
 * @param keycode {number} 需要中止的事件的键值
 */
Keyboard.prototype.addKeyCapture = function(keycode) {

    if (typeof keycode === 'object')
    {
        for (var key in keycode)
        {
            this._capture[keycode[key]] = true;
        }
    }
    else
    {
        this._capture[keycode] = true;
    }
};

/**
 * 默认处理键盘事件时，将已经设置中止的键值事件中止，
 * 如果需要按键事件将继续传递下去，则调用该方法取消中止该按键事件
 * @param keyCode
 */
Keyboard.prototype.removeKeyCapture = function(keyCode) {
    delete this._capture[keyCode];
};

/**
 * 取消所有的按键事件中止设置
 */
Keyboard.prototype.clearCapture = function() {
    this._capture = {};
}

/**
 * 当事件发生器不是window时，当鼠标或者光标移动到发生器区域时获得焦点
 * @constant
 * @type {number}
 */
Keyboard.GAINFOCUS_OVER = 0;

/**
 * 当事件发生器不是window时，当点击发生器区域时获得焦点
 * @constant
 * @type {number}
 */
Keyboard.GAINFOCUS_CLICK = 1;

/**
 * 定义按键信息
 * @type {Number}
 */
Keyboard.A = "A".charCodeAt(0);
Keyboard.B = "B".charCodeAt(0);
Keyboard.C = "C".charCodeAt(0);
Keyboard.D = "D".charCodeAt(0);
Keyboard.E = "E".charCodeAt(0);
Keyboard.F = "F".charCodeAt(0);
Keyboard.G = "G".charCodeAt(0);
Keyboard.H = "H".charCodeAt(0);
Keyboard.I = "I".charCodeAt(0);
Keyboard.J = "J".charCodeAt(0);
Keyboard.K = "K".charCodeAt(0);
Keyboard.L = "L".charCodeAt(0);
Keyboard.M = "M".charCodeAt(0);
Keyboard.N = "N".charCodeAt(0);
Keyboard.O = "O".charCodeAt(0);
Keyboard.P = "P".charCodeAt(0);
Keyboard.Q = "Q".charCodeAt(0);
Keyboard.R = "R".charCodeAt(0);
Keyboard.S = "S".charCodeAt(0);
Keyboard.T = "T".charCodeAt(0);
Keyboard.U = "U".charCodeAt(0);
Keyboard.V = "V".charCodeAt(0);
Keyboard.W = "W".charCodeAt(0);
Keyboard.X = "X".charCodeAt(0);
Keyboard.Y = "Y".charCodeAt(0);
Keyboard.Z = "Z".charCodeAt(0);
Keyboard.ZERO = "0".charCodeAt(0);
Keyboard.ONE = "1".charCodeAt(0);
Keyboard.TWO = "2".charCodeAt(0);
Keyboard.THREE = "3".charCodeAt(0);
Keyboard.FOUR = "4".charCodeAt(0);
Keyboard.FIVE = "5".charCodeAt(0);
Keyboard.SIX = "6".charCodeAt(0);
Keyboard.SEVEN = "7".charCodeAt(0);
Keyboard.EIGHT = "8".charCodeAt(0);
Keyboard.NINE = "9".charCodeAt(0);
Keyboard.NUMPAD_0 = 96;
Keyboard.NUMPAD_1 = 97;
Keyboard.NUMPAD_2 = 98;
Keyboard.NUMPAD_3 = 99;
Keyboard.NUMPAD_4 = 100;
Keyboard.NUMPAD_5 = 101;
Keyboard.NUMPAD_6 = 102;
Keyboard.NUMPAD_7 = 103;
Keyboard.NUMPAD_8 = 104;
Keyboard.NUMPAD_9 = 105;
Keyboard.NUMPAD_MULTIPLY = 106;
Keyboard.NUMPAD_ADD = 107;
Keyboard.NUMPAD_ENTER = 108;
Keyboard.NUMPAD_SUBTRACT = 109;
Keyboard.NUMPAD_DECIMAL = 110;
Keyboard.NUMPAD_DIVIDE = 111;
Keyboard.F1 = 112;
Keyboard.F2 = 113;
Keyboard.F3 = 114;
Keyboard.F4 = 115;
Keyboard.F5 = 116;
Keyboard.F6 = 117;
Keyboard.F7 = 118;
Keyboard.F8 = 119;
Keyboard.F9 = 120;
Keyboard.F10 = 121;
Keyboard.F11 = 122;
Keyboard.F12 = 123;
Keyboard.F13 = 124;
Keyboard.F14 = 125;
Keyboard.F15 = 126;
Keyboard.COLON = 186;
Keyboard.EQUALS = 187;
Keyboard.UNDERSCORE = 189;
Keyboard.QUESTION_MARK = 191;
Keyboard.TILDE = 192;
Keyboard.OPEN_BRACKET = 219;
Keyboard.BACKWARD_SLASH = 220;
Keyboard.CLOSED_BRACKET = 221;
Keyboard.QUOTES = 222;
Keyboard.BACKSPACE = 8;
Keyboard.TAB = 9;
Keyboard.CLEAR = 12;
Keyboard.ENTER = 13;
Keyboard.SHIFT = 16;
Keyboard.CONTROL = 17;
Keyboard.ALT = 18;
Keyboard.META = 91;
Keyboard.META_RWIN = 92;
Keyboard.META_RMAC = 93;
Keyboard.CAPS_LOCK = 20;
Keyboard.ESC = 27;
Keyboard.SPACEBAR = 32;
Keyboard.PAGE_UP = 33;
Keyboard.PAGE_DOWN = 34;
Keyboard.END = 35;
Keyboard.HOME = 36;
Keyboard.LEFT = 37;
Keyboard.UP = 38;
Keyboard.RIGHT = 39;
Keyboard.DOWN = 40;
Keyboard.INSERT = 45;
Keyboard.DELETE = 46;
Keyboard.HELP = 47;
Keyboard.NUM_LOCK = 144;
Keyboard.PLUS = 43;
Keyboard.MINUS = 45;
