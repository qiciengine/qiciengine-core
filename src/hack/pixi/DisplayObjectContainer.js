/**
 * @hack 替换pixi的_renderWebGL用来支持 softClip
 */
/**
 * Renders the object using the WebGL renderer
 *
 * @method _renderWebGL
 * @param renderSession {RenderSession}
 * @private
 */
PIXI.DisplayObjectContainer.prototype._renderWebGL = function(renderSession)
{
    if (!this.visible || this.alpha <= 0) return;

    if (this._cacheAsBitmap)
    {
        this._renderCachedSprite(renderSession);
        return;
    }

    var i;

    if (this.softClip) {
        SoftClipManager.getManager(renderSession).pushPolygon(this.softClip);
    }
    var skipRenderChildren = false;
    if (this._graphicsFilter || this._mask || this._filters)
    {
        if (this._graphicsFilter) {
            renderSession.spriteBatch.flush();
            renderSession.filterManager.pushFilter(this._graphicsFilter);
        }

        // push filter first as we need to ensure the stencil buffer is correct for any masking
        if (this._filters && !this.filterSelf)
        {
            renderSession.spriteBatch.flush();
            renderSession.filterManager.pushFilter(this._filterBlock);
        }

        if (this._mask)
        {
            renderSession.spriteBatch.stop();
            renderSession.maskManager.pushMask(this.mask, renderSession);
            renderSession.spriteBatch.start();
        }

        if (this._renderSelfWebGL) {
            skipRenderChildren = this._renderSelfWebGL(renderSession);
        }

        // simple render children!
        if (!skipRenderChildren) {
            for (i = 0; i < this.children.length; i++)
            {
                this.children[i]._renderWebGL(renderSession);
            }
        }

        renderSession.spriteBatch.stop();

        if (this._mask) renderSession.maskManager.popMask(this._mask, renderSession);
        if (this._filters && !this.filterSelf) renderSession.filterManager.popFilter();
        if (this._graphicsFilter) renderSession.filterManager.popFilter();
        renderSession.spriteBatch.start();
    }
    else
    {
        if (this._renderSelfWebGL) {
            skipRenderChildren = this._renderSelfWebGL(renderSession);
        }

        // simple render children!
        if (!skipRenderChildren) {
            for (i = 0; i < this.children.length; i++)
            {
                this.children[i]._renderWebGL(renderSession);
            }
        }
    }
    if (this.softClip) {
        SoftClipManager.getManager(renderSession).popPolygon();
    }
};

/**
* Renders the object using the Canvas renderer
*
* @method _renderCanvas
* @param renderSession {RenderSession}
* @private
*/
PIXI.DisplayObjectContainer.prototype._renderCanvas = function(renderSession)
{
    if (this.visible === false || this.alpha === 0) return;

    if (this._cacheAsBitmap)
    {
        this._renderCachedSprite(renderSession);
        return;
    }
    var skipRenderChildren = false;
    if (this._mask)
    {
        renderSession.maskManager.pushMask(this._mask, renderSession);
    }

    if (this._renderSelfCanvas) {
        skipRenderChildren = this._renderSelfCanvas(renderSession);
    }

    if (!skipRenderChildren) {
        for (var i = 0; i < this.children.length; i++)
        {
            this.children[i]._renderCanvas(renderSession);
        }
    }

    if (this._mask)
    {
        renderSession.maskManager.popMask(renderSession);
    }
};


PIXI.DisplayObjectContainer.prototype.addChildAt = function(child, index)
{
    if(index >= 0 && index <= this.children.length)
    {
        if(child.parent)
        {
            child.parent.removeChild(child);
        }

        child.parent = this;

        this.children.splice(index, 0, child);
        this._qc && this._qc._dispatchChildrenChanged('add', [child._qc]);
        if(this.stage)child.setStageReference(this.stage);

        return child;
    }
    else
    {
        throw new Error(child + 'addChildAt: The index '+ index +' supplied is out of bounds ' + this.children.length);
    }
};

/**
 * Swaps the position of 2 Display Objects within this container.
 *
 * @method swapChildren
 * @param child {DisplayObject}
 * @param child2 {DisplayObject}
 */
