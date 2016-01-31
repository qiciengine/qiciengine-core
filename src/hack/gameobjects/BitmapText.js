/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */


Phaser.BitmapText.prototype._isLetter = Phaser.Text.prototype._isLetter;
Phaser.BitmapText.prototype.runWordWrap = Phaser.Text.prototype.runWordWrap;

/**
 * 获取指定文字的宽度
 * @param {string} str
 * @returns {Number}
 * @private
 */
Phaser.BitmapText.prototype._getWorldWidth = function(str) {
    var width = 0;
    var data = PIXI.BitmapText.fonts[this.fontName];
    if (!data || !str) return width;
    var scale = this.fontSize / data.size;
    var prevCharCode = null;
    for (var i = 0; i < str.length; i++) {
        var charCode = str.charCodeAt(i);
        var charData = data.chars[charCode];
        if (!charData) continue;
        if (prevCharCode && charData.kerning[prevCharCode]) {
            width += charData.kerning[prevCharCode];
        }
        width += charData.xAdvance;
        prevCharCode = charCode;
    }
    return width * scale;
};

/**
 * hack updateText - 解决没有设置字体的时候会崩溃
 */
PIXI.BitmapText.prototype.updateText = function()
{
    var text = this.text;
    // @hackapp
    if (!this._nqc) return;
    var data = PIXI.BitmapText.fonts[this.fontName];
    if (!data) return;

    var pos = new PIXI.Point();
    var prevCharCode = null;
    var chars = [];
    var maxLineWidth = 0;
    var lineWidths = [];
    var line = 0;
    var scale = this.fontSize / data.size;
    var lastSpace = 0;

    var startPos = 0;
    var lines = [];

    if (this._nqc.wrap) {
        text = text.replace(/\r/ig,"").replace(/\n/ig,"\n");
        var lines = this.runWordWrap(text, this._nqc.width);
    }
    else {
        var lines = text.split(/(?:\r\n|\r|\n)/);
        for (var i = 0; i < lines.length - 1; i++) {
            lines[i] += '\n';
        }
    }

    pos.x = 0;
    pos.y = 0;
    for (var i = 0; i < lines.length; i++) {
        pos.x = 0;
        prevCharCode = null;
        var world = lines[i];
        for ( var j = 0; j < world.length; j++) {
            var charCode = world.charCodeAt(j);
            var charData = data.chars[charCode];
            if (!charData) continue;

            if (prevCharCode && charData.kerning[prevCharCode]) {
                pos.x += charData.kerning[prevCharCode];
            }

            chars.push({texture:charData.texture, line: i, charCode: charCode, position: new PIXI.Point(pos.x + charData.xOffset, pos.y + charData.yOffset)});

            pos.x += charData.xAdvance;

            prevCharCode = charCode;
        }
        lineWidths.push(pos.x);
        maxLineWidth = Math.max(maxLineWidth, pos.x);
        pos.y += data.lineHeight;
    }

    var lineAlignOffsets = [];

    for (i = 0; i <= lines.length; i++)
    {
        var alignOffset = 0;

        if (this.style.align === 'right')
        {
            alignOffset = maxLineWidth - lineWidths[i];
        }
        else if (this.style.align === 'center')
        {
            alignOffset = (maxLineWidth - lineWidths[i]) / 2;
        }

        lineAlignOffsets.push(alignOffset);
    }

    var lenChildren = this.children.length;
    var lenChars = chars.length;
    var tint = this.tint || 0xFFFFFF;

    this.textWidth = maxLineWidth * scale;
    this.textHeight = data.lineHeight * scale;

    var ax = this.textWidth * this.anchor.x;
    var ay = this.textHeight * this.anchor.y;

    for (i = 0; i < lenChars; i++)
    {
        var c = i < lenChildren ? this.children[i] : this._pool.pop(); // get old child if have. if not - take from pool.

        if (c) c.setTexture(chars[i].texture); // check if got one before.
        else c = new PIXI.Sprite(chars[i].texture); // if no create new one.

        c.position.x = ((chars[i].position.x + lineAlignOffsets[chars[i].line]) * scale) - ax;
        // @hackapp
        c.position.y = Math.floor((chars[i].position.y * scale) - ay);

        c.scale.x = c.scale.y = scale;
        c.tint = tint;
        if (!c.parent) this.addChild(c);
    }

    //  Remove unnecessary children and put them into the pool
    while (this.children.length > lenChars)
    {
        var child = this.getChildAt(this.children.length - 1);
        this._pool.push(child);
        this.removeChild(child);
    }

    this._nqc.textRealWidth = this.textWidth;
    this._nqc.textRealHeight = this.textHeight;
    this.realWidth = this.textWidth;
    this.realHeight = this.textHeight;

    // @hackapp
    this._nqc._adjustTextPos(this.textWidth, this.textHeight);
};

/**
 * hackpp
 * 覆盖掉原来phaser的帧调度
 */

/**
 * Automatically called by World.preUpdate.
 *
 * @method
 * @memberof Phaser.BitmapText
 * @return {boolean} True if the BitmapText was rendered, otherwise false.
 */
Phaser.BitmapText.prototype.preUpdate = function () {
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

    // 物理调度
    if (this.fresh) {
        if (qc) qc._isTransformDirty = true;
        this.fresh = false;
        return false;
    }
    this.previousPosition.set(this.world.x, this.world.y);
    this.previousRotation = this.rotation;

    // 主调度
    this.previousPosition.set(this.world.x, this.world.y);
    this.previousRotation = this.rotation;
    this.world.setTo(this.game.camera.x + this.worldTransform.tx, this.game.camera.y + this.worldTransform.ty);
    this.renderOrderID = this.game.stage.currentRenderOrderID++;

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
 * Automatically called by World.preUpdate.
 * @method Phaser.BitmapText.prototype.postUpdate
 */
Phaser.BitmapText.prototype.postUpdate = function () {
    //  Fixed to Camera?
    if (this.fixedToCamera)
    {
        this.x = this.game.camera.view.x + this.cameraOffset.x;
        this.y = this.game.camera.view.y + this.cameraOffset.y;
    }

    var qc = this._qc;
    if (qc && !qc.static) {
        if (qc.postUpdate) qc.postUpdate();

        // 脚本调度
        var scripts = qc.scripts;
        var i = scripts.length;
        while (i--) {
            var script = scripts[i];
            if (!script || !script._enable || !script.__hadUpdateOrRender || !script.postUpdate) continue;

            // 如果当前处于editor模式，并且本脚本没有说明是在editor模式下运行，就不要调度了
            if (qc.game.device.editor === true && script.runInEditor !== true) continue;

            // 调度之
            script.postUpdate();

            // 节点在脚本中析构了，就不继续调度了
            if (!this.visible) return;
        }
    }
};
