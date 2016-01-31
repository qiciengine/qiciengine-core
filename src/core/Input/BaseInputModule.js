/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 输入触摸模块，将简单的系统事件转化为各类操作事件，例如 click，drag等
 *
 * @class qc.BaseInputModule
 * @param {qc.Game} game - 游戏对象
 * @param {qc.Input} input - 输入对戏那个
 * @constructor
 */
var BaseInputModule = qc.BaseInputModule = function(game, input) {
    /**
     * @property {qc.Game} game - 游戏对象
     */
    this.game = game;

    /**
     * @property {qc.Input} input - 输入管理对象
     */
    this.input = input;

    /**
     * @property {boolean} handleTouchAsMouse - 将触摸事件转化为鼠标事件使用，当设置为true时，将第一个触摸点作为鼠标左键使用，
     * 当两个事件同时发生时，取第一个处理的事件作为鼠标左键事件，忽略后来者
     */
    this.handleTouchAsMouse = true;

    /**
     * @property {number} _currMainPointerId - 当handleTouchAsMouse时，用来记录当前作为主键的设备Id
     * @private
     */
    this._currMainPointerId = NaN;

    /**
     * @property {[string]} _needHandleEventTypes - 需要处理的事件列表
     * @private
     */
    this._needHandleEventTypes = ['onDown', 'onUp', 'onClick'];

    /**
     * @property {[string]} _needHandleDragTypes - 需要处理的拖拽事件列表
     * @private
     */
    this._needHandleDragTypes = ['onDragStart', 'onDrag', 'onDragEnd'];

    /**
     * @property {[string]} _needHandleClickAndDragType - 需要处理点击和拖拽事件列表
     * @type {Array}
     */
    this._needHandleClickAndDragType = ['onClick', 'onDragStart', 'onDrag', 'onDragEnd'];

    /**
     * @property {Number} _startDragMoveDistance - 开始处理拖拽需要移动的最小距离
     * @private
     */
    this._startDragMoveDistance = 10;

    /**
     * @property {Number} tapDuringTime - 轻敲事件允许的最大持续时间
     */
    this.tapDuringTime = 200;

    /**
     * @property {Number} doubleClickTime - 双击时间允许的最大间隔时间
     */
    this.doubleClickDuringTime = 600;

    /**
     * @property {{}} _pointersEvent - 记录当前处理中的事件
     * @private
     */
    this._pointersEvent = {
    };

    // 调用回调
    this._init();
};
BaseInputModule.prototype = {};
BaseInputModule.prototype.constructor = BaseInputModule;

/**
 * 初始化处理
 * @private
 */
BaseInputModule.prototype._init = function() {
    // 监听基础事件
    this.input.onPointerDown.add(this.onPointerDown, this);
    this.input.onPointerUp.add(this.onPointerUp, this);
    this.input.onPointerMove.add(this.onPointerMove, this);
    this.input.onWheel.add(this.onWheel, this);
    this.input.onCursorMove.add(this.onCursorMove, this);
};

/**
 * 创建一个点事件记录对象
 * @param deviceId
 * @returns {{pointerId: Number, deviceId: Number, downNode: null, draggingNode: null, overNode: null}}
 * @private
 */
BaseInputModule.prototype._buildPointerRecord = function(deviceId, isMouse) {
    return {

        /**
         * @property {number} pointerId - 当前事件Id
         */
        eventId : deviceId,

        /**
         * @property {number} deviceId - 当前设备Id
         */
        deviceId : deviceId,

        /**
         * @property {boolean} isMouse - 是否是鼠标事件
         */
        isMouse : isMouse,

        /**
         * @property {qc.Node | null} downNode - 位于触摸点下的节点
         */
        downNode : null,

        /**
         * @property {qc.Node | null} draggingNode - 当前拖拽的节点
         */
        draggingNode : null,

        /**
         * @property {qc.Node | null} overNode - 光标移动经过的节点
         */
        overNode : null
    };
};

/**
 * 销毁
 */
BaseInputModule.prototype.destroy = function() {
    // 取消事件监听
    this.input.onPointerDown.remove(this.onPointerDown, this);
    this.input.onPointerUp.remove(this.onPointerUp, this);
    this.input.onPointerMove.remove(this.onPointerMove, this);
    this.input.onWheel.remove(this.onWheel, this);
    this.input.onCursorMove.remove(this.onCursorMove, this);

    this.reset();
};

