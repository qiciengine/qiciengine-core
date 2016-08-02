/**
 * @author luohj
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 显示文本控件
 * @class qc.UIText
 * @extends qc.Node
 * @param {qc.Game} game - A reference to the currently running game.
 * @constructor
 * @internal
 */
var UIText = qc.UIText = function(game, parent, uuid) {
    // 调用基类的初始
    qc.Node.call(this, new Phaser.Group(game.phaser, null), parent, uuid);

    // 创建一个phaser的text
    this.textPhaser = new Phaser.Text(game.phaser);
    this.textPhaser._nqc = this;
    this.textPhaser.wordWrapWidth = this.width;
    this.phaser.addChildAt(this.textPhaser, 0);

    // text的真实宽度
    this.textRealWidth = 0;
    // text的真实高度
    this.textRealHeight = 0;

    // 设置默认字体大小为 12 px
    this.fontSize = 12;

    // 外发光text
    this._glowText = null;

    // 设置节点的名字
    this.name = "UIText";

    // 文本内容
    this._data = "";

    // 保存color列表
    this._colors = [];

    // 设置默认颜色
    this.color = Color.black;

    // 默认设置不渐变
    this._gradient = false;

    // 渐变开始的颜色
    this.startColor = Color.red;
    // 渐变结束的颜色
    this.endColor = Color.black;

    // 字体类型
    this._fontFamily = UIText.SYSTEMFONT;

    this.textPhaser.updateText = UIText._phaserUpdateText;

    this.textPhaser.determineFontProperties = UIText._phaserDetermineFontProperties;

    // 设置阴影参数
    this.shadowBlur = 10;
    this.shadowOffsetX = 3;
    this.shadowOffsetY = 3;
    this.shadowColor = Color.shadow;
    this._enableShadow = false;

    // 是否外发光
    this._enableGlow = false;
    // 外发光颜色默认为红色
    this.glowColor = Color.red;

    // 必须描边颜色，默认Phaser设置了‘black’，该参数并不被qc.Color支持
    this.stroke = Color.black;
    // 描边宽度 默认为0
    this._strokeThickness = 0;

    // 模糊值
    this._glowBlur = 1;

    // 是否换行显示
    this._wrap = false;
    // 换行显示宽度
    this._wrapWidth = this.width;

    // 自动根据文字内容的宽高调整text的宽高
    this._autoSize = false;

    // 高度变化通知
    this._onPhaseTextSizeChange = new Phaser.Signal();
    this._onPhaseTextSizeChange.add(function(width, height) {
        if (this.autoSize) {
            this.width = width;
            this.height = height;
        }
    }, this);

    var restore = uuid !== undefined;
    if (restore !== true) {
        // 更改字体为正常
        this.bold = false;

        // 文本水平对齐方式默认为 左对齐
        this.alignH = UIText.LEFT;
        // 文本垂直对齐方式 默认居中对齐
        this.alignV = UIText.MIDDLE;

        // 超出是否部分是否裁剪掉，默认为裁剪
        this.overflow = true;
    }

};

UIText.prototype = Object.create(qc.Node.prototype);
UIText.prototype.constructor = UIText;

/**
 * @constant 文本对齐方式
 * @type {number}
 */
UIText.LEFT = 0;
UIText.RIGHT = 1;
UIText.CENTER = 2;

UIText.TOP = 0;
UIText.BOTTOM = 1;
UIText.MIDDLE = 2;

UIText.SYSTEMFONT = 0;
UIText.WEBFONT = 1;
UIText.BITMAPFONT = 2;

/**
 * @constant 符号
 * @type {number}
 */
UIText._SYMBOL_COLOR = 0;
UIText._SYMBOL_END_COLOR = 1;

