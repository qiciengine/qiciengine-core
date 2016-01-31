/**
 * @author chenqx
 * copyright 2015 Qcplay All Rights Reserved.
 */
var oldSpriteSetTexture = PIXI.Sprite.prototype.setTexture;
PIXI.Sprite.prototype.setTexture = function(texture) {
    oldSpriteSetTexture.call(this, texture);
    this.displayChanged(qc.DisplayChangeStatus.TEXTURE | qc.DisplayChangeStatus.SIZE);
};

PIXI.Sprite.prototype.getSelfWidth = function() {
    if (this._qc) {
        return this._qc.width;
    }
    return this.texture && this.texture.frame && this.texture.frame.width;
};

PIXI.Sprite.prototype.getSelfHeight = function() {
    if (this._qc) {
        return this._qc.height;
    }
    return this.texture && this.texture.frame && this.texture.frame.height;
};

/**
 * Renders the object using the WebGL renderer
 *
 * @method _renderWebGL
 * @param renderSession {RenderSession}
 * @private
 */
PIXI.Sprite.prototype._renderWebGL = function(renderSession)
{
    // if the sprite is not visible or the alpha is 0 then no need to render this element
    if (!this.visible || this.alpha <= 0 || !this.renderable) return;

    var i, j;
    if (this.softClip) {
        SoftClipManager.getManager(renderSession).pushPolygon(this.softClip);
    }
    // do a quick check to see if this element has a mask or a filter.
    if (this.maskPixel) {
        var spriteBatch =  renderSession.spriteBatch;
        spriteBatch.flush();
        renderSession.filterManager.pushFilter(this.maskPixel);
        for (i = 0; i < this.children.length; i++)
        {
            this.children[i]._renderWebGL(renderSession);
        }
        spriteBatch.stop();
        renderSession.filterManager.popFilter();
        spriteBatch.start();
    }
    else if (this._graphicsFilter || this._mask || this._filters) {
        var spriteBatch =  renderSession.spriteBatch;

        if (this._graphicsFilter) {
            spriteBatch.flush();
            renderSession.filterManager.pushFilter(this._graphicsFilter);
        }

        // push filter first as we need to ensure the stencil buffer is correct for any masking
        if (this._filters && !this.filterSelf)
        {
            spriteBatch.flush();
            renderSession.filterManager.pushFilter(this._filterBlock);
        }

        if (this._mask)
        {
            spriteBatch.stop();
            renderSession.maskManager.pushMask(this.mask, renderSession);
            spriteBatch.start();
        }
        if (this._filters && this.filterSelf)
        {
            spriteBatch.stop();
            //renderSession.filterManager.pushFilter(this._filterBlock);
            var oldTexture = this.texture.baseTexture._glTextures[renderSession.gl.id];
            var texture = renderSession.filterManager.buildFilterTexture(renderSession, this._filterBlock, this);
            spriteBatch.start();
            var olduvs = this.texture._uvs;
            if (texture) {
                this.texture.baseTexture._glTextures[renderSession.gl.id] = texture.texture;
            }
            this._renderWebGLImpl(renderSession);
            spriteBatch.flush();
            if (texture) {
                this.texture.baseTexture._glTextures[renderSession.gl.id] = oldTexture;
                renderSession.filterManager.texturePool.push(texture);
                this.texture._uvs = olduvs;
            }
        }
        else {
            this._renderWebGLImpl(renderSession);
        }
        // add this sprite to the batch

        // now loop through the children and make sure they get rendered
        for (i = 0; i < this.children.length; i++)
        {
            this.children[i]._renderWebGL(renderSession);
        }

        // time to stop the sprite batch as either a mask element or a filter draw will happen next
        spriteBatch.stop();
        if (this._mask) renderSession.maskManager.popMask(this._mask, renderSession);
        if (this._filters && !this.filterSelf) renderSession.filterManager.popFilter();
        if (this._graphicsFilter) renderSession.filterManager.popFilter();
        spriteBatch.start();
    }
    else
    {
        this._renderWebGLImpl(renderSession);
        // simple render children!
        for (i = 0; i < this.children.length; i++)
        {
            this.children[i]._renderWebGL(renderSession);
        }

    }

    if (this.softClip) {
        SoftClipManager.getManager(renderSession).popPolygon();
    }
};