/**
 * 当失去输入焦点时调用，用来释放缓存的按键信息
 * @internal
 */
BaseInputModule.prototype.lossFocus = function() {
    this.reset();
};

/**
 * 更新
 */
BaseInputModule.prototype.update = function() {

};

/**
 * 重置当前的事件状态
 */
BaseInputModule.prototype.reset = function() {
    // 取消所有记录的事件
    for (var eventId in this._pointersEvent) {
        var event = this._pointersEvent[eventId];
        var pointer;
        if (!isNaN(event.deviceId)) {
            pointer = this.input.getPointer(event.deviceId);
            event.deviceId = NaN;
        }

        if (event.downNode !== null) {
            var upEvent = new qc.PointerEvent(pointer);
            event.downNode.fireInputEvent('onUp', upEvent);
            event.downNode = null;
        }

        // 如果有拖拽对象，则取消拖拽
        if (event.draggingNode) {
            var dragEndEvent = new qc.DragEndEvent(pointer, null);
            event.draggingNode.fireInputEvent('onDragEnd', dragEndEvent);
            event.draggingNode = null;
        }

        // 如果有经过的对象，则调用移出
        if (event.overNode) {
            var cursorEvent = new qc.CursorMoveEvent(NaN, NaN);
            this.doPointerExitAndEnter(event, cursorEvent, null);
            event.overNode = null;
        }
    }
    this._pointersEvent = {};
    this._currMainPointerId = NaN;
};

/**
 * 检测记录点是否已经 destroy
 * @param event
 */
BaseInputModule.prototype.checkEventRecordNode = function(event) {
    if (event.draggingNode && event.draggingNode._destroy) {
        event.draggingNode = null;
    }
    if (event.downNode && event.downNode._destroy) {
        event.downNode = null;
    }
    if (event.overNode && event.overNode._destroy) {
        event.overNode = null;
    }
};

/**
 * 当一个发生一个点下事件时的处理
 * @param id {number} - 事件设备Id
 * @param x {number} - 事件发生的x轴坐标
 * @param y {number} - 事件发生的y轴坐标
 */
BaseInputModule.prototype.onPointerDown = function(id, x, y) {
    var pointer = this.input.getPointer(id);
    var event = this._pointersEvent[id] ||
        (this._pointersEvent[id] = this._buildPointerRecord(id, this.input.isMouse(id)));

    // 当将触摸事件转化为鼠标事件时，onDown，onUp，onClick，onDragStart只被左键点击或者第一个触摸点触发
    if (this.handleTouchAsMouse) {
        // 将左键和第一个触摸点作为左键处理
        if (id === qc.Mouse.BUTTON_LEFT ||
            id === qc.Touch.MAIN) {
            // 当前是否已经有一个鼠标左键事件在处理，并且不是当前事件的设备Id，则不触发任何事件
            if (!isNaN(this._currMainPointerId) && this._currMainPointerId !== id)
                return;
            this._currMainPointerId = id;
            // 该模式下，设置事件Id为鼠标左键Id
            pointer.eventId = qc.Mouse.BUTTON_LEFT;
            event.eventId = qc.Mouse.BUTTON_LEFT;
        }
    }
    this.checkEventRecordNode(event);

    // 获取当前点击位置下的物件
    var node = this._fetchNodeInParent(this.game.world, x, y);

    // 当不是鼠标事件时，额外处理进入离开事件
    if (!event.isMouse) {
        var overEvent = new qc.CursorMoveEvent(x, y);
        this.doPointerExitAndEnter(event, overEvent, node);
    }

    var currNode = node ? node.getInputEventHandle(this._needHandleEventTypes) : null;
    // 没有响应的节点
    if (!currNode) {
        return;
    }

    // 获取节点中可以触发按下的节点并处理
    event.downNode = currNode;
    var pointEvent = new qc.PointerEvent(pointer);
    // 执行按下事件
    if (currNode) {
        currNode.fireInputEvent('onDown', pointEvent);
    }
};

/**
 * 当发生一个弹起事件时的处理
 * @param id {number} - 设备Id
 * @param x {number} - 事件发生的x轴坐标
 * @param y {number} - 事件发生的y轴坐标
 */
