/**
 * @author weism
 * copyright 2015 Qcplay All Rights Reserved.
 */

/**
 * hackpp
 * 覆盖掉原来phaser的帧调度
 */

/**
 * The core preUpdate - as called by World.
 * @method Phaser.Group#preUpdate
 * @protected
 */
Phaser.Group.prototype.preUpdate = function () {
    var qc = this._qc;
    if (qc && qc.static) return true;

    if (qc) {
        if (qc.preUpdate) qc.preUpdate();

        // 脚本调度
        var scripts = qc.scripts;
        var i = scripts.length;
        while (i--) {
            var script = scripts[i];
            if (!script || !script._enable || !script.__hadUpdateOrRender || !script.preUpdate) continue;

            // 如果当前处于editor模式，并且本脚本没有说明是在editor模式下运行，就不要调度了
            if (qc.game.device.editor === true && script.runInEditor !== true) continue;

            // 调度之
            script.preUpdate();

            // 节点在脚本中析构了，就不继续调度了
            if (!this.visible) return;
        }
    }
    var children = this.children;
    var i = children.length;
    while (i--)
    {
        if (!children[i]) continue;
        if (children[i].visible) {
            children[i].preUpdate();
        }
        else {
            children[i].renderOrderID = -1;
        }
    }

    return true;
};

/**
 * The core update - as called by World.
 * @method Phaser.Group#update
 * @protected
 */
Phaser.Group.prototype.update = function () {
    var qc = this._qc;
    if (qc && qc.static) return true;

    if (qc) {
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

    var children = this.children;
    var i = children.length;
    while (i--)
    {
        if (children[i] && children[i].visible)
            children[i].update();
    }
};

/**
 * The core postUpdate - as called by World.
 * @method Phaser.Group#postUpdate
 * @protected
 */
Phaser.Group.prototype.postUpdate = function () {
    //  Fixed to Camera?
    if (this.fixedToCamera)
    {
        this.x = this.game.camera.view.x + this.cameraOffset.x;
        this.y = this.game.camera.view.y + this.cameraOffset.y;
    }

    var qc = this._qc;
    if (qc && qc.static) return;

    if (qc) {
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

    var children = this.children;
    var i = children.length;
    while (i--)
    {
        if (children[i] && children[i].visible)
            children[i].postUpdate();
    }
};