PIXI.WebGLStencilManager.prototype.pushSpriteStencil = function(sprite, renderSession)
{
    var gl = this.gl;
    if(this.stencilStack.length === 0)
    {
        gl.enable(gl.STENCIL_TEST);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        this.reverse = true;
        this.count = 0;
    }

    this.stencilStack.push(sprite);

    var level = this.count;

    gl.colorMask(false, false, false, false);

    gl.stencilFunc(gl.ALWAYS,0,0xFF);
    gl.stencilOp(gl.KEEP,gl.KEEP,gl.INVERT);

    if(!this.reverse)
    {
        gl.stencilFunc(gl.EQUAL, 0xFF - level, 0xFF);
        gl.stencilOp(gl.KEEP,gl.KEEP,gl.DECR);
    }
    else
    {
        gl.stencilFunc(gl.EQUAL,level, 0xFF);
        gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);
    }
    sprite._renderWebGLImpl(renderSession);
    renderSession.spriteBatch.flush();
    //gl.drawElements(gl.TRIANGLE_STRIP,  webGLData.indices.length, gl.UNSIGNED_SHORT, 0 );

    if(!this.reverse)
    {
        gl.stencilFunc(gl.EQUAL,0xFF-(level+1), 0xFF);
    }
    else
    {
        gl.stencilFunc(gl.EQUAL,level+1, 0xFF);
    }

    gl.colorMask(true, true, true, true);
    gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);

    this.count++;
};

/**
 * @method popStencil
 * @param graphics {Graphics}
 * @param webGLData {Array}
 * @param renderSession {Object}
 */
PIXI.WebGLStencilManager.prototype.popSpriteStencil = function(sprite, renderSession)
{
    var gl = this.gl;
    this.stencilStack.pop();

    this.count--;

    if(this.stencilStack.length === 0)
    {
        // the stack is empty!
        gl.disable(gl.STENCIL_TEST);

    }
    else
    {

        var level = this.count;
        gl.colorMask(false, false, false, false);

        //  console.log("<<>>")
        if(!this.reverse)
        {
            gl.stencilFunc(gl.EQUAL, 0xFF - (level+1), 0xFF);
            gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);
        }
        else
        {
            gl.stencilFunc(gl.EQUAL,level+1, 0xFF);
            gl.stencilOp(gl.KEEP,gl.KEEP,gl.DECR);
        }

        sprite._renderWebGLImpl(renderSession);
        renderSession.spriteBatch.flush();
        if(!this.reverse)
        {
            gl.stencilFunc(gl.EQUAL,0xFF-(level), 0xFF);
        }
        else
        {
            gl.stencilFunc(gl.EQUAL,level, 0xFF);
        }

        gl.colorMask(true, true, true, true);
        gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);
    }
};

/**
 * 根据裁切方式选择绘制方式
 * @param renderSession
 * @private
 */
PIXI.Sprite.prototype._renderWebGLImpl = function(renderSession) {
    var clipMgr = renderSession.softClipManager;
    var spriteBatch =  renderSession.spriteBatch;
    if (clipMgr && clipMgr.needClip) {
        var texture = this.texture;
        var resolution = texture.baseTexture.resolution;
        var worldTransform = this.worldTransform;
        var uvs = texture._uvs;
        if (! uvs) return;
        var a = worldTransform.a / resolution;
        var b = worldTransform.b / resolution;
        var c = worldTransform.c / resolution;
        var d = worldTransform.d / resolution;
        var tx = worldTransform.tx;
        var ty = worldTransform.ty;
        var w0, w1, h0, h1;
        var aX = this.anchor.x;
        var aY = this.anchor.y;
        if (texture.trim)
        {
            // if the sprite is trimmed then we need to add the extra space before transforming the sprite coords..
            var trim = texture.trim;

            w1 = trim.x - aX * trim.width;
            w0 = w1 + texture.crop.width;

            h1 = trim.y - aY * trim.height;
            h0 = h1 + texture.crop.height;

        }
        else
        {
            w0 = (texture.frame.width ) * (1-aX);
            w1 = (texture.frame.width ) * -aX;

            h0 = texture.frame.height * (1-aY);
            h1 = texture.frame.height * -aY;
        }
        var tint = this.tint;
        tint = (tint >> 16) + (tint & 0xff00) + ((tint & 0xff) << 16) +
        (this.worldAlpha * 255 << 24);

        clipMgr.renderSprite(renderSession, this,
            w1, h1, w0, h0,
            uvs.x0, uvs.y0, uvs.x2, uvs.y2,
            a, b, c, d, tx, ty,
            tint);
    }
    else {
        spriteBatch.render(this);
    }
};