BaseInputModule.prototype.onPointerUp = function(id, x, y) {
    var pointer = this.input.getPointer(id);
    var event = this._pointersEvent[id]  ||
        (this._pointersEvent[id] = this._buildPointerRecord(id, this.input.isMouse(id)));
    // 当将触摸事件转化为鼠标事件时，onDown，onUp，onClick，onDragStart只被左键点击或者第一个触摸点触发
    if (this.handleTouchAsMouse) {
        // 将左键和第一个触摸点作为左键处理
        if (id === qc.Mouse.BUTTON_LEFT ||
            id === qc.Touch.MAIN) {
            // 当前是否已经一个鼠标左键事件在处理，并且不是当前事件的设备Id，则不触发任何事件
            if (this._currMainPointerId !== id)
                return;
            this._currMainPointerId = NaN;
            // 该模式下，设置事件Id为鼠标左键Id
            pointer.eventId = qc.Mouse.BUTTON_LEFT;
            event.eventId = pointer.eventId;
        }
    }
    this.checkEventRecordNode(event);

    // 获取当前点击位置下的物件
    var node = this._fetchNodeInParent(this.game.world, x, y, event.draggingNode);
    var currNode = node ? node.getInputEventHandle(this._needHandleEventTypes) : null;
    var upEvent = new qc.PointerEvent(pointer);

    // 优先处理拖拽事件
    if (event.draggingNode !== null) {
        // 作为拖拽的接收对象时，不考虑点击事件
        var dropNode = node ? node.getInputEventHandle('onDragDrop') : null;
        var dropEvent = new qc.DropEvent(pointer, event.draggingNode);
        // 接收对象是否运行当前物件拖拽到
        if (dropNode && dropNode.checkAllowDrop(event.draggingNode)) {
            dropNode.fireInputEvent('onDragDrop', dropEvent);
        }

        // 处理被拖拽物体的回调
        var dragEndEvent = new qc.DragEndEvent(pointer, dropEvent.result);
        event.draggingNode.fireInputEvent('onDragEnd', dragEndEvent);
        event.draggingNode = null;
    }
    else {
        // 获取当前点击位置下的物件
        if (currNode && currNode === event.downNode) {
            var clickEvent = new qc.ClickEvent(pointer);
            if (pointer.previousStatus.length) {
                var stat = pointer.previousStatus[0];
                var previousStat = pointer.previousStatus[1];
                clickEvent.isTap = stat.upTime - stat.downTime < this.tapDuringTime;
                clickEvent.isDoubleTap = previousStat && (stat.upTime - previousStat.downTime) < 2 * this.tapDuringTime;
                clickEvent.isDoubleClick = previousStat && (stat.upTime - previousStat.downTime) < this.doubleClickDuringTime;
            }
            // 当按下的节点和弹起的节点相同时，触发click事件
            currNode.fireInputEvent('onClick', clickEvent);
        }
    }
    // 处理弹起事件
    if (event.downNode) {
        upEvent.downInside = true;
        upEvent.upInside = event.downNode === currNode;
        event.downNode.fireInputEvent('onUp', upEvent);
    }
    if (currNode && currNode !== event.downNode) {
        upEvent.downInside = false;
        upEvent.upInside = true;
        currNode.fireInputEvent('onUp', upEvent);
    }
    event.downNode = null;

    // 当不是鼠标事件时，额外处理进入离开事件
    if (!event.isMouse) {
        var overEvent = new qc.CursorMoveEvent(x, y);
        this.doPointerExitAndEnter(event, overEvent, null);
    }

    // 移除事件记录
    delete this._buildPointerRecord[event.deviceId];
};

/**
 * 点事件移动
 * @param id
 * @param x
 * @param y
 */
