/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * 更新贴图
 */
var oldTextUpdateTexture = PIXI.Text.prototype.updateTexture;
PIXI.Text.prototype.updateTexture = function() {
    oldTextUpdateTexture.call(this);
    this.displayChanged(qc.DisplayChangeStatus.SIZE | qc.DisplayChangeStatus.TEXTURE);
};

PIXI.Text.prototype.getSelfWidth = function() {
    return this.texture && this.texture.frame && this.texture.frame.width * (this._canvasDownScale ? this._canvasDownScale.x : 1);
};

PIXI.Text.prototype.getSelfHeight = function() {
    return this.texture && this.texture.frame && this.texture.frame.height * (this._canvasDownScale ? this._canvasDownScale.y : 1);
};
/**
 * 将宽度除去分辨率
 * @hackpp
 */
Object.defineProperty(Phaser.Text.prototype, 'dirty', {
    get: function() {
        return this._dirty;
    },
    set: function(value) {
        if (this._dirty === value)
            return;
        this._dirty = value;
        this.displayChanged(qc.DisplayChangeStatus.SIZE | qc.DisplayChangeStatus.TEXTURE);
    }
});


/**
 * 将宽度除去分辨率
 * @hackpp
 */
Object.defineProperty(Phaser.Text.prototype, 'width', {
    get: function() {

        if(this.dirty)
        {
            this.updateText();
            this.dirty = false;
        }

        return this.scale.x * this.texture.frame.width / this.resolution;
    },
    set: function(value) {
        this.scale.x = value / this.texture.frame.width;
        this._width = value;
    }
});

/**
 * 将高度除去分辨率
 * @hackpp
 */
Object.defineProperty(Phaser.Text.prototype, 'height', {
    get: function() {

        if(this.dirty)
        {
            this.updateText();
            this.dirty = false;
        }


        return  this.scale.y * this.texture.frame.height / this.resolution;
    },
    set: function(value) {
        this.scale.y = value / this.texture.frame.height;
        this._height = value;
    }
});

// text 缩放导致的 baseTexture 脏更新的间隔时间
var textScaleDirtyInterval = 200;

/**
 * Renders the object using the Canvas renderer
 *
 * @method _renderCanvas
 * @param renderSession {RenderSession}
 * @private
 */
var oldRenderCanvas = PIXI.Sprite.prototype._renderCanvas;
var oldRenderWebGL = PIXI.Sprite.prototype._renderWebGL;

var createFunc = function(baseRenderFunc){
    return function(renderSession) {
        var gameObject = this._nqc;
        if(this.dirty)
        {
            this.updateText();
            this.getWorldTransform();
            this.dirty = false;
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
                    this.dirty = true;
                }
            }
            else {
                // 世界缩放没任何变化，尝试更新 text canvas
                var textWorldScale = this._worldScale;
                var dirtyInterval = gameObject.scaleDirtyInterval || textScaleDirtyInterval;
                if (fixedTime - gameObject._worldScaleChangeTime > dirtyInterval &&
                    (!textWorldScale || worldScale.x !== textWorldScale.x || worldScale.y !== textWorldScale.y)) {
                    // 不一致，且时间足够长，需要更新
                    this.dirty = true;
                }
            }
        }

        var canvasDownScale = this._canvasDownScale;
        var sessionRoundPixels;

        // 文字绘制开启RoundPixel功能
        var enableRoundPixels = (gameObject.roundPixels !== false);

        if (enableRoundPixels) {
            sessionRoundPixels = renderSession.roundPixels;
            renderSession.roundPixels = true;
        }

        if (!canvasDownScale) {
            baseRenderFunc.call(this, renderSession);
        }
        else {
            var matrix = this.worldTransform;
            var a = matrix.a;
            var b = matrix.b;
            var c = matrix.c;
            var d = matrix.d;
            var x = canvasDownScale.x;
            var y = canvasDownScale.y;
            matrix.a *= x;
            matrix.b *= x;
            matrix.c *= y;
            matrix.d *= y;

            // 调用原始实现
            baseRenderFunc.call(this, renderSession);

            matrix.a = a;
            matrix.b = b;
            matrix.c = c;
            matrix.d = d;
        }

        // 恢复 round pixels
        if (enableRoundPixels) {
            renderSession.roundPixels = sessionRoundPixels;
        }
    };
};

