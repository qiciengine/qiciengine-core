/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 键盘事件
 * @class {qc.Key}
 * @constructor
 * @param {qc.Game} game - 游戏
 * @param {number} keycode - 按键的keycode
 */
var Key = qc.Key = function(game, keycode) {
    /**
     * @property {qc.Game} game - 记录当前Game对象
     */
    this.game = game;

    /**
     * @property {number} _keycode - 记录点事件的id
     */
    this._keycode = keycode;

    /**
     * @property {boolean} _isDown - 是否按下
     * @private
     */
    this._isDown = false;

    /**
     * @property {boolean} _justDown - 是否刚按下还未派发down事件
     * @private
     */
    this._justDown = false;

    /**
     * @property {boolean} _justUp - 是否刚弹起还未派发up事件
     * @private
     */
    this._justUp = false;

    /**
     * @property {number} downTime - 按键按下的时间
     */
    this.downTime = 0;

    /**
     * @property {number} repeats - 当前按键重复的次数
     */
    this.repeats = 0;

    /**
     * @property {number} _lastRepeatTime - 最后一次重复事件的时间
     * @private
     */
    this._lastRepeatTime = 0;

    /**
     * @property {Array} _eventList - 当前还未处理的事件列表
     * @private
     */
    this._eventList = [];
};
Key.prototype = {};
Key.prototype.constructor = Key;

Object.defineProperties(Key.prototype, {
    /**
     * @property {number} keyCode - 按键事件的keyCode
     * @readonly
     */
    keyCode: {
        get: function() { return this._keycode; }
    },

    /**
     * @property {number} currCharCode - 按键事件当前对应的字符的ASCII码
     */
    currCharCode: {
        get: function() { return this._charCode; },
        set: function(value) {
            this._charCode = value;
        }
    },

    /**
     * @property {boolean} isJustDown - 是否刚刚按下
     * @readonly
     */
    isJustDown: {
        get: function() {
            var value = this._justDown;
            if (value) {
                this._justDown = false;
                this._isDown = true;
            }
            return value;
        }
    },

    /**
     * @property {boolean} isJustUp - 是否刚刚弹起
     * @readonly
     */
    isJustUp: {
        get: function() {
            var value = this._justUp;
            if (value) {
                this._justUp = false;
                this._isDown = false;
            }
            return value;
        }
    },

    /**
     * @property {boolean} isDown - 按键是否按下
     * @readonly
     */
    isDown: {
        get: function() { return this._isDown; }
    },

    /**
     * @prototype {number} duringTime - 开始经历的时间,负值表示还未按下
     * @readonly
     */
    duringTime: {
        get: function() {
            if (!this.isDown) {
                return -1;
            }
            return this.game.time.fixedTime - this.downTime;
        }
    }
});

/**
 * 销毁
 * @internal
 */
Key.prototype.destroy = function() {
    this.game = null;
};

/**
 * 是否还有事件没有处理
 * @returns {boolean}
 */
Key.prototype.hasEvent = function() {
    return !!this._eventList.length;
};

/**
 * 更新下一个事件
 * @return {boolean} 返回是否还有事件未处理
 * @internal
 */
Key.prototype.nextEvent = function() {
    if (!this._eventList.length) {
        return false;
    }
    var event = this._eventList.shift();
    do {
        if (!event)
            break;
        switch(event.type) {
            case Key.DOWN:
                this._onDown(event.time);
                break;
            case Pointer.UP:
                this._onUp();
                break;
        }
        return true;
    } while(false);
    return false;
};

/**
 * 按键按下
 * @return {boolean} 状态是否有变更
 * @internal
 */
Key.prototype.onDown = function() {
    // 记录事件
    this._eventList.push({
        type: Key.DOWN,
        time: this.game.time.fixedTime
    });
    return true;
};

/**
 * 处理按键弹起
 * @return {boolean} 状态是否有变更
 * @internal
 */
Key.prototype.onUp = function() {
    // 记录事件
    this._eventList.push({
        type: Key.UP
    });
    return true;
};

/**
 * 处理按键按下
 * @return {boolean} 状态是否有变更
 * @internal
 */
Key.prototype._onDown = function(downTime) {
    if (this.isDown || this._justDown)
        return false;
    this._justDown = true;
    this.downTime = downTime;
    this._lastRepeatTime = this.downTime;
    return true;
};

/**
 * 按键弹起
 * @return {boolean} 状态是否有变更
 * @internal
 */
Key.prototype._onUp = function() {
    if (!(this._isDown || this._justDown) || this._justUp) {
        return false;
    }

    this._justUp = true;
    return true;
};

/**
 * 直接设置状态
 * @param isDown {boolean} 是否是按下状态
 * @return {boolean} 状态是否有改变
 */
Key.prototype.setState = function(isDown) {
    var oldState = (this._isDown || this._justDown) && !this._justUp;
    this._isDown = isDown;
    this._justDown = false;
    this._justUp = false;
    return oldState ^ isDown;
};

/**
 * 返回是否触发重复按键
 * @param repeatInterval {nubmer} - 检测的间隔时间
 * @returns {boolean}
 */
Key.prototype.checkRepeat = function(repeatInterval) {
    if (!this.isDown)
        return false;
    var time = this.game.time.fixedTime;
    if (time - this._lastRepeatTime - repeatInterval > 0) {
        this.repeats++;
        this._lastRepeatTime = time;
        return true;
    }
    return false;
};

Key.UP = -1;
Key.DOWN = 0;