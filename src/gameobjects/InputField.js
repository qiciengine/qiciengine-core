/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 文本输入框控件
 * @class qc.InputField
 * @param {qc.Game} game
 * @constructor
 * @internal
 */
var InputField = qc.InputField = function(game, parent, uuid) {
    // 调用基类的初始
    var self = this;
    qc.UIImage.call(self, game, parent, uuid);

    // 初始化默认的名字
    self.name = 'InputField';

    /**
     * @property {qc.Signal} onStateChange - 状态发生变化的事件
     */
    self.onStateChange = new qc.Signal();

    /**
     * @property {qc.Signal} onValueChange - 文本发生变化的事件
     */
    self.onValueChange = new qc.Signal();

    // 设置我可以交互
    self.interactive = true;

    // 创建div做交互，否则有些手机无法在input.nativeMode为false时无法弹出输入键盘
    var div = self.div = document.createElement('div');
    if (!window.__wx) {
        var style = div.style;
        style.setProperty("-webkit-tap-highlight-color", "rgba(0, 0, 0, 0)", null);
        style.position = 'absolute';
        style.padding = 0;
        style.margin = 0;
        style.border = 0;
        style.outline = 0;
        style.background = 'none';
        self.game.world.frontDomRoot.appendChild(div);
    }

    var restore = uuid !== undefined;
    if (restore !== true) {
        // 挂载显示文本的节点
        var tc = self.textComponent = game.add.text(self);
        tc.text = '';
        tc.name = 'Text';
        tc.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
        tc.left = 5;
        tc.right = 5;
        tc.top = 5;
        tc.bottom = 5;
        tc.interactive = false;
        tc.color = Color.black;
        tc.alignV = UIText.MIDDLE;
        tc.alignH = UIText.LEFT;

        // 挂载输入提示语的节点
        var ph = self.placeholder = game.add.text(self);
        ph.text = 'Enter text...';
        ph.name = 'Placeholder';
        ph.setAnchor(new qc.Point(0, 0), new qc.Point(1, 1));
        ph.left = 5;
        ph.right = 5;
        ph.top = 5;
        ph.bottom = 5;
        ph.interactive = false;
        ph.color = Color.grey;
        ph.alignV = UIText.MIDDLE;
        ph.alignH = UIText.LEFT;

        // 我的初始状态为默认状态
        this.state = qc.UIState.NORMAL;

        // 挂载交互效果脚本
        var behaviour = this.addScript('qc.TransitionBehaviour');
        behaviour.target = this;
    }

    // 处理点击事件开始编辑
    var processNativeDown = function(event){
        event.preventDefault();
        if (self.state !== qc.UIState.DISABLED) {
            self.startEditing();
        }
    };
    div.addEventListener('mouseup', processNativeDown, false);
    div.addEventListener('touchend', processNativeDown, false);

    // 监听点击事件切换state状态
    this.onDown.add(function() {
        if (self.state !== qc.UIState.DISABLED) {
            self.state = qc.UIState.PRESSED;
        }
    });
    this.onUp.add(function(node, event) {
        if (self.state === qc.UIState.PRESSED) {
            self.state = qc.UIState.NORMAL;
        }

        if (window.__wx) {
            // 微信使用该事件监听点击事件
            if (self.state !== qc.UIState.DISABLED) {
                self.startEditing();
            }
        }
    });

    // WorldTransform改变后，需要更新native元素位置
    self.phaser.worldTransformChangedCallback = self._updateNativeDiv.bind(self);
    self.phaser.worldTransformChangedContext = self;

    // 初始化设置为空
    this.text = '';

    // 设置默认宽高
    this.width = 120;
    this.height = 30;

    this._checkVisibility();
};

/**
 * 输入框的行类型：单行、多行
 * @type {number}
 */
InputField.SINGLE_LINE = 0;
InputField.MULTI_LINE = 1;

/**
 * 输入的内容类型：标准、整数、数字、电话号码、邮件、密码等
 * @type {number}
 */
InputField.STANDARD = 0;
InputField.INT = 1;
InputField.NUMBER = 2;
InputField.TEL = 3;
InputField.EMAIL = 4;
InputField.PASSWORD = 5;

InputField.prototype = Object.create(qc.UIImage.prototype);
InputField.prototype.constructor = InputField;

// 最大字符限制
InputField.prototype._characterLimit = -1;

// 输入框类型
InputField.prototype._lineType = InputField.SINGLE_LINE;

// 输入内容类型
InputField.prototype._contentType = InputField.STANDARD;