/**
 * Renders the object using the Canvas renderer
 *
 * @method _renderCanvas
 * @param renderSession {RenderSession}
 * @private
 */
PIXI.Sprite.prototype._renderCanvas = function(renderSession)
{
    // If the sprite is not visible or the alpha is 0 then no need to render this element
    if (this.visible === false || this.alpha === 0 || this.renderable === false || this.texture.crop.width <= 0 || this.texture.crop.height <= 0) return;

    if (this.maskPixel) {
        var bufferPool = renderSession.bufferPool || ( renderSession.bufferPool = []);
        var oldContext = renderSession.context;
        var oldOffX = (oldContext.globalOffX || 0);
        var oldOffY = (oldContext.globalOffY || 0);

        var filterArea = this.maskPixel.target.filterArea || this.maskPixel.target.getBounds();
        var minX = Math.max(oldOffX, filterArea.x);
        var minY = Math.max(oldOffY, filterArea.y);
        var maxX = Math.min(filterArea.x + filterArea.width, oldContext.canvas.width + oldOffX);
        var maxY = Math.min(filterArea.y + filterArea.height, oldContext.canvas.height + oldOffY);
        filterArea.x = minX;
        filterArea.y = minY;
        filterArea.width = maxX - minX;
        filterArea.height = maxY - minY;

        var canvasBuffer =  bufferPool.pop();
        if (!canvasBuffer) {
            canvasBuffer = new PIXI.CanvasBuffer(renderSession.context.canvas.width * renderSession.resolution, renderSession.context.canvas.height * renderSession.resolution);
            canvasBuffer.context._setTransform = canvasBuffer.context.setTransform;
            canvasBuffer.context.setTransform = function(a, b, c, d, tx, ty) {
                this._setTransform(a, b, c, d, tx - (this.globalOffX || 0), ty - (this.globalOffY || 0));
            };
        }
        canvasBuffer.resize(filterArea.width * renderSession.resolution, filterArea.height * renderSession.resolution);
        canvasBuffer.context.clearRect(0, 0, filterArea.width * renderSession.resolution, filterArea.height * renderSession.resolution);
        canvasBuffer.context.globalOffX = filterArea.x * renderSession.resolution + oldOffX;
        canvasBuffer.context.globalOffY = filterArea.y * renderSession.resolution + oldOffY;
        renderSession.context = canvasBuffer.context;
    }

    if (this.blendMode !== renderSession.currentBlendMode)
    {
        renderSession.currentBlendMode = this.blendMode;
        renderSession.context.globalCompositeOperation = PIXI.blendModesCanvas[renderSession.currentBlendMode];
    }

    if (this._mask)
    {
        renderSession.maskManager.pushMask(this._mask, renderSession);
    }

    //  Ignore null sources
    if (this.texture.valid)
    {
        var resolution = this.texture.baseTexture.resolution / renderSession.resolution;

        renderSession.context.globalAlpha = this.worldAlpha;

        //  If smoothingEnabled is supported and we need to change the smoothing property for this texture
        if (renderSession.smoothProperty && renderSession.scaleMode !== this.texture.baseTexture.scaleMode)
        {
            renderSession.scaleMode = this.texture.baseTexture.scaleMode;
            renderSession.context[renderSession.smoothProperty] = (renderSession.scaleMode === PIXI.scaleModes.LINEAR);
        }

        //  If the texture is trimmed we offset by the trim x/y, otherwise we use the frame dimensions
        var dx = (this.texture.trim) ? this.texture.trim.x - this.anchor.x * this.texture.trim.width : this.anchor.x * -this.texture.frame.width;
        var dy = (this.texture.trim) ? this.texture.trim.y - this.anchor.y * this.texture.trim.height : this.anchor.y * -this.texture.frame.height;

        //  Allow for pixel rounding
        if (renderSession.roundPixels)
        {
            renderSession.context.setTransform(
                this.worldTransform.a,
                this.worldTransform.b,
                this.worldTransform.c,
                this.worldTransform.d,
                (this.worldTransform.tx * renderSession.resolution) | 0,
                (this.worldTransform.ty * renderSession.resolution) | 0);
            dx = dx | 0;
            dy = dy | 0;
        }
        else
        {
            renderSession.context.setTransform(
                this.worldTransform.a,
                this.worldTransform.b,
                this.worldTransform.c,
                this.worldTransform.d,
                this.worldTransform.tx * renderSession.resolution,
                this.worldTransform.ty * renderSession.resolution);
        }
        if (!this.maskPixel) {
            if (this.tint !== 0xFFFFFF) {
                if (this.cachedTint !== this.tint) {
                    this.cachedTint = this.tint;
                    this.tintedTexture = PIXI.CanvasTinter.getTintedTexture(this, this.tint);
                }

                renderSession.drawCount++;
                renderSession.context.drawImage(
                    this.tintedTexture,
                    0,
                    0,
                    this.texture.crop.width,
                    this.texture.crop.height,
                    dx / resolution,
                    dy / resolution,
                    this.texture.frame.width / resolution,
                    this.texture.frame.height / resolution);
            }
            else {
                renderSession.drawCount++;
                renderSession.context.drawImage(
                    this.texture.baseTexture.source,
                    this.texture.crop.x,
                    this.texture.crop.y,
                    this.texture.crop.width,
                    this.texture.crop.height,
                    dx / resolution,
                    dy / resolution,
                    this.texture.frame.width / resolution,
                    this.texture.frame.height / resolution);
            }
        }
    }

    // OVERWRITE
    for (var i = 0; i < this.children.length; i++)
    {
        this.children[i]._renderCanvas(renderSession);
    }

    if (this._mask)
    {
        renderSession.maskManager.popMask(renderSession);
    }

    if (this.maskPixel && this.texture.valid) {
        var context = renderSession.context;
        context.globalCompositeOperation = 'destination-in';
        //  Allow for pixel rounding
        if (renderSession.roundPixels)
        {
            context.setTransform(
                this.worldTransform.a,
                this.worldTransform.b,
                this.worldTransform.c,
                this.worldTransform.d,
                (this.worldTransform.tx * renderSession.resolution) | 0,
                (this.worldTransform.ty * renderSession.resolution) | 0);
            dx = dx | 0;
            dy = dy | 0;
        }
        else
        {
            context.setTransform(
                this.worldTransform.a,
                this.worldTransform.b,
                this.worldTransform.c,
                this.worldTransform.d,
                this.worldTransform.tx * renderSession.resolution,
                this.worldTransform.ty * renderSession.resolution);
        }
        renderSession.drawCount++;
        context.drawImage(
            this.texture.baseTexture.source,
            this.texture.crop.x,
            this.texture.crop.y,
            this.texture.crop.width,
            this.texture.crop.height,
            dx / resolution,
            dy / resolution,
            this.texture.crop.width / resolution,
            this.texture.crop.height / resolution);

        context.globalCompositeOperation = 'source-over';

        renderSession.context = oldContext;
        if (renderSession.roundPixels)
        {
            renderSession.context.setTransform(
                1, 0, 0, 1,
                filterArea.x  * renderSession.resolution | 0,
                filterArea.y  * renderSession.resolution| 0);
        }
        else
        {
            renderSession.context.setTransform(
                1, 0, 0, 1,
                filterArea.x * renderSession.resolution,
                filterArea.y * renderSession.resolution);
        }
        renderSession.drawCount++;
        renderSession.context.drawImage(canvasBuffer.canvas,
            0, 0, canvasBuffer.canvas.width, canvasBuffer.canvas.height,
            0, 0, canvasBuffer.canvas.width, canvasBuffer.canvas.height);
        bufferPool.push(canvasBuffer);
    }
};
