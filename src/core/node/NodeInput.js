/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * Input交互部分的实现
 */
Object.defineProperties(Node.prototype, {
    /**
     * This is the defined area that will pick up mouse / touch events. It is null by default.
     * Setting it is a neat way of optimising the hitTest function that the interactionManager will use (as it will not need to hit test all the children)
     *
     * @property hitArea
     * @type Rectangle|Circle|Ellipse|Polygon
     */
    'hitArea': {
        get: function() {
            return this.phaser.hitArea === undefined ? this.rect : this.phaser.hitArea;
        },
        set: function(v) {
            this.phaser.hitArea = v;
        }
    },

    /**
     * 返回原生态的 hitArea，用于序列化反序列化
     * @property hitArea
     * @type Rectangle|Circle|Ellipse|Polygon
     */
    'serializeHitArea': {
        get: function() {
            return this.phaser.hitArea;
        },
        set: function(v) {
            this.phaser.hitArea = v;
        }
    },

    /**
     * 获取点下事件派发器
     */
    'onDown': {
        get: function() {
            if (!this._onDown) {
                this._onDown = new Phaser.Signal();
            }
            return this._onDown;
        }
    },

    /**
     * 获取抬起事件派发器
     */
    'onUp': {
        get: function() {
            if (!this._onUp) {
                this._onUp = new Phaser.Signal();
            }
            return this._onUp;
        }
    },

    /**
     * 获取点击事件派发器
     */
    'onClick': {
        get: function() {
            if (!this._onClick) {
                this._onClick = new Phaser.Signal();
            }
            return this._onClick;
        }
    },

    /**
     * 获取拖拽开始事件派发器
     */
    'onDragStart': {
        get: function() {
            if (!this._onDragStart) {
                this._onDragStart = new Phaser.Signal();
            }
            return this._onDragStart;
        }
    },

    /**
     * 获取拖拽过程事件派发器
     */
    'onDrag': {
        get: function() {
            if (!this._onDrag) {
                this._onDrag = new Phaser.Signal();
            }
            return this._onDrag;
        }
    },

    /**
     * 获取拖拽结束事件派发器
     */
    'onDragEnd': {
        get: function() {
            if (!this._onDragEnd) {
                this._onDragEnd = new Phaser.Signal();
            }
            return this._onDragEnd;
        }
    },

    /**
     * 拖拽放下事件
     */
    'onDragDrop' : {
        get: function() {
            if (!this._onDragDrop) {
                this._onDragDrop = new Phaser.Signal();
            }
            return this._onDragDrop;
        }
    },

    /**
     * 滚轮滚动事件派发器
     */
    'onWheel': {
        get: function() {
            if (!this._onWheel) {
                this._onWheel = new Phaser.Signal();
            }
            return this._onWheel;
        }
    },

    /**
     * 光标进入事件
     */
    'onEnter': {
        get: function() {
            if (!this._onEnter) {
                this._onEnter = new Phaser.Signal();
            }
            return this._onEnter;
        }
    },

    /**
     * 光标移出事件
     */
    'onExit': {
        get: function() {
            if (!this._onExit) {
                this._onExit = new Phaser.Signal();
            }
            return this._onExit;
        }
    },

    /**
     * 是否可交互状态变化事件
     */
    'onInteractive': {
        get: function() {
            if (!this._onInteractive) {
                this._onInteractive = new Phaser.Signal();
            }
            return this._onInteractive;
        }
    },

    /**
     * 是否允许交互，默认为false，控制onDown/onUp/onClick等事件
     *
     * @property {boolean} interactive
     */
    'interactive': {
        get: function() {
            return this._interactive;
        },
        set: function(v) {
            this._interactive = v;

            if (this._onInteractive) {
                this._onInteractive.dispatch();
            }
        }
    }
});

/**
 * @method 是否允许拖拽放下，如果需要检测拖拽放下，需要在脚本或者 Node 中实现isAllowDrop
 * @param draggingNode
 */
