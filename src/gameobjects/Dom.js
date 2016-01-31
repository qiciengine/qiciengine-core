/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * dom节点
 * @constructor
 * @internal
 */
var Dom = qc.Dom = function(game, parent, uuid) {
    var self = this;
    self.game = game;

    // 调用基类的初始
    qc.Node.call(this, new Phaser.Group(this.game.phaser, null), parent, uuid);
    self.name = 'dom';

    /**
     * @property {dom} div - 对应的dom节点
     * @readonly
     */
    var div = self.div = document.createElement('div');
    div.style.position = 'absolute';
    div.setAttribute('id', self.uuid);
    div._qc = self;
    self.overflow = 'hidden';

    /**
     * @property {boolean} serializable - innerHTML是否需要序列化
     */
    self.serializable = true;

    // WorldTransform改变后，需要重新计算dom的位置
    self.phaser.worldTransformChangedCallback = self._updateDomTransform;
    self.phaser.worldTransformChangedContext = self;

    // 默认挂载在上层
    self.pos = Dom.POS_FRONT;

    // 需要强制设置下，否则在X5浏览器上位置可能会不对！
    // 也就是说：在X5上设置位置需要在创建div同一“时刻”
    // 在部分android手机下，还是无法解决初始时DOM位置不对的问题(万恶的X5浏览器啊，锁屏下回来就正确了)
    // FIXED ME: 暂时的方案是延迟下一帧做点偏移，然后再设置回来
    self._updateDomTransform();
    if (self.game.device.android) {
        // So ugly!!!
        self.game.timer.add(1, function() {
            if (!self._destroy) {
                self.rotation += 0.001;
            }
        });
        self.game.timer.add(40, function() {
            if (!self._destroy) {
                self.rotation -= 0.002;
            }
        });
        self.game.timer.add(300, function() {
            if (!self._destroy) {
                self.rotation += 0.0005;
            }
        });
        self.game.timer.add(1000, function() {
            if (!self._destroy) {
                self.rotation += 0.0005;
            }
        });
    }
};

Dom.prototype = Object.create(qc.Node.prototype);
Dom.prototype.constructor = Dom;

/**
 * DOM节点是放在背景，还是在最上层
 * @type {number}
 */
Dom.POS_NONE  = -1; 
Dom.POS_BACK  = 0;
Dom.POS_FRONT = 1;

Object.defineProperties(Dom.prototype, {
    /**
     * @property {string} class - 类的名字
     * @internal
     */
    class : {
        get : function() { return 'qc.Dom'; }
    },

    /**
     * @property {int} pos - 节点放的位置，是在底层还是在上层
     */
    pos: {
        get: function() { return this._pos; },
        set: function(v) {
            if (this.pos === v) return;
            this._pos = v;

            // 重新挂载之
            if (this.div.parentNode)
                this.div.parentNode.removeChild(this.div);
            if (v === Dom.POS_BACK) {
                this.game.world.backDomRoot.appendChild(this.div);
                if (this.zIndex >= 0) this.zIndex = -1;
            }
            else if (v === Dom.POS_FRONT) {
                this.game.world.frontDomRoot.appendChild(this.div);
                if (this.zIndex <= 0) this.zIndex = 1;
            }
        }
    },

    /**
     * @property {number} zIndex - DOM的层次控制
     *   pos === Dom.POS_BACK: zIndex < 0
     *   pos === Dom.POS_FRONT: zIndex > 0
     */
    zIndex: {
        get: function() { return this.div.style.zIndex || 0; },
        set: function(v) {
            if (v === this.div.style.zIndex) return;
            if (this._pos === Dom.POS_BACK && v >= 0) v = -1;
            else if (this._pos === Dom.POS_FRONT && v <= 0) v = 1;

            this.div.style.zIndex = v;
        }
    },

    /**
     * @property {string} innerHTML - 内部的HTML元素
     */
    innerHTML: {
        get: function() { return this.div.innerHTML; },
        set: function(v) {
            this.div.innerHTML = v;
        }
    },

    /**
     * @property {string} className - 使用的样式表
     */
    className: {
        get: function() { return this.div.className; },
        set: function(v) { this.div.className = v; }
    },

    /**
     * @property {string} overflow - 内容超出大小的处理：visible、scroll、hidden、auto
     */
    overflow: {
        get: function() { return this._overflow; },
        set: function(v) {
            if (v === this._overflow) return;
            this._overflow = v;
            this.div.style.overflow = v;
        }
    },

    /**
     * @property {number} alpha - The alpha of DOM
     * @override
     */
     alpha: {
        get: function() {
            var div = this.div,
                v = div.style.opacity;
            if (v) return v * 1;
            return 1;
        },
        set: function(v) {
            var self = this,
                div = self.div;
            if (v === div.alpha) return;
            div.style.filter = 'alpha(opacity:'+ (v * 100)+')';
            div.style.opacity = v;
        }
     }
});

/**
 * 序列化完成后派发awake事件
 * @override
 * @private
 */
Dom.prototype._dispatchAwake = function() {
    Node.prototype._dispatchAwake.call(this);
    this._updateDomTransform();
};

/**
 * 父亲或自身的可见属性发生变化了
 * @protected
 */
Dom.prototype.onVisibleChange = function() {
    this._updateDomTransform();
};

/**
 * 对应的dom节点从世界中摘除掉了
 * @protected
 */
Dom.prototype.onRemoveFromWorld = function() {
    if (this.div && this.div.parentNode)
        this.div.parentNode.removeChild(this.div);
};

/**
 * 对应的dom节点加入到世界中了
 * @protected
 */
Dom.prototype.onAddToWorld = function() {
    if (!this.div || this.div.parentNode) return;
    var v = this.pos;
    if (v === Dom.POS_BACK) {
        this.game.world.backDomRoot.appendChild(this.div);
        if (this.zIndex >= 0) this.zIndex = -1;
    }
    else if (v === Dom.POS_FRONT) {
        this.game.world.frontDomRoot.appendChild(this.div);
        if (this.zIndex <= 0) this.zIndex = 1;
    }
};

/**
 * @method onDestroy
 * @overide
 * @internal
 */
Dom.prototype.onDestroy = function() {
    // 释放div上的节点对象
    this.div._qc = null;

    if (this.div.parentNode)
        this.div.parentNode.removeChild(this.div);

    // 调用父类的析构
    qc.Node.prototype.onDestroy.call(this);
};

/**
 * 获取需要被序列化的信息描述
 * @overide
 * @internal
 */
Dom.prototype.getMeta = function() {
    var self = this;
    var s = qc.Serializer;
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加Dom需要序列化的内容
    json.pos = s.NUMBER;
    json.className = s.STRING;
    json.overflow = s.STRING;
    json.innerHTML = {
        get : function(ob, context) {
            return ob.serializable ? [true, ob.innerHTML] : undefined;
        },
        set : function(context, v) {
            if (!v) {
                self.serializable = false;
                self.innerHTML = '';
            }
            else {
                self.serializable = true;
                self.innerHTML = v[1];
            }
        }
    };
    json.zIndex = s.INT;
    return json;
};

/**
 * 更新节点的位置
 * @private
 */
Dom.prototype._updateDomTransform = function() {
    qc.Util.updateTransform(this, this.div);

    // 在X5浏览器上，如果一开始没有设置好transform等信息，后续位置就会出现偏差
    // 这里的方案是：每次隐藏或显示时，都先刷新下其transform信息再控制显示内容
    // 顺序不要颠倒了
    // 另外，create div后立刻就需要设置上transform！
    this.div.style.display = this.isWorldVisible() ? 'block' : 'none';
};

