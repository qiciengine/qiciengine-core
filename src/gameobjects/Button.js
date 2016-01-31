
/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 界面按钮对象
 *
 * @class qc.Button
 * @param {qc.Game} game
 * @constructor
 * @internal
 */
var Button = qc.Button = function(game, parent, uuid) {
    qc.UIImage.call(this, game, parent, uuid);

    // 初始化默认的名字
    this.name = 'Button';

    /**
     * @property {qc.Signal} onStateChange - 状态发生变化的事件
     */
    this.onStateChange = new qc.Signal();

    var restore = uuid !== undefined;
    if (restore !== true) {
        /**
         * @property {qc.Text} text - 挂载在按钮上的文本组件
         * @readonly
         */
        this.text = game.add.text(this);
        this.text.text = 'Button';
        this.text.name = 'Text';

        // 设置文本不可交互
        this.text.interactive = false;

        // 设置我可以交互
        this.interactive = true;

        // 我的初始状态为默认状态
        this.state = qc.UIState.NORMAL;

        // 挂载交互效果脚本
        var behaviour = this.addScript('qc.TransitionBehaviour');
        behaviour.target = this;

        // 大小应该等于“我”的大小，位置居中
        this.width = 120;
        this.height = 40;
        this.text.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
        this.text.left = 0;
        this.text.right = 0;
        this.text.top = 0;
        this.text.bottom = 0;
        this.text.alignH = UIText.CENTER;
    }

    // 关注按钮按下和松开的回调，切换按钮状态
    var self = this;
    this.onDown.add(function() {
        if (self.state !== qc.UIState.DISABLED) {
            self.state = qc.UIState.PRESSED;
        }
    });
    this.onUp.add(function() {
        if (self.state === qc.UIState.PRESSED) {
            self.state = qc.UIState.NORMAL;
        }
    });

    this._onNativeElementClick = this._processNativeClick.bind(this);
};
Button.prototype = Object.create(qc.UIImage.prototype);
Button.prototype.constructor = Button;

Object.defineProperties(Button.prototype, {
    /**
     * @property {number} state - 按钮的状态
     */
    state : {
        get : function()  { return this._state || qc.UIState.NORMAL; },
        set : function(v) {
            if (this.state === v) return;
            this._state = v;
            this.onStateChange.dispatch();
        }
    },

    /**
     * @property {number} colorTint - 设置按钮的混合色
     * @override qc.UIImage#colorTint
     */
    colorTint : {
        get : function() { return Object.getOwnPropertyDescriptor(qc.Node.prototype, 'colorTint').get.call(this); },
        set : function(v) {
            Object.getOwnPropertyDescriptor(qc.Node.prototype, 'colorTint').set.call(this, v);
            if (this.text)
                this.text.colorTint = v;
        }
    },

    /**
     * @property {string} texture - 按钮的贴图
     * @override qc.UIImage#frame
     */
    frame : {
        get : function() { return Object.getOwnPropertyDescriptor(qc.UIImage.prototype, 'frame').get.call(this); },
        set : function(v) {
            Object.getOwnPropertyDescriptor(qc.UIImage.prototype, 'frame').set.call(this, v);
        }
    },

    /**
     * @property {boolean} nativeEvent - 是否响应浏览器直接事件
     */
    supportNativeEvent : {
        get : function() { return this._supportNativeEvent; },
        set : function(v) {
            if (v === this._supportNativeEvent) {
                return;
            }
            this._supportNativeEvent = v;
            this._checkNativeElement();
        }
    },

    /**
     * @property {Phaser.Signal} onNativeClick - 获取浏览器直接点击事件派发器
     */
    'onNativeClick': {
        get: function() {
            if (!this._onNativeClick) {
                this._onNativeClick = new Phaser.Signal();
            }
            return this._onNativeClick;
        }
    },

    /**
     * @property {string} class - 类名
     * @readonly
     * @internal
     */
    class : {
        get : function() { return 'qc.Button'; }
    }
});

/**
 * 需要序列化的字段和类型
 * @internal
 */
Button.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.UIImage.prototype.getMeta.call(this);

    // 增加Button需要序列化的内容
    json.text = s.NODE;
    json.state = s.NUMBER;
    json.supportNativeEvent = s.BOOLEAN;
    return json;
};

/**
 * 更新
 * @param  {boolean} force - 是否强制更新NativeElement位置
 */
Button.prototype.update = function(force) {
    if (this.isWorldVisible() && this.supportNativeEvent) {
        this._checkNativeElement();

        if (force)
            this._updateNativeElement();
    }
    else {
        this._removeNativeElement();
    }
};

/**
 * 父亲或自身的可见属性发生变化了
 * @protected
 */
Button.prototype.onVisibleChange = function() {
    this.update(true);
};

/**
 * 销毁时删除 Native div 控件
 */
Button.prototype.onDestroy = function() {
    this._removeNativeElement();
    // 调用父亲节点的onDestroy
    qc.UIImage.prototype.onDestroy.call(this);
};

/**
 * 检测当前
 * @private
 */
Button.prototype._checkNativeElement = function() {
    if (this.supportNativeEvent && this.worldVisible && !this._nativeElement) {
        this._createNativeElement();
    }
    else if (this._nativeElement && (!this.supportNativeEvent || !this.worldVisible)) {
        this._removeNativeElement();
    }
};

/**
 * 增加 native 组件
 * @private
 */
Button.prototype._createNativeElement = function() {
    var self = this;
    if (!self._nativeElement) {
        var element = self._nativeElement = document.createElement('div');
        element.addEventListener('click', self._onNativeElementClick, false);
        element.addEventListener('touchstart', self._onNativeElementClick, false);
        var style = element.style;
        style.position = 'absolute';
        style.padding = 0;
        style.margin = 0;
        style.border = 0;
        style.outline = 0;
        style.background = 'none';
        self.game.world.frontDomRoot.appendChild(element);
        self._updateNativeElement();

        // WorldTransform改变后，需要更新native组件位置
        self.phaser.worldTransformChangedCallback = self._updateNativeElement.bind(self);
        self.phaser.worldTransformChangedContext = self;
    }
};

/**
 * 删除 native 组件
 * @private
 */
Button.prototype._removeNativeElement = function() {
    var element = this._nativeElement;
    if (element) {
        this._nativeElement = null;
        element.removeEventListener('click', this._onNativeElementClick, false);
        element.removeEventListener('touchstart', this._onNativeElementClick, false);
        qc.Util.removeHTML(element);
    }
};

/**
 * 更新 native 组件位置
 * @private
 */
Button.prototype._updateNativeElement = function() {
    var self = this,
        element = self._nativeElement;

    if (!element) {
        return;
    }
    element._lastUpdate = self.game.time.now;
    qc.Util.updateTransform(self, element);
};

/**
 * 派发 Native 点击事件
 * @param event
 * @private
 */
Button.prototype._processNativeClick = function(event) {
    if (!this.worldVisible) {
        this._checkNativeElement();
    }
    if (this._onNativeClick && this._onNativeClick.getNumListeners() > 0) {
        this._onNativeClick.dispatch(this, event);
    }
};