Node.prototype.checkAllowDrop = function(draggingNode) {
    var scriptDeny = false;
    // 判断所有脚本中是否有有处理该函数
    var len = this.scripts.length;
    for (var i = 0; i < len; i++) {
        var script = this.scripts[i];
        if (script) {
            var func = script['isAllowDrop'];
            if (!func) continue;
            if (func.call(script, draggingNode))
                return true;
            scriptDeny = true;
        }
    }
    // 判断自己是否有实现该接口, 如果自己没有实现且被脚本拒绝则拒绝
    return !this.isAllowDrop ? !scriptDeny : this.isAllowDrop(draggingNode);
};

/**
 * @method 是否可以处理指定的事件类型
 * @param eventType {string} - 事件类型
 * @return {boolean} - 是表示可以处理指定事件类型，否则无法处理
 */
Node.prototype.canHandleInputEvent = function(eventType) {
    // 不可交互时，直接返回
    if (!this.interactive)
        return false;

    // 先判断事件是否有外部监听
    // 直接获取私有属性，避免触发构造
    var eventSignal = this['_' + eventType];
    if (eventSignal && eventSignal.getNumListeners() > 0)
        return true;

    // 判断脚本中是否有注册处理函数
    var len = this.scripts.length;
    for (var i = 0; i < len; i++) {
        var script = this.scripts[i];
        if (script) {
            var func = script[eventType];
            if (!func) continue;

            return true;
        }
    }
    return false;
};

/**
 * @method 通过节点向上查找可以处理指定事件的节点，如果找不到返回null
 * @param eventType {string | [string]} - 事件类型
 * @returns {qc.Node | null} - 可以处理事件的节点或者null
 */
Node.prototype.getInputEventHandle = function(eventType) {
    var eventList = Array.isArray(eventType) ? eventType : [eventType];
    var node = this;
    // 根节点为stage,当找到stage时退出查找
    var rootNode = this.game.stage;
    var i;
    while (node && node !== rootNode) {
        i = eventList.length;
        while (i--) {
            if (node.canHandleInputEvent(eventList[i]))
                return node;
        }
        node = node.parent;
    }
    return null;
};

/**
 * @method 通过节点向上查找可以处理指定事件的节点，如果找不到返回null
 * @param eventType {string | [string]} - 事件类型
 * @returns {[qc.Node, String] | null} - 可以处理事件的节点及事件或者null
 */
Node.prototype.getInputEventHandleAndEventType = function(eventType) {
    var eventList = Array.isArray(eventType) ? eventType : [eventType];
    var node = this;
    // 根节点为stage,当找到stage时退出查找
    var rootNode = this.game.stage;
    var i;
    while (node && node !== rootNode) {
        i = eventList.length;
        while (i--) {
            if (node.canHandleInputEvent(eventList[i]))
                return [node, eventList[i]];
        }
        node = node.parent;
    }
    return null;
};

/**
 * @method 向节点发送交互事件调用
 * @param eventType {string} - 事件类型
 * @param event {object} - 事件参数
 */
Node.prototype.fireInputEvent = function(eventType, event) {
    // 不可交互时，直接返回
    if (!this.interactive || this.state === qc.UIState.DISABLED)
        return false;

    // 通知所有脚本，如果是事件处理完成则中止调用
    var ret = this._sendMessage(eventType, true, event);
    if (ret === true) {
        return true;
    }

    // 先判断事件是否有外部监听
    // 直接获取私有属性，避免触发构造
    var eventSignal = this['_' + eventType];
    if (eventSignal && eventSignal.getNumListeners() > 0) {
        eventSignal.dispatch(this, event);
    }
};

Node.prototype.checkHit = function(x, y) {
    var self = this;
    if (!self._interactive) {
        return;
    }
    var hitArea = self.phaser.hitArea === undefined ? this._lastRectInfo : this.phaser.hitArea;
    return hitArea && hitArea.contains && hitArea.contains(x, y);
};