BaseInputModule.prototype.onPointerMove = function(id, x, y) {
    var pointer = this.input.getPointer(id);
    var event = this._pointersEvent[id]  ||
        (this._pointersEvent[id] = this._buildPointerRecord(id, this.input.isMouse(id)));

    this.checkEventRecordNode(event);

    // 获取当前点击位置下的物件
    var node = this._fetchNodeInParent(this.game.world, x, y);

    // 当不是鼠标事件时，额外处理进入离开事件
    if (!event.isMouse) {
        var overEvent = new qc.CursorMoveEvent(x, y);
        this.doPointerExitAndEnter(event, overEvent, node);
    }

    if (!event.draggingNode) {
        var startNode = this._fetchNodeInParent(this.game.world, pointer.startX, pointer.startY);
        var tmp = { x : pointer.x, y : pointer.y };
        var currNode = null;
        do {
            if (!startNode)
                break;
            var nodeAndEventType = startNode.getInputEventHandleAndEventType(this._needHandleClickAndDragType);
            if (!nodeAndEventType)
                break;
            // 如果节点优先响应点击时，需要移动距离大于阀值
            if (nodeAndEventType[1] === 'onClick' &&
                (Math.abs(pointer.distanceX) < this._startDragMoveDistance ||
                Math.abs(pointer.distanceY) < this._startDragMoveDistance)) {
                break;
            }
            currNode = nodeAndEventType[0];

        } while(false);

        var dragStartEvent = new qc.DragStartEvent(pointer);
        pointer._x = pointer.startX;
        pointer._y = pointer.startY;
        if (currNode) {
            currNode.fireInputEvent('onDragStart', dragStartEvent);
        }
        pointer._x = tmp.x;
        pointer._y = tmp.y;
        event.draggingNode = currNode;
    }
    
    // 还没有拖拽对象
    if (!event.draggingNode &&
        (Math.abs(pointer.distanceX) >= this._startDragMoveDistance ||
        Math.abs(pointer.distanceY) >= this._startDragMoveDistance)) {
        // 从开始位置获取事件响应对象
        var startNode = this._fetchNodeInParent(this.game.world, pointer.startX, pointer.startY);
        var tmp = { x : pointer.x, y : pointer.y };
        // 作为拖拽的接收对象时，不考虑其他事件
        var currNode = startNode ? startNode.getInputEventHandle(this._needHandleDragTypes) : null;
        var dragStartEvent = new qc.DragStartEvent(pointer);
        pointer._x = pointer.startX;
        pointer._y = pointer.startY;
        if (currNode) {
            currNode.fireInputEvent('onDragStart', dragStartEvent);
        }
        pointer._x = tmp.x;
        pointer._y = tmp.y;
        event.draggingNode = currNode;
    }

    // 处理拖拽事件
    if (event.draggingNode) {
        // 作为拖拽的接收对象时，不考虑其他事件
        var currNode = node ? node.getInputEventHandle('onDragDrop') : null;
        var dropEvent = new qc.DropEvent(pointer, event.draggingNode);

        // 接收对象是否运行当前物件拖拽到
        if (currNode && (!currNode.isAllowDrop || currNode.isAllowDrop(event.draggingNode))) {
            currNode.fireInputEvent('onDragOver', dropEvent);
        }

        var dragEvent = new qc.DragEvent(pointer);
        event.draggingNode.fireInputEvent('onDrag', dragEvent);
    }
};

/**
 * 滚轮事件
 * @param deltaX
 * @param deltaY
 */
BaseInputModule.prototype.onWheel = function(deltaX, deltaY) {
    // 仅当有光标存在时处理滚动事件
    if (this.input.hasCursor) {
        var cursorPoint = this.input.cursorPosition;
        var node = this._fetchNodeInParent(this.game.world, cursorPoint.x, cursorPoint.y);
        var eventNode = node ? node.getInputEventHandle('onWheel') : null;
        if (eventNode) {
            var wheelEvent = new qc.WheelEvent(-deltaX, -deltaY);
            eventNode.fireInputEvent('onWheel', wheelEvent);
            // 更新光标的位置
            this.onCursorMove(cursorPoint.x, cursorPoint.y);
        }
    }
};

/**
 * 光标移动
 * @param x
 * @param y
 */
BaseInputModule.prototype.onCursorMove = function(x, y) {
    // 获取当前点击位置下的物件
    // 获取当前点击位置下的物件
    var node = this._fetchNodeInParent(this.game.world, x, y);

    var cursorEvent = new qc.CursorMoveEvent(x, y);

    this.checkEventRecordNode(this);
    this.doPointerExitAndEnter(this, cursorEvent, node);
};

/**
 * 处理节点的移出移入事件
 * @param eventRecord
 * @param event
 * @param enter
 */