Object.defineProperties(UIText.prototype, {

    /**
     * 设置颜色混合
     * @property {qc.Color} colorTint
     */
    colorTint : {
        get : function() {
            return new Color(this.textPhaser.tint);
        },

        set : function(value) {
            value = value || new Color(0xFFFFFF);
            if (!(value instanceof Color))
                throw new Error('Expected qc.Color');
            this.textPhaser.tint = value.toNumber();
        }
    },

    /**
     * @property autoSize - 自动根据文字内容的宽高调整text的宽高
     */
    'autoSize' : {
        get : function() { return this._autoSize; },
        set : function(v) {
            if (v === this._autoSize) return;
            this._autoSize = v;
            if (v && this.textPhaser) {
                this.width = this.textPhaser.width;
                this.height = this.textPhaser.height;
            }
        }
    },

    /**
     * 字体类型
     */
    'fontFamily' : {
        get : function() { return this._fontFamily; },
        set : function(v) {
            if (this._fontFamily === v) return;
            this._fontFamily = v;

            // 设置默认数据
            this._changeText('');
            this._isTransformDirty = true;
        }
    },

    /**
     * 水平对齐方式
     *
     * @property alignH
     * @type number
     * @value UIText.LEFT（左对齐）、UIText.CENTER（居中对齐）、UIText.RIGHT（右对齐）
     * @default UIText.LEFT
     */
    'alignH' : {
        get : function() {
            return this._alignH;
        },
        set : function(v) {
            if (v === this._alignH) return;

            this._alignH = v;
            this.textPhaser.dirty = true;
            this._isTransformDirty = true;
        }
    },

    /**
     * 垂直对齐方式
     *
     * @property alignV
     * @type number
     * @value UIText.TOP（上对齐）、UIText.MIDDLE（居中对齐）、UIText.BOTTOM（下对齐）
     * @default UIText.MIDDLE
     */
    'alignV' : {
        get : function() {
            return this._alignV;
        },
        set : function(v) {
            if (v === this._alignV) return;

            this._alignV = v;
            this.textPhaser.dirty = true;
            this._isTransformDirty = true;
        }
    },

    /**
     * 设置字体
     * @property font
     * @type string
     * @vale Serif Sans-serif Monospace Cursive Fantasy
     * @default Arial
     */
    'font' : {
        get : function() {
            var fontName = this.textPhaser.font.replace(/\'/g, "");
            if(this.fontFamily !== UIText.SYSTEMFONT)
                return this.game.assets.find(fontName);
            return fontName;
        },
        set : function(font) {
            if (!font) return;
            var fontName = font;
            if (this.fontFamily !== UIText.SYSTEMFONT) {
                if (!(font instanceof qc.Font)) {
                    this.game.log.error('Expected qc.Font');
                    return;
                }
                if (this.fontFamily !== font._fontFamily) {
                    this.game.log.error('Invalid font asset');
                    return;
                }

                // webfont采用uuid注册到css中，bitmap在pixi中的索引对应的是url
                fontName = (this.fontFamily === UIText.WEBFONT ? font.uuid : font.url)
            }
            else {
                if (typeof font !== 'string') {
                    this.game.log.error('Expected string');
                    return;
                }
            }

            if (fontName !== this.textPhaser.font) {
                this._changeText(fontName);
                if (this.enableGlow) {
                    this._glowText.font = fontName;
                }
                this._isTransformDirty = true;
            }
        }
    },

    /**
     *设置字体是否为粗体
     * @property bold
     * @type boolean
     * @default false
     */
    'bold' : {
        get : function() {
            return this.textPhaser.fontWeight !== "normal";
        },
        set : function(v) {
            var type = v ? "bold" : "normal";
            if (type === this.textPhaser.fontWeight)
                return;

            this.textPhaser.fontWeight = type;
            if (this._enableGlow) {
                this._glowText.fontWeight = type;
            }
            this._isTransformDirty = true;
        }
    },

    /**
     *设置字体大小
     *
     * @property fontSize
     * @type number
     * @value 10 单位是px
     */
    'fontSize' : {
        get : function() {
            return this.textPhaser.fontSize;
        },
        set : function(v) {
            if (typeof v !== 'number') throw new Error('Expected number');
            if (v === this.textPhaser.fontSize)
                return;

            this.textPhaser.fontSize = v;
            if (this._enableGlow) {
                this._glowText.fontSize = v;
            }
            this._isTransformDirty = true;
        }
    },

    /**
     * 设置字体颜色
     * @property color
     * @type {qc.Color}
     */
    'color' : {
        get : function() {
            return new Color(this.textPhaser.fill);
        },
        set : function(v) {
            if (!(v instanceof Color))
                throw new Error('Expected qc.Color');

            var value = v.toString('rgb');
            if (value === this.textPhaser.fill)
                return;

            this.textPhaser.fill = value;
            this._setTextColor(this.textPhaser);
            if (this._enableGlow) {
                this._glowText.fill = value;
            }
            this._isTransformDirty = true;
        }
    },

    /**
     * 设置文本内容
     *
     * @property text
     * @type string
     * @explain 使用范例[#FF0000]变色[-]也可以[#00FF00]嵌[#0000FF]套[-][-]使用
     */
    'text' : {
        get : function() {
            return this._data;
        },
        set : function(v) {
            if (typeof v !== "string")
                throw new Error("Expected string");
            if (v === this._data)
                return;

            //清空自己缓存的colos
            this._colors = [];

            this._data = v;
            this._parseTextColor(v);
            this._setTextColor(this.textPhaser);

            if (this._enableGlow) {
                this._glowText.text = this.textPhaser.text;
            }
            this._isTransformDirty = true;
        }
    },

    /**
     * 设置行间距
     *
     * @property lineSpacing
     * @type number 单位px
     */
    'lineSpacing' : {
        get : function() {
            return this.textPhaser.lineSpacing;
        },
        set : function(v) {
            if (v === this.textPhaser.lineSpacing)
                return;

            this.textPhaser.lineSpacing = v;
            if (this._enableGlow) {
                this._glowText.lineSpacing = v;
            }
            this._isTransformDirty = true;
        }
    },

    /**
     * 设置换行显示
     * @type boolean
     */
    'wrap' : {
        get : function() {
            return this._wrap;
        },
        set : function(v) {
            if (v === this._wrap)
                return;

            this._wrap = v;
            this.textPhaser.wordWrap = v;
            if (this._enableGlow)
                this._glowText.wordWrap = v;
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {boolean} overflow - 文字显示不下时的处理：如果为TRUE则不裁切，否则裁切
     * @default false
     */
    overflow : {
        get : function() {
            var script = this.getScript('qc.NodeMask');
            if (!script || !script.enable) return true;
            return false;
        },
        set : function(v) {
            var script = this.getScript('qc.NodeMask');
            if (!script) script = this.addScript('qc.NodeMask');
            script.enable = !v;
        }
    },

    /**
     * @property {number} pivotX - 节点自身的原点X位置
     * 0为左边，1为右边
     */
    pivotX : {
        get : function() {
            return Object.getOwnPropertyDescriptor(qc.Node.prototype, 'pivotX').get.call(this);
        },
        set : function(v) {
            Object.getOwnPropertyDescriptor(qc.Node.prototype, 'pivotX').set.call(this, v);
            if (this.textPhaser) {
                this.textPhaser.dirty = true;
                this._adjustTextPos();
            }
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} pivotY - 节点自身的原点Y位置
     * 0为左边，1为右边
     */
    pivotY : {
        get : function() {
            return Object.getOwnPropertyDescriptor(qc.Node.prototype, 'pivotY').get.call(this);
        },
        set : function(v) {
            Object.getOwnPropertyDescriptor(qc.Node.prototype, 'pivotY').set.call(this, v);
            if (this.textPhaser) {
                this.textPhaser.dirty = true;
                this._adjustTextPos();
            }
            this._isTransformDirty = true;
        }
    },

    /**
     *  获取或设置文本的宽度（重载掉父类 Node width 属性）
     *  @property {number} width
     *  @override
     */
    'width': {
        get: function () {
            return Object.getOwnPropertyDescriptor(qc.Node.prototype, 'width').get.call(this);
        },
        set: function (v) {
            if (v === this.width) return;
            Object.getOwnPropertyDescriptor(qc.Node.prototype, 'width').set.call(this, v);

            this._wrapWidth = v;

            if (this._enableGlow)
                this._glowText.wordWrapWidth = v;
            if (this.textPhaser) {
                this.textPhaser.wordWrapWidth = v;
                this._adjustTextPos();
            }
            this._isTransformDirty = true;
        }
    },

    /**
     *  获取或设置文本的高度（重载掉父类 Node height属性）
     *  @property {number} height
     */
    'height': {
        get: function () {
            return Object.getOwnPropertyDescriptor(qc.Node.prototype, 'height').get.call(this);
        },
        set: function (v) {
            if (v === this.height) return;
            Object.getOwnPropertyDescriptor(qc.Node.prototype, 'height').set.call(this, v);
            if (this.textPhaser) {
                this.textPhaser.dirty = true;
                this._adjustTextPos();
            }
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {string} class - 类名字
     * @readonly
     * @internal
     */
    'class' : {
        get : function() { return 'qc.UIText' }
    },

    /**
     * @property {qc.Color} startColor - 渐变开始的颜色
     */
    'startColor' : {
        get : function() { return new Color(this._startColor); },
        set : function(v) {
            if (!(v instanceof Color))
                throw new Error('Expected qc.Color');

            var value = v.toString();
            if (value === this._startColor)
                return;

            this._startColor = value;
            this.textPhaser.dirty = true;
        }
    },

    /**
     * @property {qc.Color} endColor - 渐变结束的颜色
     */
    'endColor' : {
        get : function() { return new Color(this._endColor); },
        set : function(v) {
            if (!(v instanceof Color))
                throw new Error('Expected qc.Color');

            var value = v.toString();
            if (value === this._endColor)
                return;

            this._endColor = value;
            this.textPhaser.dirty = true;
        }
    },

    /**
     * @property {boolean} gradient - 是否开启渐变功能
     */
    'gradient' : {
        get : function() { return this._gradient; },
        set : function(v) {
            if (v === this._gradient)
                return;

            this._gradient = v;
            this.textPhaser.dirty = true;
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {qc.Color} stroke - 描边颜色
     */
    'stroke' : {
        get : function() { return new Color(this.textPhaser.stroke); },
        set : function(v) {
            if (!(v instanceof Color))
                throw new Error('Expected qc.Color');

            var value = v.toString();
            if (value === this.textPhaser.stroke)
                return;

            this.textPhaser.stroke = value;
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} strokeThickness - 描边粗度
     */
    'strokeThickness' : {
        get : function() {
            return this._strokeThickness;
        },
        set : function(v) {
            if (v === this._strokeThickness)
                return;

            this._strokeThickness = v;

            if (this._enableGlow) {
                this._glowText.strokeThickness = this.textPhaser.strokeThickness;
                this._glowText.dirty = true;
            }

            this.textPhaser.dirty = true;
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {boolean} enableShadow - 是否显示阴影
     */
    'enableShadow' : {
        get : function() {
            return this._enableShadow;
        },
        set : function(v) {
            this._enableShadow = v;
            this.textPhaser.dirty = true;
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {qc.Color} shadowColor - 阴影颜色
     */

    'shadowColor' : {
        get : function() { return new Color(this.textPhaser.shadowColor); },
        set : function(v) {
            if (!(v instanceof Color))
                throw new Error('Expected qc.Color');

            var value = v.toString();
            if (value === this.textPhaser.shadowColor)
                return;

            this.textPhaser.shadowColor = value;
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} shadowBlur - 高斯模糊值
     */
    'shadowBlur' : {
        get : function() { return this.textPhaser.shadowBlur; },
        set : function(v) {
            if (v === this.textPhaser.shadowBlur)
                return;

            this.textPhaser.shadowBlur = v;
            this._isTransformDirty = true;
        }
     },

    /**
     * @property {number} shadowOffsetX - 阴影偏移量x
     */
    'shadowOffsetX' : {
        get : function() {
            return this.textPhaser.shadowOffsetX;
        },
        set : function(v) {
            this.textPhaser.shadowOffsetX = v;
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {number} shadowOffsetY - 阴影偏移量y
     */
    'shadowOffsetY' : {
        get : function() {
            return this.textPhaser.shadowOffsetY;
        },
        set : function(v) {
            this.textPhaser.shadowOffsetY = v;
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {qc.Color} glowColor - 外发光颜色
     */
    'glowColor' : {
        get : function() { return new Color(this._glowColor); },
        set : function(v) {
            if (!(v instanceof Color))
                throw new Error('Expected qc.Color');

            var value = v.toString();
            if (value === this._glowColor)
                return;

            this._glowColor = value;
            if (this._glowText) {
                this._glowText.fill = value;
                this._glowText.stroke = value;
                this._glowText.shadowColor = value;
                this._glowText.dirty = true;
            }
        }
    },

    /**
     * @property {number} glowBlur - 外发光模糊值
     */
    'glowBlur' : {
        get : function() { return this._glowBlur; },
        set : function(v) {
            if (v === this._glowBlur) return;
            this._glowBlur = v;
            if (this.enableGlow) {
                this._glowText.filterX.blur = v;
                this._glowText.filterY.blur = v;
            }
        }
    },

    /**
     * @property {boolean} enableGlow - 外发光
     */
    'enableGlow' : {
        get : function() { return this._enableGlow; },
        set : function(v) {
            if (v === this._enableGlow)
                return;

            this._enableGlow = v;
            if (v) {
                this._glowText = new Phaser.Text(this.game.phaser);
                this._glowText._nqc = this;
                this._copyProperty(this._glowText, this.textPhaser);
                this._glowText.x = this.textPhaser.x;
                this._glowText.y = this.textPhaser.y;

                this._glowText.fill = this._glowColor;
                this._glowText.stroke = this._glowColor;

                this._glowText.shadowColor = this._glowColor;

                this._glowText.scale = this.textPhaser.scale;
                this._glowText.pivot = this.textPhaser.pivot;
                this._glowText.rotation = this.textPhaser.rotation;

                this._glowText.updateText = UIText._phaserUpdateText;

                this._glowText.determineFontProperties = UIText._phaserDetermineFontProperties;

                this._glowText.font = this.textPhaser.font;

                this.phaser.addChildAt(this._glowText, 0);

                var filterX = new qc.Filter.BlurX(this.game);
                var filterY = new qc.Filter.BlurY(this.game);
                filterX.blur = this.glowBlur;
                filterY.blur = this.glowBlur;

                this._glowText.filters = [filterX, filterY];
                this._glowText.filterX = filterX;
                this._glowText.filterY = filterY;
            }
            else {
                this.phaser.removeChild(this._glowText);
                this._glowText.destroy();
                this._glowText = null;
                this.textPhaser.dirty = true;
            }
            this._isTransformDirty = true;
        }
    },

    /**
     * @property {qc.Rectangle} nativeSize - text实际大小
     * @readonly
     */
    nativeSize : {
        get : function() {
            var rect = this.rect;
            rect.width = this.textRealWidth;
            rect.height = this.textRealHeight;
            return rect;
        }
    }
});

/**
 * 切换text 和 bitmapText
 * @param {string} font
 * @private
 */
UIText.prototype._changeText = function(font) {
    var isBitmapText = PIXI.BitmapText.fonts[font];

    var text ;
    if (isBitmapText) {
        text = new Phaser.BitmapText(this.game.phaser, 0, 0, font);
        if (this._glowText)
            this._glowText.visible = false;
    }
    else {
        text = new Phaser.Text(this.game.phaser);
        text.updateText = UIText._phaserUpdateText;

        text.determineFontProperties = UIText._phaserDetermineFontProperties;
        if (this._glowText) {
            this._glowText.visible = true;
        }
    }

    text.font = font;

    text._nqc = this;

    // 字体重置为默认
    // text属性设置为上一个text的属性
    this._copyProperty(text, this.textPhaser);
    text.x = this.textPhaser.x;
    text.y = this.textPhaser.y;
    if (this._glowText) {
        this._glowText.font = text.font;
    }

    // 获取在父节点中得索引位置，并且将它移除
    var index = this.phaser.getChildIndex(this.textPhaser);
    if (this.phaser.removeAt) {
        this.phaser.removeAt(index);
    }
    else {
        this.phaser.removeChildAt(index);
    }

    // 替换成新的text
    // Phaser.Group类型采用addAt
    if (this.phaser.addAt) {
        this.phaser.addAt(text, index);
    }
    else {
        this.phaser.addChildAt(text, index);
    }

    this.textPhaser.destroy();
    this.textPhaser = text;
    this._isTransformDirty = true;
    this._setTextColor(this.textPhaser);
};

/**
 * 设置节点的宽度，可能会被重载，这接口不会引起重排
 * @overide
 * @protected
 */
UIText.prototype.setWidth = function(w) {
    qc.Node.prototype.setWidth.call(this, w);

    this._wrapWidth = w;
    if (this.textPhaser) {
        this.textPhaser.wordWrapWidth = w;
        this._adjustTextPos();
    }
};

/**
 * 设置节点的高度，可能会被重载，这接口不会引起重排
 * @overide
 * @protected
 */
UIText.prototype.setHeight = function(h) {
    qc.Node.prototype.setHeight.call(this, h);
    if (this.textPhaser) {
        this.textPhaser.dirty = true;
        this._adjustTextPos();
    }
};

/**
 * 关注文字的 postUpdate，在此阶段进行文字信息的更新
 */
UIText.prototype.postUpdate = function() {
    var gameObject = this;
    var phaser = this.textPhaser;

    if (phaser.dirty)
    {
        phaser.updateText();
    }
    else {
        var worldScale = gameObject.getWorldScale();
        var preWorldScale = gameObject._preWorldScale;
        var fixedTime = gameObject.game.time.fixedTime;

        if (!preWorldScale) {
            // 初始化上一帧世界缩放
            gameObject._preWorldScale = new qc.Point(worldScale.x, worldScale.y);
            gameObject._worldScaleChangeTime = fixedTime;
        }
        else if (preWorldScale.x !== worldScale.x || preWorldScale.y !== worldScale.y) {
            // 世界缩放发生变更，记录下来
            preWorldScale.x = worldScale.x;
            preWorldScale.y = worldScale.y;
            gameObject._worldScaleChangeTime = fixedTime;
            if (gameObject.scaleDirtyInterval === 0) {
                phaser.updateText();
            }
        }
        else {
            // 世界缩放没任何变化，尝试更新 text canvas
            var textWorldScale = phaser._worldScale;
            var dirtyInterval = gameObject.scaleDirtyInterval || textScaleDirtyInterval;
            if (fixedTime - gameObject._worldScaleChangeTime > dirtyInterval &&
                (!textWorldScale || worldScale.x !== textWorldScale.x || worldScale.y !== textWorldScale.y)) {
                // 不一致，且时间足够长，需要更新
                phaser.updateText();

            }
        }
    }
};

/**
 * 拷贝属性
 * @method _copyProperty
 * @param {Phaser.Text} source
 * @param {Phaser.Text} target
 * @private
 */
UIText.prototype._copyProperty = function(source, target) {
    source.align = target.align;
    source.fontWeight = target.fontWeight;
    source.fontSize = target.fontSize;
    source.lineSpacing = target.lineSpacing;
    source.wordWrap = this._wrap;
    source.name = target.name;
    source.scale = target.scale;
    source.pivot = target.pivot;
    source.rotation = target.rotation;
    source.alpha = target.alpha;
    source.visible = target.visible;
    source.renderable = target.renderable;
    source.mask = target.mask;
    source.text = target.text;
    source.wordWrapWidth = this._wrapWidth;
    source.stroke = target.stroke;
    source.strokeThickness = target.strokeThickness;
    source.shadowColor = target.shadowColor;
    source.shadowOffsetX = target.shadowOffsetX;
    source.shadowOffsetY = target.shadowOffsetY;
    source.fill = target.fill;
    source.fontFamily = this.fontFamily;
};

/**
 * 解析符号
 * @method _parseSymbol
 * @param {string} parseText 需要解析的文本
 * @param {number} pos 已经解析到的位置
 * @param {array} colorArray
 * @return {object}
 * @private
 */
UIText.prototype._parseSymbol = function(parseText, pos, colorArray) {
    var result = {};
    result.result = false;
    if (parseText[pos] !== "[")
        return result;

    //查找] 或 [
    var i = pos;
    while (++i) {
        // 目前只考虑颜色标示，所以只考虑25的最大长度
        if (parseText[i] === "[" || i >= parseText.length || i - pos > 25) {
            return result;
        }
        if (parseText[i] === "]") {
            break;
        }
    }
    var len = i - pos;
    if (len > 2 && parseText[pos + 1] === "#") {
        // 颜色开始
        result.color = parseText.slice(pos + 1, i);
        result.result = true;
        result.type = UIText._SYMBOL_COLOR;
    }
    else if (len > 6 && parseText[pos + 1] === "r" && parseText[pos + 2] === "g" && parseText[pos + 3] === "b") {
        // 颜色开始
        result.color = parseText.slice(pos + 1, i);
        result.result = true;
        result.type = UIText._SYMBOL_COLOR;
    }
    else if(parseText[pos + 1] === "-" && parseText[pos + 2] === "]") {
        // 颜色结束
        if ((colorArray.length > 0))
            result.result = true;
        result.type = UIText._SYMBOL_END_COLOR;
    }
    // TODO: 添加各种符号

    if (result.result) {
        result.pos = i;
    }

    return result;
};
/**
 * 添加缓存颜色
 * @method _pushColor
 * @param {string} color 颜色
 * @param {number} pos 位置
 * @private
 */
UIText.prototype._pushColor = function(color, pos) {
    var colorItem = {};
    colorItem.color = color;
    colorItem.pos = pos;
    this._colors.push(colorItem);
    this._isTransformDirty = true;
};

/**
 * 设置text颜色
 * @method _setTextColor
 * @private
 */
UIText.prototype._setTextColor = function(phaser) {
    // 清空phaser字体颜色
    if (phaser.clearColors)
        phaser.clearColors();

    if (!phaser.addColor)
        return;

    for (var i = 0; i < this._colors.length; i++) {
        var textColor = this._colors[i].color === 'defaultColor' ? 'defaultColor' : this._colors[i].color;
        phaser.addColor(textColor, this._colors[i].pos);
    }
    this._isTransformDirty = true;
};

/**
 * 解析文本颜色
 * @method _parseTextColor
 * @param {string} text
 * @private
 * @explain 使用范例[#FF0000]变色[-]也可以[#00FF00]嵌[#0000FF]套[-][-]使用
 */
UIText.prototype._parseTextColor = function(text) {
    // 将 \r \n \r\n 统一替换为 \n 后进行 parse color
    text = text.replace(/(?:\r\n|\r|\n)/g, '\n');

    var showText = "";
    var colorArray = [];
    for (var i = 0; i < text.length; i++) {
        var result = this._parseSymbol(text, i, colorArray);
        if (result.result) {
            // 根据对应的符号处理
            i = result.pos;

            if(result.type === UIText._SYMBOL_COLOR) {
                //添加颜色
                colorArray.push(result.color);
                this._pushColor(result.color, showText.length);
            }
            else if(result.type === UIText._SYMBOL_END_COLOR) {
                colorArray.pop();
                var color = (colorArray.length > 0) ? colorArray[colorArray.length - 1] : "defaultColor";
                this._pushColor(color, showText.length);
            }
        }
        else
            showText += text[i];
    }
    this.textPhaser.text = showText;
    this._isTransformDirty = true;
};

/**
 * 获取需要被序列化的信息描述
 * @overide
 * @internal
 */
UIText.prototype.getMeta = function() {
    var json = Node.prototype.getMeta.call(this);

    // 增加UIText需要序列化的内容
    json.fontFamily = Serializer.NUMBER;
    json.alignH = Serializer.NUMBER;
    json.alignV = Serializer.NUMBER;
    json.font = Serializer.FONT;
    json.bold = Serializer.BOOLEAN;
    json.fontSize = Serializer.NUMBER;
    json.color = Serializer.COLOR;
    json.text = Serializer.STRING;
    json.lineSpacing = Serializer.NUMBER;
    json.wrap = Serializer.BOOLEAN;
    json.enableGlow = Serializer.BOOLEAN;
    json.startColor = Serializer.COLOR;
    json.endColor = Serializer.COLOR;
    json.gradient = Serializer.BOOLEAN;
    json.stroke = Serializer.COLOR;
    json.strokeThickness = Serializer.NUMBER;
    json.glowColor = Serializer.COLOR;
    json.autoSize = Serializer.BOOLEAN;
    json.shadowColor = Serializer.COLOR;
    json.shadowBlur = Serializer.NUMBER;
    json.shadowOffsetX = Serializer.NUMBER;
    json.shadowOffsetY = Serializer.NUMBER;
    json.enableShadow = Serializer.BOOLEAN;

    return json;
};

/**
 * 纠正text坐标
 * @method _adjustTextPos
 * @param {number} width - text宽度
 * @param {number} height - text高度
 * @private
 */
UIText.prototype._adjustTextPos = function() {
    var width = this.textPhaser.realWidth;
    var height = this.textPhaser.realHeight;
    // 纠正水平方向
    this.textPhaser.x = -this.pivotX * this.width;
    if (this._alignH === UIText.RIGHT) {
        this.textPhaser.x = this.textPhaser.x + this.width - width;
    }
    else if (this._alignH === UIText.CENTER) {
        this.textPhaser.x = this.textPhaser.x + (this.width - width) / 2;
    }

    // 纠正垂直方向
    this.textPhaser.y = -this.pivotY * this.height;
    if (this._alignV === UIText.BOTTOM) {
        this.textPhaser.y = this.textPhaser.y + this.height - height;
    }
    else if (this._alignV === UIText.MIDDLE) {
        this.textPhaser.y = this.textPhaser.y + (this.height - height) / 2;
    }

    // 画布如果存在偏移，绘制的时候需要反向偏移回来
    if (this._shiftCanvas) {
        this.textPhaser.x -= this._shiftCanvas[0];
        this.textPhaser.y -= this._shiftCanvas[1];
    }
    if (this._enableGlow) {
        this._glowText.x = this.textPhaser.x;
        this._glowText.y = this.textPhaser.y;
        this._glowText.dirty = true;
    }
    this._isTransformDirty = true;
};

/**
 * 字体加载成功回调
 * @param {string} fontName - 字体名称
 * @internal
 */
UIText.prototype._refreshWebFont = function(fontName) {
    if (!/^(?:inherit|serif|sans-serif|cursive|fantasy|monospace)$/.exec(fontName) && !/['",]/.exec(fontName))
    {
        fontName = "'" + fontName + "'";
    }
    if (fontName === this.textPhaser.font) {
        this.textPhaser.dirty = true;
        if (this._glowText) {
            this._glowText.dirty = true;
        }
        this._isTransformDirty = true;
    }
};

/**
 * hack text 的 updateText 方法为了实现文字渐变等功能
 * @hackpp
 */
UIText._phaserUpdateText = function() {
    var textInWebGL = !this._canvasMode;

    // webgl 模式下的文字，更新文字时：
    //     先将 drawSprite 赋给 text 对象，作为其 texture
    //     将文字绘制在该 canvas 上
    //     离线该 canvas 文字到 render texture 上
    if (textInWebGL) this.texture = PIXI.Text.drawSprite;

    // 世界缩放比例
    var _qc = this._nqc;
    var canvas = this.canvas;
    var context = this.context;

    var worldScale = _qc.getWorldScale();

    // 取当前 canvas 缩放最大值的参考值（避免手机超标）
    // PC 上容忍限度高一些，直接使用 1920，手机上最小取 960，如果机器分辨率允许使用更高
    var isDesktop = _qc.game.device.desktop;
    var gameWorldWidth = isDesktop ?  1920 : Math.max(960,_qc.game.world.width);
    var gameWorldHeight = isDesktop ?  1920 : Math.max(960, _qc.game.world.height);

    // 判断是否为Android下UC浏览器，Android下的UC绘制不了渐进色文字，
    // 但目前Android下的UC浏览器的UA信息居然都是iPhone无法识别是否为Android
    var UCAndroid = _qc.game.device.phaser.UCBrowser;// && _qc.game.device.phaser.android;

    // 记录下来，后续判断不变化就不再更新
    this._worldScale = new qc.Point(worldScale.x, worldScale.y);

    var canvasScaleX = Math.max(0.2, Math.min(10, Math.abs(worldScale.x)));
    var canvasScaleY = Math.max(0.2, Math.min(10, Math.abs(worldScale.y)));

    var resolution = this.resolution = _qc.game.resolution;
    this.texture.baseTexture.resolution = resolution;
    this.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

    context.font = this.style.font;

    var outputText = this.text;

    var textWidth = _qc.width;
    if (this.style.wordWrap) {
        outputText = outputText.replace(/(?:\r\n|\r|\n)/g, '\n');
        var lines = this.runWordWrap(outputText, textWidth);
    }
    else {
        var lines = outputText.split(/(?:\r\n|\r|\n)/);
        for (var i = 0; i < lines.length - 1; i++) {
            lines[i] += '\n';
        }
    }

    // @hackpp
    var gameObject = _qc;

    // calculate text width
    var lineWidths = [];
    var maxLineWidth = 0;

    // hackapp
    var fontHeight = this.determineFontProperties(context.font).fontSize;

    for (var i = 0; i < lines.length; i++) {
        var lineWidth = this._getWorldWidth(lines[i]);
        lineWidths[i] = lineWidth;
        maxLineWidth = Math.max(maxLineWidth, lineWidth);
    }
    maxLineWidth = Math.ceil(maxLineWidth);

    //hackapp
    var strokeThickness = this.style.stroke ? gameObject._strokeThickness : 0;
    var shadowOffsetX = _qc.enableShadow  ? this.style.shadowOffsetX : 0;
    var shadowOffsetY = _qc.enableShadow  ? this.style.shadowOffsetY : 0;

    var canvasWidth = this.realWidth = maxLineWidth;
    this.realWidth = canvasWidth;

    // 最大进行限制
    if (canvasWidth * resolution * canvasScaleX > gameWorldWidth)
        canvasScaleX = gameWorldWidth / (canvasWidth * resolution);

    //hackapp
    var lineHeight = fontHeight;
    var height = lineHeight * lines.length;
    var lineSpacing = this._lineSpacing;

    if (lineSpacing < 0 && Math.abs(lineSpacing) > lineHeight)
    {
        lineSpacing = -lineHeight;
    }

    // Adjust for line spacing
    if (lineSpacing !== 0) {
        var diff = lineSpacing * (lines.length - 1);
        height += diff;
    }
    var canvasHeight = this.realHeight = height;

    // 最大进行限制
    if (canvasHeight * resolution * canvasScaleY > gameWorldHeight)
        canvasScaleY = gameWorldHeight / (canvasHeight * resolution);

    gameObject.textRealWidth = maxLineWidth;
    gameObject.textRealHeight = height;

    // 记录下来，绘制的时候需要反向缩放
    var canvasScale = Math.min(canvasScaleX, canvasScaleY);

    // shadow offset 受到 canvas scale 影响，在这里完成修正
    shadowOffsetX *= canvasScale * resolution;
    shadowOffsetY *= canvasScale * resolution;
    this._shadowOffset = [shadowOffsetX, shadowOffsetY];

    // 因为 stroke 而带来的画布增开大小
    var storkeThicknessAfterScale = strokeThickness * canvasScale * resolution / 2;

    // 横竖增加额外区域
    canvasWidth = canvasWidth * resolution * canvasScale +
                      storkeThicknessAfterScale + Math.max(Math.abs(shadowOffsetX), storkeThicknessAfterScale);
    canvasHeight = canvasHeight * resolution * canvasScale +
                      storkeThicknessAfterScale + Math.max(Math.abs(shadowOffsetY), storkeThicknessAfterScale);

    canvas.width = Math.max(Math.ceil(canvasWidth), 1);
    canvas.height = Math.max(Math.ceil(canvasHeight), 1);

    this._canvasDownScale = new qc.Point(1 / canvasScale, 1 / canvasScale);
    context.scale(resolution * canvasScale, resolution * canvasScale);

    // 尝试偏移画布，保证 offset 是负数的时候也能显示全
    var lshiftX, lshiftY;
    lshiftX = lshiftY = storkeThicknessAfterScale;
    if (shadowOffsetX < 0) lshiftX = Math.max(lshiftX, -shadowOffsetX);
    if (shadowOffsetY < 0) lshiftY = Math.max(lshiftY, -shadowOffsetY);
    lshiftX /= canvasScale * resolution;
    lshiftY /= canvasScale * resolution;
    _qc._shiftCanvas = [ lshiftX, lshiftY ];
    context.translate(lshiftX, lshiftY);

    // 设置水平偏移
    var lineAlignHOffsets = [];
    for (i = 0; i < lines.length; i++) {
        var alignHOffset = 0;

        if (gameObject._alignH === UIText.RIGHT)
        {
            alignHOffset = this.realWidth - lineWidths[i];
        }
        else if (gameObject._alignH === UIText.CENTER)
        {
            alignHOffset = (this.realWidth - lineWidths[i]) / 2;
        }

        lineAlignHOffsets.push(alignHOffset);
    }
    // 设置文字开始打印的Y坐标
    var startYPos = 0;
    if (gameObject._alignV === UIText.BOTTOM) {
        startYPos = this.realHeight - height;
    }
    else if (gameObject._alignV === UIText.MIDDLE) {
        startYPos = (this.realHeight - height) / 2;
    }

    if (navigator.isCocoonJS)
    {
        context.clearRect(0, 0, this.realWidth, this.realHeight);
    }

    context.font = this.style.font;
    context.strokeStyle = this.style.stroke;
    context.textBaseline = "middle";
    if (gameObject.enableShadow) {
        context.shadowOffsetX = shadowOffsetX;
        context.shadowOffsetY = shadowOffsetY;
        context.shadowColor = this.style.shadowColor;
        context.shadowBlur = this.style.shadowBlur;
    }
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = strokeThickness;
    this._charCount = 0;

    var gradientFillStyle;
    if (gameObject._gradient) {
        gradientFillStyle = context.createLinearGradient(0, startYPos, 0, startYPos + height * this.scale.y);
        var offset = 1 / lines.length;
        gradientFillStyle.addColorStop(0, gameObject._startColor);
        for(var i  = 1; i < lines.length; i++) {
            gradientFillStyle.addColorStop(offset * i, gameObject._endColor);
            gradientFillStyle.addColorStop(offset * i, gameObject._startColor);
        }
        gradientFillStyle.addColorStop(1, gameObject._endColor);
        context.fillStyle = gradientFillStyle;
    }
    else {
        context.fillStyle = this.style.fill;
    }

    var vFillStyle = context.fillStyle;
    var vStrokeStyle = context.strokeStyle;
    var linePositionX;
    var linePositionY;

    // Draw text line by line
    for (i = 0; i < lines.length; i++)
    {
        linePositionX = lineAlignHOffsets[i];
        linePositionY = startYPos + i * lineHeight + lineHeight / 2;

        if (i > 0) {
            linePositionY += (lineSpacing * i);
        }

        if (this.colors.length > 0)
        {
            this.updateLine(lines[i], linePositionX, linePositionY, context, strokeThickness, vFillStyle, vStrokeStyle,
                lineHeight, gradientFillStyle, UCAndroid);
        }
        else
        {
            if (this.style.stroke && strokeThickness) {
                this._clearShadowStyle(context);
                context.strokeText(lines[i], linePositionX, linePositionY);
                this._restoreShadowStyle(context);
            }
            if (this.style.fill)
            {
                // UC浏览器不支持渐进色文字，在此特殊处置之
                if (gradientFillStyle && UCAndroid) {
                    context.save();
                    context.fillStyle = 'black';
                    context.fillText(lines[i], linePositionX, linePositionY);
                    context.globalCompositeOperation = 'source-in';
                    context.fillStyle = gradientFillStyle;
                    context.beginPath();
                    context.rect(linePositionX, linePositionY - lineHeight/2, lineWidths[i], lineHeight);
                    context.clip();
                    context.fillRect(linePositionX, linePositionY - lineHeight/2, lineWidths[i], lineHeight);
                    context.restore();
                    if (qc.__IS_ANDROID_UC) {
                        var tempCanvas = qc._tempCanvas;
                        if (!tempCanvas) {
                            tempCanvas = qc._tempCanvas = document.createElement('canvas');
                            tempCanvas.width = 128;
                            tempCanvas.height = 128;
                        }
                        context.drawImage(tempCanvas, 0, 0, 2, 2, -5, -5, 1, 1);
                    }
                }
                else {
                    context.fillText(lines[i], linePositionX, linePositionY);
                }
            }
        }
    }

    this.updateTexture();

    // 并非跑在 webgl 模式下，如果是 webgl 模式，更新 render texture
    if (textInWebGL) this._uploadToRenderTexture();

    /**
     * @hackpp 修复Canvas模式下染色不更新的问题
     * https://github.com/photonstorm/phaser/commit/9362a2b1f480ef570c2a5a05e2fceec03e169262
     * Text with tints applied wouldn't update properly in Canvas mode.
     */
    this.cachedTint = null;

    // TODO 先全部通知
    //_qc._onPhaseTextSizeChange.dispatch(width, height);
    _qc._adjustTextPos();

    // 更新世界坐标，并标记缓存为干净
    this.getWorldTransform();
    this.dirty = false;
};

/**
 * hack text 的 determineFontProperties 方法为了获取行高
 * @hackpp
 */
UIText._phaserDetermineFontProperties = function(fontStyle) {
    var properties = PIXI.Text.fontPropertiesCache[fontStyle];

    if (!properties)
    {
        properties = {};
        if (!PIXI.Text.fontPropertiesCanvas) {
            PIXI.Text.fontPropertiesCanvas = PIXI.sharedCanvas;
            PIXI.Text.fontPropertiesContext = PIXI.Text.fontPropertiesCanvas.getContext('2d');
        }
        var canvas = PIXI.Text.fontPropertiesCanvas;
        var context = PIXI.Text.fontPropertiesContext;

        context.font = fontStyle;

        var width = Math.ceil(context.measureText('|MÉq').width);
        if (width === 0) width = 1;
        var baseline = Math.ceil(context.measureText('M').width);

        var height = 2 * baseline;
        if (height === 0) height = 1;

        baseline = baseline * 1.4 | 0;

        canvas.width = width;
        canvas.height = height;

        context.fillStyle = '#f00';
        context.fillRect(0, 0, width, height);

        context.font = fontStyle;

        context.textBaseline = 'alphabetic';
        context.fillStyle = '#000';
        context.fillText('|MÉq', 0, baseline);

        var imagedata = context.getImageData(0, 0, width, height).data;
        var pixels = imagedata.length;
        var line = width * 4;

        var i, j;

        var idx = 0;
        var stop = false;

        // ascent. scan from top to bottom until we find a non red pixel
        for (i = 0; i < baseline; i++)
        {
            for (j = 0; j < line; j += 4)
            {
                if (imagedata[idx + j] !== 255)
                {
                    stop = true;
                    break;
                }
            }
            if (!stop)
            {
                idx += line;
            }
            else
            {
                break;
            }
        }

        properties.ascent = baseline - i;

        idx = pixels - line;
        stop = false;

        // descent. scan from bottom to top until we find a non red pixel
        for (i = height; i > baseline; i--)
        {
            for (j = 0; j < line; j += 4)
            {
                if (imagedata[idx + j] !== 255)
                {
                    stop = true;
                    break;
                }
            }
            if (!stop)
            {
                idx -= line;
            }
            else
            {
                break;
            }
        }

        properties.descent = i - baseline;

        properties.fontSize = properties.ascent + properties.descent;

        PIXI.Text.fontPropertiesCache[fontStyle] = properties;
    }

    return properties;
};