PIXI.Text.prototype.getBounds = function(matrix) {
    if (this.dirty) {
        this.updateText();
        this.dirty = false;
    }
    var canvasDownScale = this._canvasDownScale;
    var wt = this.worldTransform;
    wt.tx = wt.tx || 0;
    wt.ty = wt.ty || 0;
    var a = wt.a;
    var b = wt.b;
    var c = wt.c;
    var d = wt.d;
    var x = canvasDownScale.x;
    var y = canvasDownScale.y;
    wt.a *= x;
    wt.b *= x;
    wt.c *= y;
    wt.d *= y;

    // 调用原始实现
    var result = PIXI.Sprite.prototype.getBounds.call(this, matrix);

    wt.a = a;
    wt.b = b;
    wt.c = c;
    wt.d = d;

    return result;
}

// hack phaser 绘制 text 逻辑
PIXI.Text.prototype._renderCanvas = (function(){ return createFunc(oldRenderCanvas); })();
PIXI.Text.prototype._renderWebGL = (function(){ return createFunc(oldRenderWebGL); })();

/*
 * 当使用 UIText 时，Phaser.Text.prototype.updateText 和 determineFontProperties 两个方法
 * 在 UIText.js 中有被重载，详情见 UIText.js 文件
 */

/**
 * Updates a line of text.
 * @hackpp
 */
Phaser.Text.prototype.updateLine = function (line, x, y, context, strokeThickness, defaultFill, defaultStroke,
                                             lineHeight, gradientFillStyle, UCAndroid) {

    for (var i = 0; i < line.length; i++)
    {
        var letter = line[i];

        if (this.colors[this._charCount])
        {
            if (this.colors[this._charCount] === 'defaultColor') {
                context.fillStyle = defaultFill;
            }
            else {
                context.fillStyle = this.colors[this._charCount];
            }
        }

        var letterWidth = context.measureText(letter).width;
        if (this.style.stroke && strokeThickness) {
            this._clearShadowStyle(context);
            context.strokeText(letter, x, y);
            this._restoreShadowStyle(context);
        }

        if (this.style.fill)
        {
            if (gradientFillStyle === context.fillStyle && UCAndroid) {
                context.save();
                context.fillStyle = 'black';
                context.fillText(letter, x, y);
                context.globalCompositeOperation = 'source-in';
                context.fillStyle = gradientFillStyle;
                context.beginPath();
                context.rect(x, y - lineHeight/2, letterWidth, lineHeight);
                context.clip();
                context.fillRect(x, y - lineHeight/2, letterWidth, lineHeight);
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
                context.fillText(letter, x, y);
            }
        }
        x += letterWidth;

        this._charCount++;
    }
};

// 备份 shadow 信息
Phaser.Text.prototype._clearShadowStyle = function(context) {
    if (this.style.fill && this._nqc && this._nqc.enableShadow) {
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowColor = null;
    }
};

// 还原 shadow 信息
Phaser.Text.prototype._restoreShadowStyle = function(context) {
    if (this.style.fill && this._nqc && this._nqc.enableShadow) {
        if (this._shadowOffset) {
            // 阴影的大小受到缩放影响，绘制的时候计算完毕存在 _shadowOffset 中
            context.shadowOffsetX = this._shadowOffset[0];
            context.shadowOffsetY = this._shadowOffset[1];
        }
        else {
            context.shadowOffsetX = this.style.shadowOffsetX;
            context.shadowOffsetY = this.style.shadowOffsetY;
        }
        context.shadowColor = this.style.shadowColor;
        context.shadowBlur = this.style.shadowBlur;
    }
};

/**
 * 获取指定文字的宽度
 * @param {string} str
 * @returns {Number}
 * @private
 */
Phaser.Text.prototype._getWorldWidth = function(str) {
    if (str.length > 0 && str[str.length - 1] === '\n') {
        var word = str.substr(0,str.length - 1);
        return this.context.measureText(word).width;
    }
    return this.context.measureText(str).width;
};
/**
 * 判断是否为字母
 * @returns {boolean}
 * @private
 */
Phaser.Text.prototype._isLetter = function(letter){
    // TODO 暂时不做单词判断 以后在富文本中处理
    return false;
    if (( letter < "a" || letter > "z" ) && ( letter < "A" || letter > "Z" )){
        return false;
    }
    return true;
};

/**
 * hack text 的 runWordWrap 防止wrap的时候自动添加空格的bug
 * @hackpp
 */
