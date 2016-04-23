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
 * 废除了原来的边界裁切
 *
 * @method
 * @memberof Phaser.Sprite
 * @return {boolean} True if the Sprite was rendered, otherwise false.
 */
Phaser.Sprite.prototype.preUpdate = function() {
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
        var worldX = (this.parent.position.x + this.position.x) * this.worldTransform.a;
        var worldY = (this.parent.position.y + this.position.y) * this.worldTransform.d;
        this.world.setTo(worldX, worldY);
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

    // 生命周期调度
    if (this.lifespan > 0)
    {
        this.lifespan -= this.game.time.physicsElapsedMS;
        if (this.lifespan <= 0)
        {
            this.kill();
            return false;
        }
    }

    // 主调度
    this.previousPosition.set(this.world.x, this.world.y);
    this.previousRotation = this.rotation;
    this.world.setTo(this.game.camera.x + this.worldTransform.tx, this.game.camera.y + this.worldTransform.ty);
    this.renderOrderID = this.game.stage.currentRenderOrderID++;

    if (this.animations)
    {
        // 动作驱动
        this.animations.update();
    }

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
Phaser.Sprite.prototype.update = function() {
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
Phaser.Sprite.prototype.postUpdate = function() {
    if (this.key instanceof Phaser.BitmapData)
    {
        this.key.render();
    }

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

    var i = this.children.length;
    while (i--)
    {
        if (this.children[i].visible)
            this.children[i].postUpdate();
    }
};
