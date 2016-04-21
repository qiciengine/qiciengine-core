/**
 * @author chenx
 * @date 2015.12.23
 * copyright 2015 Qcplay All Rights Reserved.
 *
 * Animator 脚本组件
 */

// qc.ActionManager类定义
var Animator = defineBehaviour('qc.Animator', qc.Behaviour, function() {
    var self = this;

    // Animator 资源映射(包含 action 和 actionManager 两种资源)
    self.animatorMap = {};
    self.animatorList = [];

    // 记录 action 或 actionManager 资源列表
    self.animators = null;

    self.runInEditor = true;
},{
    animators : qc.Serializer.ANIMATORS
});

// 菜单上的显示
Animator.__menu = 'Action/Animator';

Object.defineProperties(Animator.prototype, {
    // 设置 animators，解析 animators 资源，创建 action 或 actionManager 对象映射
    animators : {
        get : function() { return this._animators; },
        set : function(v) {
            for (var i = 0; i < this.animatorList.length; i++)
            {
                var animator = this.animatorList[i];
                if (animator)
                    animator.destroy();
            }
            this.animatorMap = {};
            this.animatorList = [];

            this._animators = v;
            if (!v)
                return;

            for (var i = 0; i < v.length; i++)
            {
                var asset = v[i];
                if (!asset)
                    continue;

                // 还原出 action 或 actionManager 对象
                if (asset instanceof qc.ActionManagerAsset)
                    this.animatorList[i] = qc.ActionManager.restoreBundle(asset, this.game, !this.game.serializer.isRestoring);
                else if (asset instanceof qc.ActionAsset)
                    this.animatorList[i] = qc.Action.restoreBundle(asset, this.game, !this.game.serializer.isRestoring);

                if (!this.animatorList[i].targetLocked)
                    // 对象不锁定目标，则将脚本挂载对象作为 animator 的目标对象
                    this.animatorList[i].targetObject = this.gameObject;

                var name = this.animatorList[i].name;
                if (this.animatorMap[name])
                    this.gameObject.game.log.error('Exist duplicate action\'s name: {0}', name);
                this.animatorMap[name] = this.animatorList[i];
            }
        }
    },
});

// 初始化
Animator.prototype.awake = function() {

    if (this.animatorList.length < 1)
        return;

    for (var i = 0; i < this.animatorList.length; i++)
        if (this.animatorList[i])
            this.animatorList[i].awake();
};

// 帧调度
Animator.prototype.update = function() {

    for (var i = 0; i < this.animatorList.length; i++)
    {
        var animator = this.animatorList[i];
        if (!animator || !animator.isRunning)
            continue;

        // 更新 action
        animator.update();
    }
};

// 根据名字取得 action 对象
Animator.prototype.getAction = function(nameOrIndex) {
    return this.animatorMap[nameOrIndex] || this.animatorList[nameOrIndex];
}

// 开始播放
Animator.prototype.play = function(nameOrIndex, targetObject, fromBegin) {

    nameOrIndex = nameOrIndex || 0;
    var animator = this.getAction(nameOrIndex);
    if (!animator)
        return;

    targetObject = targetObject || this.gameObject;
    fromBegin = fromBegin || true;
    animator.playAction(targetObject, fromBegin);
};

// 停止播放
Animator.prototype.stop = function(nameOrIndex) {
    nameOrIndex = nameOrIndex || 0;
    var animator = this.getAction(nameOrIndex);
    if (!animator)
        return;

    animator.stop();
}

// 移除组件
Animator.prototype.destroy = function() {
    this.animators = null;
    qc.Behaviour.prototype.destroy.call(this);
};