Phaser.Text.prototype.runWordWrap = function (text, width) {
    var spaceWidth = width;
    var lines = [];
    var startPos = 0;
    var isEnter = false;
    for (var i = 0; i < text.length;) {
        // 换行符
        if (text[i] === '\n') {
            var str = text.substr(startPos, i - startPos + 1);
            // 如果只有一个回车符 并且不是第一行 则将回车符加载行尾
            if (str.length === 1 && lines.length > 0 && !isEnter) {
                lines[lines.length - 1] += '\n';
            }
            else
                lines.push(str);
            i++;
            startPos = i;
            isEnter = true;
        }
        else {
            isEnter = false;
            var startletter = -1;
            while (i < text.length) {
                // 判断是否是英文
                var c = text.charAt(i);
                if (this._isLetter(c)) {
                    if (startletter === -1)
                        startletter = i;
                    i++;
                }
                else {
                    if (startletter >= 0) i--;
                    break;
                }
            }
            if (i === text.length) i--;
            var worldWidth = this._getWorldWidth(text.substr(startPos, i - startPos + 1));
            if (worldWidth > spaceWidth) {
                // 如果英文单词为第一个则全部显示
                if (startletter >= 0 && startletter === startPos) {
                    var str = text.substr(startPos, i - startPos + 1);
                    lines.push(str);
                    i++;
                    startPos = i;
                }
                else if(startletter >= 0) {
                    //如果单词是最后出现则下一行显示
                    var len = startletter - startPos;
                    var str = text.substr(startPos, len);
                    lines.push(str);
                    i = startPos + len;
                    startPos = i;
                }
                else {
                    // 如果只有一个文字 显示
                    if (i - startPos === 0) {
                        var str = text.substr(startPos, i - startPos + 1);
                        lines.push(str);
                        i++;
                        startPos = i;
                    }
                    else {
                        var str = text.substr(startPos, i - startPos);
                        lines.push(str);
                        startPos = i;
                    }
                }
            }
            else {
                i++;
                if (i === text.length) {
                    var str = text.substr(startPos, i - startPos + 1);
                    lines.push(str);
                }
            }
        }
    }
    return lines;
};

/**
 * hackpp
 * 覆盖掉原来phaser的帧调度
 */

/**
 * preUpdate 时会初始化一个位置信息，需要设置 transform 为脏
 * @returns {boolean}
 */
Phaser.Text.prototype.preUpdate = function () {
    var qc = this._qc;
    if (qc && !qc.static) {
        if (qc.preUpdate) qc.preUpdate();

        // 脚本调度
        var scripts = qc.scripts;
        var i = scripts.length;
        while (i--) {
            var script = scripts[i];
            if (!script || !script._enable || !script.__hadUpdateOrRender || !script.preUpdate) continue;

            // 如果当前处于editor模式，并且本脚本没有说明是在editor模式下运行，就不要调度了
            if (qc.game.device.editor === true && script.runInEditor !== true) continue;

            // 节点在脚本中析构了，就不继续调度了
            if (!this.visible) return;

            // 调度之
            script.preUpdate();
        }
    }

    if (this.fresh)
    {
        this.world.setTo(this.parent.position.x + this.position.x, this.parent.position.y + this.position.y);
        this.worldTransform.inUpdate = true;
        this.worldTransform.tx = this.world.x;
        this.worldTransform.ty = this.world.y;
        this._isNotNeedCalcTransform = false;
        this.previousPosition.set(this.world.x, this.world.y);
        this.previousRotation = this.rotation;

        this.fresh = false;
        return false;
    }

    this.previousPosition.set(this.world.x, this.world.y);
    this.previousRotation = this.rotation;

    var i = this.children.length;
    while (i--)
    {
        if (this.children[i].visible) {
            this.children[i].preUpdate();
        }
        else {
            this.children[i].renderOrderID = -1;
        }
    }
    return true;
};

/**
 * Override this function to handle any special update requirements.
 *
 * @method Phaser.Text#update
 * @protected
 */
Phaser.Text.prototype.update = function() {
    var qc = this._qc;
    if (qc && !qc.static) {
        if (qc.preUpdate) qc.preUpdate();

        // 脚本调度
        var scripts = qc.scripts;
        var i = scripts.length;
        while (i--) {
            var script = scripts[i];
            if (!script || !script._enable || !script.__hadUpdateOrRender || !script.preUpdate) continue;

            // 如果当前处于editor模式，并且本脚本没有说明是在editor模式下运行，就不要调度了
            if (qc.game.device.editor === true && script.runInEditor !== true) continue;

            // 节点在脚本中析构了，就不继续调度了
            if (!this.visible) return;

            // 调度之
            script.preUpdate();
        }
    }
};