// 弹出输入框
InputField.prototype._input = null;

// 密码实际值
InputField.prototype._password = '';

/**
 * @property {qc.UIText} textComponent - 关联的输入文本对象
 */
InputField.prototype.textComponent = null;

/**
 * @property {qc.UIText} placeholder - 关联的占位符文本对象
 */
InputField.prototype.placeholder = null;

Object.defineProperties(InputField.prototype, {
    /**
     * @property {string} class - 类名字
     * @readonly
     * @internal
     */
    'class' : {
        get : function() { return 'qc.InputField' }
    },

    /**
     * @property {number} state - 输入框的状态
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
     * @property {number} type - 编辑框类型(单行，多行)
     */
    lineType : {
        get : function()  { return this._lineType; },
        set : function(v) { this._lineType = v;    }
    },

    /**
     * @property {number} contentType - 编辑框的内容限制
     */
    contentType : {
        get : function() { return this._contentType; },
        set : function(v) {
            if (this._contentType === v) return;
            this._contentType = v;
            this.text = this.text;
        }
    },

    textComponent: {
        get: function() {
            if (this._textComponent && this._textComponent._destroy) {
                this._textComponent = null;
            }
            return this._textComponent;
        },
        set: function(value) {
            this._textComponent = value;
        }
    },

    placeholder: {
        get: function() {
            if (this._placeholder && this._placeholder._destroy) {
                this._placeholder = null;
            }
            return this._placeholder;
        },
        set: function(value) {
            this._placeholder = value;
        }
    },

    placeholderText: {
        get: function() {
            var placeholder = this.placeholder;
            if (!placeholder) {
                return '';
            }
            return placeholder.text;
        },
        set: function(value) {
            var placeholder = this.placeholder;
            if (placeholder) {
                placeholder.text = value;
            }
        }
    },

    /**
     * @property {string} text - 编辑框内容
     */
    text : {
        get : function() {
            var textComponent = this.textComponent;
            if (!textComponent) {
                return "";
            }
            if (this._contentType === InputField.PASSWORD) {
                return this._password;
            }
            return this.textComponent.text;
        },
        set : function(v) {
            if (!this.textComponent) {
                return;
            }
            v = this.toValidateText(v);
            if (v === this.text){
                return;
            }
            if (this._contentType === InputField.PASSWORD) {
                this._password = v;
                var password = '';
                for (var i = 0; i < v.length; i++) {
                    password += '·';
                }
                this.textComponent.text = password;
            }
            else {
                this.textComponent.text = v;
            }
            this.onValueChange.dispatch(v);
        }
    },

    /**
     * @property {number} characterLimit - 字符数限制
     */
    characterLimit : {
        get : function() {
            if (window.__wx && this._characterLimit === -1) return 99999;
            return this._characterLimit;
        },
        set : function(v) {
            if (this.characterLimit === v) return;
            this._characterLimit = v;
            this.text = this.text;
        }
    },

    /**
     * @property {boolean} overFlow  - 超出是否部分是否裁剪掉
     */
    'overflow' : {
        get : function() {
            if (!this.textComponent) {
                return false;
            }
            return this.textComponent.overflow;
        },
        set : function(v) {
            if (!this.textComponent) return;
            this.textComponent.overflow = v;
        }
    },

    /**
     * @property {boolean} isFocused  - 当前是否处于编辑状态
     */
    isFocused: {
        get: function() {
            return !!this.getInput();
        },
        set: function(value) {
            if (value) {
                this.startEditing();
            }
            else {
                this.stopEditing();
            }
        }
    }
});

/**
 * 获取需要被序列化的信息描述
 * @overide
 * @internal
 */
InputField.prototype.getMeta = function() {
    var s = qc.Serializer;
    var json = qc.UIImage.prototype.getMeta.call(this);

    json.lineType = s.NUMBER;
    json.contentType = s.NUMBER;
    json.placeholder = s.NODE;
    json.textComponent = s.NODE;
    json.text = s.STRING;
    json.overflow = s.BOOLEAN;
    json.state = s.NUMBER;
    json._password = s.STRING;
    json.characterLimit = s.NUMBER;
    return json;
};

/**
 * @overide
 * @internal
 */