PIXI.DisplayObjectContainer.prototype.swapChildren = function(child, child2)
{
    if(child === child2) {
        return;
    }

    var index1 = this.getChildIndex(child);
    var index2 = this.getChildIndex(child2);

    if(index1 < 0 || index2 < 0) {
        throw new Error('swapChildren: Both the supplied DisplayObjects must be a child of the caller.');
    }

    this.children[index1] = child2;
    this.children[index2] = child;
    this._qc && this._qc._dispatchChildrenChanged('order', [child._qc, child2._qc]);
    child.displayChanged(qc.DisplayChangeStatus.ORDER);
    child2.displayChanged(qc.DisplayChangeStatus.ORDER);
};

/**
 * Changes the position of an existing child in the display object container
 *
 * @method setChildIndex
 * @param child {DisplayObject} The child DisplayObject instance for which you want to change the index number
 * @param index {Number} The resulting index number for the child display object
 */
PIXI.DisplayObjectContainer.prototype.setChildIndex = function(child, index)
{
    if (index < 0 || index >= this.children.length)
    {
        throw new Error('The supplied index is out of bounds');
    }
    var currentIndex = this.getChildIndex(child);
    this.children.splice(currentIndex, 1); //remove from old position
    this.children.splice(index, 0, child); //add at new position
    this._qc && this._qc._dispatchChildrenChanged('order', [child._qc]);
    child.displayChanged(qc.DisplayChangeStatus.ORDER);
};

/**
 * Removes a child from the specified index position.
 *
 * @method removeChildAt
 * @param index {Number} The index to get the child from
 * @return {DisplayObject} The child that was removed.
 */
PIXI.DisplayObjectContainer.prototype.removeChildAt = function(index)
{
    var child = this.getChildAt( index );
    child.maybeOutWorld();
    if(this.stage)
        child.removeStageReference();

    child.parent = undefined;
    this.children.splice( index, 1 );
    this._qc && this._qc._dispatchChildrenChanged('remove', [child._qc]);

    return child;
};

/**
 * 提供 remove 方法，这样节点移除的时候就不需要判断 if remove then remove else removeChild
 */
PIXI.DisplayObjectContainer.prototype.remove = function(child)
{
    return this.removeChild(child);
};

/**
 * Removes all children from this container that are within the begin and end indexes.
 *
 * @method removeChildren
 * @param beginIndex {Number} The beginning position. Default value is 0.
 * @param endIndex {Number} The ending position. Default value is size of the container.
 */
PIXI.DisplayObjectContainer.prototype.removeChildren = function(beginIndex, endIndex)
{
    var begin = beginIndex || 0;
    var end = typeof endIndex === 'number' ? endIndex : this.children.length;
    var range = end - begin;

    if (range > 0 && range <= end)
    {
        var removed = this.children.splice(begin, range);
        var removedQCNode = [];
        for (var i = 0; i < removed.length; i++) {
            var child = removed[i];
            child.maybeOutWorld();
            if(this.stage)
                child.removeStageReference();
            child.parent = undefined;
            if (child._qc) {
                removedQCNode.push(child._qc);
            }
        }
        this._qc && this._qc._dispatchChildrenChanged('remove', removedQCNode);
        return removed;
    }
    else if (range === 0 && this.children.length === 0)
    {
        this._qc && this._qc._dispatchChildrenChanged('remove', []);
        return [];
    }
    else
    {
        throw new Error( 'removeChildren: Range Error, numeric values are outside the acceptable range' );
    }
};

/**
 * 获取本地节点范围
 * @returns {Rectangle}
 */
PIXI.DisplayObjectContainer.prototype.getLocalBounds = function()
{
    var matrixCache = this.worldTransform;
    this._isSubNeedCalcTransform = true;
    this.worldTransform = PIXI.identityMatrix;

    for(var i=0,j=this.children.length; i<j; i++)
    {
        this.children[i].updateTransform();
    }

    var bounds = this.getBounds();

    this.worldTransform = matrixCache;
    this._isSubNeedCalcTransform = true;
    this._isNotNeedCalcTransform = false;
    return bounds;
};

PIXI.DisplayObjectContainer.prototype.displayMaybeOutWorld = PIXI.DisplayObject.prototype.maybeOutWorld;

/**
 * 可能被移出世界，并不在进入世界显示时
 */
PIXI.DisplayObjectContainer.prototype.maybeOutWorld = function() {
    this.displayMaybeOutWorld();
    var children = this.children;
    for(var i=0,j=children.length; i<j; i++)
    {
        children[i].maybeOutWorld();
    }
};
