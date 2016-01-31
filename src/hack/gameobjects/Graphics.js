/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * hackpp
 * 覆盖掉原来phaser的帧调度
 */

/**
 * Automatically called by World.preUpdate.
 *
 * @method
 * @memberof Phaser.Graphics
 * @return {boolean} True if the Graphics was rendered, otherwise false.
 */
Phaser.Graphics.prototype.preUpdate = function() {
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

    if (this.fresh) {
        this.world.setTo(this.parent.position.x + this.position.x, this.parent.position.y + this.position.y);
        this.worldTransform.tx = this.world.x;
        this.worldTransform.ty = this.world.y;

        this.previousPosition.set(this.world.x, this.world.y);
        this.previousRotation = this.rotation;

        if (qc)
            qc._isTransformDirty = true;
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
 * Override this method in your own custom objects to handle any update requirements.
 * It is called immediately after `preUpdate` and before `postUpdate`.
 * Remember if this Game Object has any children you should call update on those too.
 *
 * @method
 */
Phaser.Graphics.prototype.update = function() {
    var qc = this._qc;
    if (qc && !qc.static) {
        if (qc.update) qc.update();

        // 脚本调度
        var scripts = qc.scripts;
        var i = scripts.length;
        while (i--) {
            var script = scripts[i];
            if (!script || !script._enable || !script.__hadUpdateOrRender || !script.update) continue;

            // 如果当前处于editor模式，并且本脚本没有说明是在editor模式下运行，就不要调度了
            if (qc.game.device.editor === true && script.runInEditor !== true) continue;

            // 调度之
            script.update();

            // 节点在脚本中析构了，就不继续调度了
            if (!this.visible) return;
        }
    }

    var i = this.children.length;
    while (i--)
    {
        if (this.children[i].visible) {
            this.children[i].update();
        }
    }
};

/**
 * Internal method called by the World postUpdate cycle.
 *
 * @method
 * @protected
 */
Phaser.Graphics.prototype.postUpdate = function() {
    if (this.key instanceof Phaser.BitmapData)
    {
        this.key.render();
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

    var i = this.children.length;
    while (i--)
    {
        if (this.children[i].visible)
            this.children[i].postUpdate();
    }
};

/**
 * 修改原Graphics的dirty
 */
Object.defineProperty(PIXI.Graphics.prototype, 'dirty', {
    get : function() { return this._dirty; },
    set : function(v) {
        if (v === this._dirty) {
            return;
        }
        this._dirty = v;
        this.displayChanged(qc.DisplayChangeStatus.RECALC_MASK);
    }
});

PIXI.Graphics.prototype._updateBounds = function() {
    var self = this,
        wt = self.worldTransform,
        parent = self.parent;

    var parentStatus = parent ? parent._displayChangeStatus : 0;

    if (self._displayChangeStatus == null) {
        self._displayChangeStatus = DisplayChangeStatus.SHOW;
    }
    var dirtyStatus = self._displayChangeStatus;

    // 自身属性的变化，在变化时进行设置，这里主要是继承父节点的变化
    // 父节点的偏移，缩放，旋转和visible发生变化时，自己需要继承
    dirtyStatus = dirtyStatus | (parentStatus & DisplayChangeStatus.INHERIT_MASK);
    if (!self.worldVisible && !(dirtyStatus & DisplayChangeStatus.HIDE)){
        // 不可见且不是HIDE事件发生的帧则忽略后续计算
        return true;
    }
    
    if (dirtyStatus === 0)
        return false;

    // 将当前范围信息记入历史
    self._lastWorldBounds || (self._lastWorldBounds = []);
    self._currWorldBounds && self._lastWorldBounds.push(self._currWorldBounds);
    self._displayChangeStatus = dirtyStatus;
    self._currentBounds = null;
    var graphicsBounds = this.getBounds();
    self._currWorldBounds = {
        x : graphicsBounds.x,
        y : graphicsBounds.y,
        tx : graphicsBounds.x,
        ty : graphicsBounds.y,
        width : graphicsBounds.width,
        height : graphicsBounds.height,
        area : graphicsBounds.width * graphicsBounds.height
    };
    self._dirtyBounds = true;
    return false;
};