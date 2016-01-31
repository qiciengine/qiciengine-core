/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 基本交互的操作的事件
 * @class qc.BaseInputEvent
 * @param {qc.Key|qc.Pointer|object} source - 事件产生的源
 * @constructor
 */
var BaseInputEvent = qc.BaseInputEvent = function(source) {
    /**
     * @property {qc.Key|qc.Pointer|object} source - 事件产生的源
     */
    this.source = source;

    /**
     * @property {boolean} effect
     */
    this.effect = true;
};
BaseInputEvent.prototype = {};
BaseInputEvent.prototype.constructor = BaseInputEvent;

/**
 * 滚轮滚动事件
 * @class qc.WheelEvent
 * @param {number} deltaX - 在x轴上滚动的距离
 * @param {number} deltaY - 在y轴上滚动的距离
 * @constructor
 */
var WheelEvent = qc.WheelEvent = function(deltaX, deltaY) {
    // 继承至BaseInputEvent
    BaseInputEvent.call(this, {deltaX: deltaX, deltaY: deltaY});
};
WheelEvent.prototype = Object.create(BaseInputEvent.prototype);
WheelEvent.prototype.constructor = WheelEvent;

Object.defineProperties(WheelEvent.prototype, {
    /**
     * @property {number} deltaX - 获取x轴上滚动的距离
     * @readonly
     */
    deltaX: {
        get: function() { return this.source.deltaX; }
    },

    /**
     * @property {number} deltaY - 获取y轴上滚动的距离
     * @readonly
     */
    deltaY: {
        get: function() { return this.source.deltaY; }
    }
});

/**
 * 光标移动事件
 * @class qc.CursorMoveEvent
 * @param {number} x - 光标移动到的x轴坐标
 * @param {number} y - 光标移动到的y轴坐标
 * @constructor
 */
var CursorMoveEvent = qc.CursorMoveEvent = function(x, y) {
    // 继承至BaseInputEvent
    BaseInputEvent.call(this, {x: x, y: y});
};
CursorMoveEvent.prototype = Object.create(BaseInputEvent.prototype);
CursorMoveEvent.prototype.constructor = CursorMoveEvent;

Object.defineProperties(CursorMoveEvent.prototype, {
    /**
     * @property {number} x - 获取光标的x轴坐标
     * @readonly
     */
    x: {
        get: function() { return this.source.x; }
    },

    /**
     * @property {number} y - 获取光标的y轴坐标
     * @readonly
     */
    y: {
        get: function() { return this.source.y; }
    }
});

/**
 * 点击移动事件
 * @class qc.PointerEvent
 * @param {qc.Pointer} source -  点击事件的源
 * @constructor
 */
var PointerEvent = qc.PointerEvent = function(source) {
    // 继承至BaseInputEvent
    BaseInputEvent.call(this, source);
};
PointerEvent.prototype = Object.create(BaseInputEvent.prototype);
PointerEvent.prototype.constructor = PointerEvent;

/**
 * 点击事件
 */
var ClickEvent = qc.ClickEvent = function(source) {
    // 继承至PointerEvent
    PointerEvent.call(this, source);
    this.isTap = false;
    this.isDoubleTap = false;
    this.isDoubleClick = false;
};
ClickEvent.prototype = Object.create(PointerEvent.prototype);
ClickEvent.prototype.constructor = ClickEvent;

/**
 * 拖拽开始事件
 * @class qc.DragDropEvent
 * @param {qc.Pointer} source - 产生拖拽的点击事件
 * @construct
 */
var DragStartEvent = qc.DragStartEvent = function(source) {
    // 继承至PointerEvent
    PointerEvent.call(this, source);

    /**
     * @property {boolean} started - 是否开始拖拽
     */
    this.started = true;
};
DragStartEvent.prototype = Object.create(PointerEvent.prototype);
DragStartEvent.prototype.constructor = DragStartEvent;

/**
 * 拖拽事件
 * @class qc.DragDropEvent
 * @param {qc.Pointer} source - 产生拖拽的点击事件
 * @construct
 */
var DragEvent = qc.DragEvent = function(source) {
    // 继承至PointerEvent
    PointerEvent.call(this, source);
};
DragEvent.prototype = Object.create(PointerEvent.prototype);
DragEvent.prototype.constructor = DragEvent;

/**
 * 拖拽结束的事件
 * @class qc.DragEndEvent
 * @param {qc.Pointer} source -  产生拖拽的点击事件
 * @param {*} result - 拖拽到接收方的处理结果
 * @construct
 */
var DragEndEvent = qc.DragEndEvent = function(source, result) {
    // 继承至PointerEvent
    PointerEvent.call(this, source);

    /**
     * @property {*} result - 拖拽处理的结果
     */
    this.result = result;
};
DragEndEvent.prototype = Object.create(PointerEvent.prototype);
DragEndEvent.prototype.constructor = DragEndEvent;

/**
 * 拖拽放下事件
 * @class qc.DropEvent
 * @param {qc.Pointer} source -  产生拖拽的点击事件
 * @param {qc.Node} dragging - 被拖拽的节点
 * @construct
 */
var DropEvent = qc.DropEvent = function(source, dragging) {
    // 继承至PointerEvent
    PointerEvent.call(this, source);
    /**
     * @property {qc.Node} dragging - 被拖拽的节点
     */
    this.dragging = dragging;

    /**
     * @property {*} result - 记录拖拽放下的处理结果
     */
    this.result = null;
};
DropEvent.prototype = Object.create(PointerEvent.prototype);
DropEvent.prototype.constructor = DropEvent;