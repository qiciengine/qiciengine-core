/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 鼠标、触摸等产生点事件
 * @class {qc.Pointer}
 * @constructor
 * @param {qc.Game} game - 游戏
 * @param {number} id - 按键的编号
 */
var Pointer = qc.Pointer = function(game, id) {

    /**
     * @property {qc.Game} game - 记录当前Game对象
     */
    this.game = game;

    /**
     * @property {number} _id - 记录点事件的id, 内部ID，鼠标从-5到-1，触摸从1开始
     * @private
     */
    this._id = id;

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
     * @property {boolean} withinGame - 是否在游戏区域内
     * @type {Boolean}
     */
    this.withinGame = false;

    /**
     * @property {qc.Point | null} previousDownPoint - 上一次点击的状态
     */
    this.previousStatus = [];

    /**
     * @property {Array} _eventList - 当前还未处理的事件列表
     * @private
     */
    this._eventList = [];
};
Pointer.prototype = {};
Pointer.prototype.constructor = Pointer;

Object.defineProperties(Pointer.prototype, {
    /**
     * @property {number} id - 点事件的id
     * @readonly
     */
    id: {
        get: function() { return this._id; }
    },

    /**
     * @property {number} x - 点事件在world坐标系中的X轴坐标
     * @readonly
     */
    x: {
        get: function() { return this._x; }
    },

    /**
     * @property {number} y - 点事件在world坐标系中的Y轴坐标
     * @readonly
     */
    y: {
        get: function() { return this._y; }
    },

    /**
     * @property {number} startX - 记录事件开始时在world坐标系中的X轴坐标
     * @readonly
     */
    startX: {
        get: function() { return this._startX; }
    },

    /**
     * @property {number} startY - 记录事件开始时在world坐标系中的Y轴坐标
     * @readonly
     */
    startY: {
        get : function() { return this._startY; }
    },

    /**
     * @property {boolean} isMouse - 是否是鼠标产生的点事件
     * @readonly
     */
    isMouse: {
        get: function() {
            return this._id < qc.Mouse.NONE && this._id >= qc.Mouse.BUTTON_FORWORD;
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
     * @property {boolean} isDowning - 是否按下过程中
     * @readonly
     */
    isDowning: {
        get: function() { return this._justDown; }
    },

    /**
     * @property {boolean} isUpping -  是否弹起过程中
     * @readonly
     */
    isUpping: {
        get: function() { return this._justUp; }
    },

    /**
     * @property {number} deltaX - 按键最后距离上次处理在x轴上移动的距离
     * @readonly
     */
    deltaX: {
        get: function() { return this._deltaX; }
    },

    /**
     * @property {number} deltaY - 按键最后距离上次处理在y轴上移动的距离
     * @readonly
     */
    deltaY: {
        get: function() { return this._deltaY; }
    },

    /**
     * @property {number} distanceX - 本次事件期间在x轴上移动的距离
     * @readonly
     */
    distanceX: {
        get: function() { return this.x - this.startX; }
    },

    /**
     * @property {number} distanceY - 本次事件期间在y轴上移动的距离
     * @readonly
     */
    distanceY: {
        get: function() { return this.y - this.startY; }
    },

    /**
     * @property {number} deviceId - 按键在系统中的id
     */
    deviceId: {
        get: function() { return this._deviceId || this.id; },
        set: function(value) { this._deviceId = value; }
    },

    /**
     *  @property {number} eventId - 事件的Id，默认返回设备Id
     */
    eventId: {
        get: function() { return this._eventId || this.id; },
        set: function(value) { this._eventId = value; }
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
Pointer.prototype.destroy = function() {
    this.game = null;
};

/**
 * 更新
 * @return {[type]} [description]
 */
Pointer.prototype.update = function() {
    this._deltaX = this._tempX - this._x;
    this._deltaY = this._tempY - this._y;
    this._x = this._tempX;
    this._y = this._tempY;
};

/**
 * 是否还有事件没有处理
 * @returns {boolean}
 */
Pointer.prototype.hasEvent = function() {
    return !!this._eventList.length;
};

/**
 * 更新下一个事件
 * @return {boolean} 返回是否还有事件未处理
 * @internal
 */
Pointer.prototype.nextEvent = function() {
    if (!this._eventList.length) {
        return false;
    }
    var event = this._eventList.shift();
    do {
        if (!event) 
            break;
        switch(event.type) {
            case Pointer.DOWN:
                this.withinGame = true;
                this._onDown(event.x, event.y, event.time);
                break;
            case Pointer.UP:
                this._onUp(event.time);
                break;
            case Pointer.LEAVE:
                this.withinGame = false;
                this._onMove(event.x, event.y);
                break;
            case Pointer.ENTER:
                this.withinGame = true;
                this._onMove(event.x, event.y);
                break;
            case Pointer.MOVE:
                this._onMove(event.x, event.y);
                break;
            case Pointer.CANCEL:
                this._onCancel(event.time);
                break;
        }
        return true;
    } while(false);
    return false;
};

/**
 * 事件开始
 * @param  {[type]} x [description]
 * @param  {[type]} y [description]
 * @return {[type]}   [description]
 */
Pointer.prototype.onDown = function(x, y) {
    // 记录事件
    this._eventList.push({
        type: Pointer.DOWN,
        x: x,
        y: y,
        time: this.game.time.fixedTime
    });
    return true;
};

/**
 * 事件移动
 * @param  {[type]} x [description]
 * @param  {[type]} y [description]
 * @return {[type]}   [description]
 */
Pointer.prototype.onMove = function(x, y) {
    // 记录事件
    var exist = this._eventList.length;
    if (exist > 0 && this._eventList[exist - 1].type === Pointer.MOVE) {
        this._eventList[exist - 1].x = x;
        this._eventList[exist - 1].y = y;
    }
    else {
        this._eventList.push({
            type: Pointer.MOVE,
            x: x,
            y: y
        });    
    }
    return true;
};

/**
 * 事件离开游戏区域
 * @param  {[type]} x [description]
 * @param  {[type]} y [description]
 * @return {[type]}   [description]
 */
Pointer.prototype.onLeave = function(x, y) {
    // 记录事件
    this._eventList.push({
        type: Pointer.LEAVE,
        x: x,
        y: y
    });
    return true;
};

/**
 * 事件进入游戏区域
 * @param  {[type]} x [description]
 * @param  {[type]} y [description]
 * @return {[type]}   [description]
 */
Pointer.prototype.onEnter = function(x, y) {
    // 记录事件
    this._eventList.push({
        type: Pointer.ENTER,
        x: x,
        y: y
    });
    return true;
};

/**
 * 事件弹起
 * @return {[type]} [description]
 */
Pointer.prototype.onUp = function() {
    // 记录事件
    this._eventList.push({
        type: Pointer.UP,
        time: this.game.time.fixedTime
    });
    return true;
};

/**
 * 事件取消
 * @return {[type]} [description]
 */
Pointer.prototype.onCancel = function() {
    // 记录事件
    this._eventList.push({
        type: Pointer.CANCEL,
        time: this.game.time.fixedTime
    });
    return true;
};

/**
 * 按键按下
 * @param x {number} - 按键按下时的x坐标
 * @param y {number} - 按键按下时的y坐标
 * @param downTime {number} - 按键按下时的时间
 * @return {boolean} 状态是否有变更
 * @internal
 */
Pointer.prototype._onDown = function(x, y, downTime) {
    if (this.isDown || this._justDown)
        return false;
    this._justDown = true;
    this.downTime = downTime;
    this._x = x;
    this._y = y;
    this._startX = x;
    this._startY = y;
    this._tempX = x;
    this._tempY = y;
    this._deltaX = 0;
    this._deltaY = 0;
    return true;
};

/**
 * 按键弹起
 * @return {boolean} 状态是否有变更
 * @internal
 */
Pointer.prototype._onUp = function(upTime) {
    if (!(this._isDown || this._justDown) || this._justUp)
        return false;
    this._justUp = true;

    // 记录上一次点击的状态，用于特殊判断
    this.previousStatus.unshift({
        startX: this._startX,
        startY: this._startY,
        endX: this.x,
        endY: this.y,
        downTime: this.downTime,
        upTime: upTime
    });
    while (this.previousStatus.length > 10) {
        this.previousStatus.pop();
    }
    return true;
};

/**
 * 取消按键
 * @return {boolean} 状态是否变更
 */
Pointer.prototype._onCancel = function(cancelTime) {
    if (this._justUp)
        return false;
    this._onUp(cancelTime);
    return true;
};


/**
 * 更新当前按键的位置
 * @param x {number} - 按键当前的x坐标
 * @param y {number} - 按键当前的y坐标
 */
Pointer.prototype._onMove = function(x, y) {
    this._tempX = x;
    this._tempY = y;
};

/**
 * 是否是双击
 * @param doubleTime {number} - 双击允许的时间间隔
 * @param distance {number} - 双击允许的距离间隔
 */
Pointer.prototype.isDouble = function(doubleTime, distance) {

};

Pointer.UP = -1;
Pointer.DOWN = 0;
Pointer.MOVE = 1;
Pointer.ENTER = 2;
Pointer.LEAVE = 3;
Pointer.CANCEL = 4;