BaseInputModule.prototype.doPointerExitAndEnter = function(eventRecord, event, enter) {
    if (eventRecord.overNode === enter) {
        return;
    }
    // 处理离开
    var root = this.findCommonRoot(eventRecord.overNode, enter);
    if (eventRecord.overNode) {
        var tmp = eventRecord.overNode;
        while (tmp && tmp !== this.game.world) {
            if (root && root === tmp)
                break;

            tmp.fireInputEvent('onExit', event);
            tmp = tmp.parent;
        }
    }
    // 处理进入
    if (enter) {
        var tmp = enter;
        while (tmp && tmp !== root && tmp !== this.game.world) {
            tmp.fireInputEvent('onEnter', event);
            tmp = tmp.parent;
        }
    }
    eventRecord.overNode = enter;
};

/**
 * 判定一个点是否在一个扁平化的多边形里
 * @param points {[Number]} - 扁平化的多边形
 * @param x {Number} - x轴位置
 * @param y {Number} - y轴位置
 * @returns {boolean}
 * @private
 */
BaseInputModule.prototype._flattenPolygonContains = function(points, x, y) {
    //  Adapted from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html by Jonas Raoni Soares Silva
    var length = points.length / 2;
    var inside = false;
    for (var i = -1, j = length - 1; ++i < length; j = i) {
        var ix = points[2 * i];
        var iy = points[2 * i + 1];
        var jx = points[2 * j];
        var jy = points[2 * j + 1];

        if (((iy <= y && y < jy) || (jy <= y && y < iy)) && (x < (jx - ix) * (y - iy) / (jy - iy) + ix))
        {
            inside = !inside;
        }
    }
    return inside;
};

/**
 * 查找两个节点的共同的节点
 * @param one {qc.Node} - 节点
 * @param two {qc.Node} - 节点
 */
BaseInputModule.prototype.findCommonRoot = function(one, two) {
    if (!one || !two) {
        return null;
    }
    var t1 = one;
    var t2 = two;
    while (t1) {
        t2 = two;
        while (t2) {
            if (t1 === t2) {
                return t1;
            }
            t2 = t2.parent;
        }
        t1 = t1.parent;
    }
    return null;
};

/**
 * 获取指定的节点下，位于指定坐标下，显示在最上层的节点
 * @param node {qc.Node} - 指定的父亲节点
 * @param x {number} - 用来选取Node的点的x轴坐标
 * @param y {number} - 用来选取Node的点的y轴坐标
 * @param except {qc.Node} - 需要排除的节点
 * @return {qc.Node} - 节点
 * @private
 */
BaseInputModule.prototype._fetchNodeInParent = function(node, x, y, except) {
    if (!node || !node.phaser.visible)
        return null;
    
    var localPoint = node.phaser.worldTransform.applyInverse({x: x, y: y});

    // 如果节点是world需要排除区域外的点
    if (node === this.game.world) {
        if (!node.rect.contains(localPoint.x, localPoint.y))
            return null;
    }

    // 最初的遍历从world开始，故而不用判定node是否为except的子节点
    if (node === except) {
        return null;
    }

    // 判定mask裁切
    if (node.phaser.mask) {
        var len = node.phaser.mask.graphicsData.length;
        var contains = false;
        for (var i = 0; i < node.phaser.mask.graphicsData.length; i++)
        {
            var data = node.phaser.mask.graphicsData[i];

            if (!data.fill)
            {
                continue;
            }

            //  Only deal with fills..
            if (data.shape)
            {
                // 这里的多边形会被扁平化，导致contains无法正确判定
                if (data.shape.points &&
                    data.shape.points.length > 0 &&
                    !(data.shape.points[0] instanceof qc.Point) &&
                    this._flattenPolygonContains(data.shape.points, x, y)) {
                    contains = true;
                }
                else if (data.shape.contains(x, y)) {
                    contains = true;
                }
                break;
            }
        }
        if (len != 0 && !contains) {
            return null;
        }
    }
    if (node.phaser.softClip && node.phaser.softClip.length) {
        if (!qc.GeometricTool.polygonContains(node.phaser.softClip, x, y)) {
            return null;
        }
    }

    var fetchNode = null;

    // 先在子节点中获取
    var children = node.children,
        i = children.length;
    while (i--) {
        fetchNode = this._fetchNodeInParent(children[i], x, y, except);
        if (fetchNode)
            return fetchNode;
    }


    // 判断自己是否满足条件
    if (node.checkHit(localPoint.x, localPoint.y)) {
        return node;
    }

    return null;
};