InputField.prototype.update = function() {
    var input = this.getInput(),
        textComponent = this.textComponent,
        placeholder = this.placeholder;
    var lastRenderable = textComponent.textPhaser.renderable;
    if (input) {
        if (textComponent) {
            textComponent.textPhaser.renderable = false;
        }
        if (placeholder) {
            placeholder.textPhaser.renderable = false;
        }
        this._updateInput(input);
    }
    else {
        if (textComponent) {
            textComponent.textPhaser.renderable = true;
        }
        if (placeholder) {
            placeholder.textPhaser.renderable = this.text === '';
        }
    }
    if (textComponent.textPhaser.renderable !== lastRenderable) {
        textComponent.textPhaser.displayChanged(textComponent.textPhaser.renderable ? qc.DisplayChangeStatus.SHOW : qc.DisplayChangeStatus.HIDE);
        this.phaser.displayChanged(textComponent.textPhaser.renderable ? qc.DisplayChangeStatus.SHOW : qc.DisplayChangeStatus.HIDE);
    }
};

/**
 * 转换成有效的文字
 * @private
 */
InputField.prototype.toValidateText = function(text) {
    text = text || '';
    switch (this.contentType) {
        case InputField.INT :
            text = text.replace(/[^\d\-]/g, '');
            break;
        case InputField.NUMBER :
            text = text.replace(/[^\d\.\-]/g, '');
            break;
        case InputField.EMAIL :
            text = text.replace(/[^\w0-9\@\.]/g, '');
            break;
        case InputField.TEL :
            text = text.replace(/[^\d\(\)\+\-\s]/g, '');
            break;
        default :
            break;
    }
    if (this.characterLimit > 0 && text.length > this.characterLimit) {
        text = text.substr(0, this.characterLimit);
    }
    return text;
};

/**
 * 开始编辑
 */
InputField.prototype.startEditing = function() {
    var self = this,
        textComponent = self.textComponent;
    if (!textComponent) {
        return;
    }
    var input = this._input;
    if (!input) {
        if (window.__wx) {
            var config = {
                defaultValue: self.text,
                maxLength: self.characterLimit,
                multiple: self.lineType === InputField.MULTI_LINE,
                confirmHold: true,
                confirmType: "done",
                success: function() {
                    self._input = { value: self.text, _lastValue: self.text };

                    // 监听键盘事件
                    var inputcallback = function(res) {
                        self._input._lastValue = self._input.value;
                        self._input.value = res.value;
                    }
                    var comfirmcallback = function(res) {
                        self._input._lastValue = self._input.value;
                        self._input.value = res.value;
                        self.stopEditing();
                    }
                    var completecallback = function(res) {
                        self.cancelEditing();
                    }
                    wx.onKeyboardConfirm(comfirmcallback);
                    wx.onKeyboardInput(inputcallback);
                    wx.onKeyboardComplete(completecallback);
                },
                fail: function(e) {
                    self.game.log.trace("showKeyboard fail : {0}", JSON.stringify(e));
                }
            };
            wx.showKeyboard(config);
        }
        else {
            // 创建TextArea组件
            if (this.lineType === InputField.MULTI_LINE) {
                input = self._input = document.createElement('textarea');
                input.onkeydown = function (event) {
                    if (Keyboard.ESC === event.keyCode) {
                        self.cancelEditing();
                    }
                };
                switch (self.contentType) {
                    case InputField.PASSWORD :
                        input.type = 'password';
                        break;
                    case InputField.EMAIL :
                        input.type = 'email';
                        break;
                    case InputField.TEL :
                        input.type = 'tel';
                        break;
                    case InputField.INT:
                    case InputField.NUMBER:
                        input.type = 'number';
                        break;
                    default :
                        input.type = 'text';
                        break;
                }
                switch (textComponent.alignH) {
                    case UIText.LEFT:
                        input.style.textAlign = 'left';
                        break;
                    case UIText.RIGHT:
                        input.style.textAlign = 'right';
                        break;
                    default:
                        input.style.textAlign = 'center';
                        break;
                }
                switch (textComponent.alignV) {
                    case UIText.TOP:
                        input.style.verticalAlign = 'top';
                        break;
                    case UIText.BOTTOM:
                        input.style.verticalAlign = 'bottom';
                        break;
                    default:
                        input.style.verticalAlign = 'middle';
                        break;
                }
            }
            if (this.characterLimit > 0) {
                input.setAttribute('maxlength', this.characterLimit);
            }
            input._qc = self;
            input.value = self.text;
            var style = input.style;
            style.position = 'absolute';
            style.padding = 0;
            style.margin = 0;
            style.border = 0;
            style.outline = 0;
            style.background = 'none';
            input.onblur = function (event) {
                self.stopEditing();
            };
            input._handleClick = function(event) {
                // 点击在div组件上不做处理
                if (event.target !== self.div && event.target !== input) {
                    self.stopEditing();
                }
            };
            var dom = self.game.world.frontDomRoot;
            dom.addEventListener('mousedown', input._handleClick, false);
            dom.addEventListener('touchstart', input._handleClick, false);
            self.game.input._inputting++;

            // 再套一层div，否则由于frontDomRoot的overflow为hidden，
            // 如果input超出边界浏览器会修改frontDomRoot的scrollLeft和scrollTop参数，
            // 导致Dom元素布局偏差，所以特意搞了inputDiv，让浏览器修改inputDiv滚动值而不影响其他人
            var inputDiv = document.createElement('div');
            inputDiv.style.width = this.game.canvas.style.width;
            inputDiv.style.height = this.game.canvas.style.height;
            inputDiv.style.position = 'absolute';
            inputDiv.style.overflow = 'hidden';
            inputDiv.appendChild(input);

            dom.appendChild(inputDiv);
            self._updateInput(input);
            input.focus();

            // textComponent的WorldTransform变化时需要更新native元素位置
            self._updateNativeInput();
            textComponent.phaser.worldTransformChangedCallback = this._updateNativeInput.bind(self);
            textComponent.phaser.worldTransformChangedContext = textComponent;
        }
    }
};

