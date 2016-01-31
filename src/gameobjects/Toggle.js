/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 开关对象
 *
 * @class qc.Toggle
 * @param {qc.Game} game
 * @constructor
 * @internal
 */
var Toggle = qc.Toggle = function(game, parent, uuid) {
    qc.Node.call(this, new Phaser.Group(game.phaser, null), parent, uuid);

    // 初始化默认的名字
    this.name = 'Toggle';
    this.interactive = true;

    /**
     * @property {qc.Signal} onStateChange - 状态发生变化的事件
     */
    this.onStateChange = new qc.Signal();

    /**
     * @property {qc.Signal} onValueChange - 开关选中状态变化产生的事件
     */
    this.onValueChange = new qc.Signal();

    /**
     * @property {qc.Signal} canValueChange - 是否允许这次开关状态的改变
     */
    this.canValueChange = new qc.Signal();

    var restore = uuid !== undefined;
    if (restore !== true) {
        /**
         * @property {qc.UIImage} background - 背景图片
         * @readonly
         */
        this.background = game.add.image(this);
        this.background.name = 'Background';
        this.background.interactive = false;
        this.background.width = 80;
        this.background.height = 80;

        /**
         * @property {qc.UIImange} checkMark - 选中标记图片
         * @readonly
         */
        this.checkMark = game.add.image(this.background);
        this.checkMark.name = 'CheckMark';
        this.checkMark.interactive = false;

        /**
         * @property {qc.Text} text - 挂载在开关上的文本组件
         * @readonly
         */
        this.text = game.add.text(this);
        this.text.text = 'Button';
        this.text.name = 'Text';
        this.text.interactive = false;

        // 我的初始状态为默认状态
        this.on = false;
        this.state = qc.UIState.NORMAL;

        // 大小应该等于“我”的大小，位置居中
        this.checkMark.pivotX = 0.5;
        this.checkMark.pivotY = 0.5;
        this.checkMark.setAnchor(new qc.Point(0.5, 0.5), new qc.Point(0.5, 0.5));
        this.checkMark.anchoredX = 0;
        this.checkMark.anchoredY = 0;
        this.checkMark.width = 50;
        this.checkMark.height = 50;
        this.text.x = this.background.width + 5;
        this.text.height = this.background.height;

        // 挂载交互效果脚本
        var behaviour = this.addScript('qc.TransitionBehaviour');
        behaviour.target = this.background;
        behaviour.transition = qc.Transition.TEXTURE_SWAP;
    }

    // 关注按钮按下和松开的回调，切换按钮状态
    var self = this;
    this.onDown.add(function() {
        if (self.state !== qc.UIState.DISABLED)
            self.state = qc.UIState.PRESSED;
    });
    this.onUp.add(function() {
        if (self.state === qc.UIState.PRESSED)
            self.state = qc.UIState.NORMAL;
    });

    // 点击时切换开关状态
    this.onClick.add(function() {
        self.on = !self.on;
        self.checkMark.visible = self.on;
    });
};
Toggle.prototype = Object.create(qc.Node.prototype);
Toggle.prototype.constructor = Toggle;

Object.defineProperties(Toggle.prototype, {
    /**
     * @property {boolean} on - 开关的开启状态
     */
    on : {
        get : function()  { return !!this._on; },
        set : function(v) {
            var old = this.on;

            // 是否允许这次修改
            var option = {};
            this.canValueChange.dispatch(this, v, old, option);
            if (option.ignore) return;

            this._on = v;
            this.checkMark.visible = v;
            if (old !== v)
                this.onValueChange.dispatch(this);
        }
    },

    /**
     * @property {number} state - 开关的状态
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
     * @property {string} class - 类名字
     * @readonly
     * @internal
     */
    class : {
        get : function() { return 'qc.Toggle' }
    }
});

/**
 * 需要序列化的字段和类型
 * 部分有依赖关系的字段需要特殊处理
 * @internal
 */
Toggle.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.Node.prototype.getMeta.call(this);

    // 增加Button需要序列化的内容
    json.background = s.NODE;
    json.checkMark = s.NODE;
    json.text = s.NODE;
    json.on = _CUSTOM_FIELD('on', s.BOOLEAN);
    json.state = _CUSTOM_FIELD('state', s.NUMBER);
    return json;
}