/**
 * 更新输入框位置等信息
 * @param input
 * @private
 */
InputField.prototype._updateInput = function(input) {
    var now = this.game.time.now;
    // 避免更新太频繁
    if (input._lastUpdate && now - input._lastUpdate < 100) {
        return;
    }
    input._lastUpdate = now;

    if (!window.__wx) {
        var textComponent = this.textComponent;
        if (textComponent.textPhaser instanceof Phaser.Text) {
            input.style.font = textComponent.textPhaser.style.font;
        }
        input.style.fontSize = textComponent.fontSize + 'px';
        input.style.color = textComponent.color.toString();
    }

    // 更新值
    if (input._lastValue !== input.value) {
        input._lastValue = input.value;
        this.text = input.value;
    }
};

InputField.prototype.getInput = function() {
    // 如果文本组件删除，则停止编辑
    if (this._input && !this.textComponent) {
        this.cancelEditing();
    }
    return this._input;
};

/**
 * 取消编辑
 */
InputField.prototype.cancelEditing = function() {
    var input = this._input;
    if (input) {
        if (window.__wx) {
            this._input = null;
            wx.hideKeyboard();
            wx.offKeyboardConfirm();
            wx.offKeyboardInput();
            wx.offKeyboardComplete();
        }
        else {
            this._input = null;
            this.game.input._inputting--;
            var dom = this.game.world.frontDomRoot;
            dom.removeEventListener('mousedown', input._handleClick, false);
            dom.removeEventListener('touchstart', input._handleClick, false);
            qc.Util.removeHTML(input.parentNode);
        }
    }
};

/**
 * 停止编辑
 */
InputField.prototype.stopEditing = function() {
    var input = this.getInput();
    if (!input) {
        return;
    }
    this.text = input.value;
    this.cancelEditing();
};

/**
 * 销毁对象前取消编辑
 */
InputField.prototype.onDestroy = function() {
    this.cancelEditing();
    qc.Util.removeHTML(this.div);
    qc.UIImage.prototype.onDestroy.call(this);
};

/**
 * 序列化完成后派发awake事件
 * @override
 * @private
 */
InputField.prototype._dispatchAwake = function() {
    Node.prototype._dispatchAwake.call(this);

    this._checkVisibility();
};

/**
 * 父亲或自身的可见属性发生变化了
 * @protected
 */
InputField.prototype.onVisibleChange = function() {
    this._checkVisibility();
};

/**
 * 检测是否世界可见，不可见是隐藏相关元素
 * @private
 */
InputField.prototype._checkVisibility = function() {
    var visible = this.isWorldVisible();
    this.div.style.display = visible ? 'block' : 'none';
    if (!visible) {
        this.stopEditing();
    }
};

/**
 * 更新native div元素的transform
 * @protected
 */
InputField.prototype._updateNativeDiv = function() {
    var self = this;

    var div = self.div;
    div._lastUpdate = self.game.time.now;
    qc.Util.updateTransform(self, div);
}

/**
 * 更新native input元素的transform
 * @protected
 */
InputField.prototype._updateNativeInput = function() {
    var self = this;

    var input = self.getInput();
    if (input)
        qc.Util.updateTransform(self.textComponent, input);
}

